/**
 * Seeds EFP list ops that the baked-in `demoGraph` scenario does not exercise, so the integration
 * tests can assert the EFP handler's trickier behaviors against a real indexed chain:
 *
 *  - tag de-duplication (ADD_TAG of an existing tag is a no-op),
 *  - the embedded-tags cascade (REMOVE_RECORD drops the record and its tags; re-ADD starts fresh),
 *  - junk-suffixed REMOVE_RECORD still deleting the canonically-keyed record, and
 *  - the `user` role being cleared when its metadata value is set to a malformed (non-20-byte) value.
 *
 * Everything is driven onto one freshly-minted list (a dedicated Anvil account that `demoGraph`
 * never touches, so it does not perturb the demoGraph assertions), and each record is anchored by a
 * unique synthetic target address so tests can look records up by `recordData` without depending on
 * a token id. The synthetic targets are not indexed ENS accounts, so they also exercise the
 * `EfpListRecord.account` null path.
 */

import {
  type Address,
  concatHex,
  createTestClient,
  createWalletClient,
  type Hex,
  http,
  numberToHex,
  pad,
  parseEther,
  publicActions,
  stringToHex,
} from "viem";
import { mnemonicToAccount } from "viem/accounts";

import { ensTestEnvChain } from "@ensnode/datasources";
import { efpContracts } from "@ensnode/datasources/devnet";

import { efpSeedRoleUser, efpSeedTargets } from "../devnet/fixtures";
import { seedReceiptWaitOptions } from "./index";

/** The canonical Anvil mnemonic; the EFP devnet seeds funded accounts from it (indices 0-9). */
const DEVNET_MNEMONIC = "test test test test test test test test test test test junk";

/**
 * Anvil account index 6 — funded, but used by neither the `demoGraph` scenario nor `seedDevnet`,
 * so the list it mints and the records on it are isolated from every other assertion.
 */
const seedActor = mnemonicToAccount(DEVNET_MNEMONIC, { addressIndex: 6 });

// --- EFP on-chain encodings (mirrored from the contracts repo's scripts/devnet/encoding.ts) ---

const LSL_VERSION = 0x01;
const LSL_TYPE_L1 = 0x01;
const LIST_OP_VERSION = 0x01;
const RECORD_VERSION = 0x01;
const RECORD_TYPE_ADDRESS = 0x01;
const Opcode = { ADD_RECORD: 0x01, REMOVE_RECORD: 0x02, ADD_TAG: 0x03 } as const;

const byte = (value: number): Hex => numberToHex(value, { size: 1 });

/** version(1) | type(1) | chainId(32) | listRecords(20) | slot(32) = 86 bytes. */
function encodeListStorageLocation(chainId: number, listRecords: Address, slot: bigint): Hex {
  return concatHex([
    byte(LSL_VERSION),
    byte(LSL_TYPE_L1),
    numberToHex(BigInt(chainId), { size: 32 }),
    pad(listRecords, { size: 20 }),
    numberToHex(slot, { size: 32 }),
  ]);
}

/** version(1) | type(1) | address(20). */
const encodeAddressRecord = (address: Address): Hex =>
  concatHex([byte(RECORD_VERSION), byte(RECORD_TYPE_ADDRESS), pad(address, { size: 20 })]);

/** version(1) | opcode(1) | data. */
const encodeListOp = (opcode: number, data: Hex): Hex =>
  concatHex([byte(LIST_OP_VERSION), byte(opcode), data]);

const addRecordOp = (target: Address): Hex =>
  encodeListOp(Opcode.ADD_RECORD, encodeAddressRecord(target));
const removeRecordOp = (data: Hex): Hex => encodeListOp(Opcode.REMOVE_RECORD, data);
const addTagOp = (target: Address, tag: string): Hex =>
  encodeListOp(Opcode.ADD_TAG, concatHex([encodeAddressRecord(target), stringToHex(tag)]));

// --- minimal write ABIs (the datasources EFP ABIs declare only indexed events) ---

const minterAbi = [
  {
    type: "function",
    name: "easyMintTo",
    stateMutability: "payable",
    inputs: [
      { name: "to", type: "address" },
      { name: "listStorageLocation", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

const registryAbi = [
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "setListStorageLocation",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "listStorageLocation", type: "bytes" },
    ],
    outputs: [],
  },
  // Plain mint (mints to msg.sender, sets the storage location) — unlike easyMintTo it does NOT set
  // the minter's primary-list/user metadata, so it can add filler lists without perturbing fixtures.
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [{ name: "listStorageLocation", type: "bytes" }],
    outputs: [],
  },
] as const;

const recordsAbi = [
  {
    type: "function",
    name: "applyListOps",
    stateMutability: "nonpayable",
    inputs: [
      { name: "slot", type: "uint256" },
      { name: "ops", type: "bytes[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setMetadataValue",
    stateMutability: "nonpayable",
    inputs: [
      { name: "slot", type: "uint256" },
      { name: "key", type: "string" },
      { name: "value", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

/**
 * Mints one list (owned + managed by {@link seedActor}) and applies the op sequences above, then
 * clears the list's `user` role with a malformed metadata value. Must run after the EFP devnet
 * image has deployed the contracts and opened public minting (the `demoGraph` scenario does both).
 */
export async function seedEfpDevnet(rpcUrl: string): Promise<void> {
  const client = createWalletClient({
    chain: ensTestEnvChain,
    transport: http(rpcUrl),
    account: seedActor,
  }).extend(publicActions);

  const send = async (hash: Hex) => {
    await client.waitForTransactionReceipt({ hash, ...seedReceiptWaitOptions });
  };

  // The devnet's anvil funds only its named accounts (0-4); top up this dedicated actor so it can
  // pay for gas.
  const testClient = createTestClient({
    chain: ensTestEnvChain,
    mode: "anvil",
    transport: http(rpcUrl),
  });
  await testClient.setBalance({ address: seedActor.address, value: parseEther("100") });

  // A new list's slot is its token id; the next token id is the current total supply.
  const slot = await client.readContract({
    address: efpContracts.EFPListRegistry as Address,
    abi: registryAbi,
    functionName: "totalSupply",
  });

  const listStorageLocation = encodeListStorageLocation(
    ensTestEnvChain.id,
    efpContracts.EFPListRecords as Address,
    slot,
  );

  // Mint the list to the seed actor; easyMintTo also makes the actor the slot manager and `user`.
  await send(
    await client.writeContract({
      address: efpContracts.EFPListMinter as Address,
      abi: minterAbi,
      functionName: "easyMintTo",
      args: [seedActor.address, listStorageLocation],
    }),
  );

  const { dedup, cascade, junk } = efpSeedTargets;
  const ops: Hex[] = [
    // dedup: a second identical ADD_TAG must not duplicate the tag.
    addRecordOp(dedup),
    addTagOp(dedup, "block"),
    addTagOp(dedup, "block"),
    // cascade: REMOVE drops the record and its tags; the re-ADD starts with no tags.
    addRecordOp(cascade),
    addTagOp(cascade, "vip"),
    removeRecordOp(encodeAddressRecord(cascade)),
    addRecordOp(cascade),
    // junk: a REMOVE carrying trailing junk after the 20-byte address still deletes the record.
    addRecordOp(junk),
    removeRecordOp(concatHex([encodeAddressRecord(junk), "0xdeadbeef"])),
  ];

  await send(
    await client.writeContract({
      address: efpContracts.EFPListRecords as Address,
      abi: recordsAbi,
      functionName: "applyListOps",
      args: [slot, ops],
    }),
  );

  // Clear the `user` role: a malformed (non-20-byte) value is not an address, so it clears to null.
  await send(
    await client.writeContract({
      address: efpContracts.EFPListRecords as Address,
      abi: recordsAbi,
      functionName: "setMetadataValue",
      args: [slot, "user", "0xdead"],
    }),
  );

  // Role durability across a storage-location re-point: roles live in durable per-slot metadata, so
  // a list that moves away from its slot and back must recover the role (not stay cleared by the
  // move). Mint a second list, set its `user`, anchor it with a record, then move it away and back.
  const recordsAddress = efpContracts.EFPListRecords as Address;
  const lsl = (s: bigint) => encodeListStorageLocation(ensTestEnvChain.id, recordsAddress, s);

  const durableTokenId = await client.readContract({
    address: efpContracts.EFPListRegistry as Address,
    abi: registryAbi,
    functionName: "totalSupply",
  });

  await send(
    await client.writeContract({
      address: efpContracts.EFPListMinter as Address,
      abi: minterAbi,
      functionName: "easyMintTo",
      args: [seedActor.address, lsl(durableTokenId)],
    }),
  );
  await send(
    await client.writeContract({
      address: recordsAddress,
      abi: recordsAbi,
      functionName: "setMetadataValue",
      args: [durableTokenId, "user", efpSeedRoleUser],
    }),
  );
  await send(
    await client.writeContract({
      address: recordsAddress,
      abi: recordsAbi,
      functionName: "applyListOps",
      args: [durableTokenId, [addRecordOp(efpSeedTargets.durable)]],
    }),
  );
  // Move the list to an empty slot, then back to its original one.
  for (const targetSlot of [durableTokenId + 1000n, durableTokenId]) {
    await send(
      await client.writeContract({
        address: efpContracts.EFPListRegistry as Address,
        abi: registryAbi,
        functionName: "setListStorageLocation",
        args: [durableTokenId, lsl(targetSlot)],
      }),
    );
  }

  // Mint extra (bare) lists so the devnet holds more than 9 (token ids reach double digits). This
  // makes `efp.lists` / `Account.efp.lists` pagination exercise numeric-vs-lexicographic ordering:
  // a text tokenId would otherwise sort "10" before "2" and break the cursor. Use a plain `mint`
  // (not easyMintTo) so these fillers do not reset the actor's primary-list/user fixtures above.
  let nextTokenId = await client.readContract({
    address: efpContracts.EFPListRegistry as Address,
    abi: registryAbi,
    functionName: "totalSupply",
  });
  while (nextTokenId < 12n) {
    await send(
      await client.writeContract({
        address: efpContracts.EFPListRegistry as Address,
        abi: registryAbi,
        functionName: "mint",
        args: [lsl(nextTokenId)],
      }),
    );
    nextTokenId += 1n;
  }
}

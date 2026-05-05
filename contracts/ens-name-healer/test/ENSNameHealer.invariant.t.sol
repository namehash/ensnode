// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ENSNameHealer.sol";

/// @dev Handler contract that the Foundry invariant fuzzer calls.
///      It maintains a shadow state so invariants can be checked relative to
///      expected behaviour, not just contract-level state.
contract ENSNameHealerHandler is Test {
    ENSNameHealer internal healer;
    address internal admin;
    address internal submitter;

    /// Names that have been healed while healedStorageDisabled == false.
    mapping(bytes32 => bool) internal shadowHealed;

    /// Set to true the moment any NameHealed event was emitted while paused.
    bool public nameHealedWhilePaused;

    constructor(ENSNameHealer _healer, address _admin, address _submitter) {
        healer = _healer;
        admin = _admin;
        submitter = _submitter;
    }

    function submit(string calldata name) external {
        vm.assume(bytes(name).length > 0);
        bool paused = healer.paused();
        bool storageDisabled = healer.healedStorageDisabled();
        bytes32 node = _namehash(name);
        bool alreadyHealed = healer.healed(node);

        // Predict whether this call succeeds
        bool shouldSucceed = !paused && (storageDisabled || !alreadyHealed);

        if (shouldSucceed) {
            vm.recordLogs();
            vm.prank(submitter);
            healer.submit(name);

            if (!storageDisabled) {
                shadowHealed[node] = true;
            }

            if (paused) {
                // Should not reach here — but if it does, flag it
                Vm.Log[] memory logs = vm.getRecordedLogs();
                bytes32 sig = keccak256("NameHealed(bytes32,string,address)");
                for (uint256 i; i < logs.length; i++) {
                    if (logs[i].topics[0] == sig) {
                        nameHealedWhilePaused = true;
                    }
                }
            }
        } else {
            vm.prank(submitter);
            try healer.submit(name) {
                // unexpected success
                if (paused) nameHealedWhilePaused = true;
            } catch {}
        }
    }

    function forceResubmit(string calldata name) external {
        vm.assume(bytes(name).length > 0);
        bool paused = healer.paused();

        vm.recordLogs();
        if (!paused) {
            vm.prank(submitter);
            healer.forceResubmit(name);
        } else {
            vm.prank(submitter);
            try healer.forceResubmit(name) {
                Vm.Log[] memory logs = vm.getRecordedLogs();
                bytes32 sig = keccak256("NameHealed(bytes32,string,address)");
                for (uint256 i; i < logs.length; i++) {
                    if (logs[i].topics[0] == sig) nameHealedWhilePaused = true;
                }
            } catch {}
        }
    }

    function pause() external {
        if (!healer.paused()) {
            vm.prank(admin);
            healer.pause();
        }
    }

    function unpause() external {
        if (healer.paused()) {
            vm.prank(admin);
            healer.unpause();
        }
    }

    function setHealedStorageDisabled(bool disabled) external {
        vm.prank(admin);
        healer.setHealedStorageDisabled(disabled);
    }

    function shadowHealedFor(bytes32 node) external view returns (bool) {
        return shadowHealed[node];
    }

    // ── helpers ───────────────────────────────────────────────────────────

    /// Minimal namehash for the handler (single-label names only to keep
    /// the state space manageable).
    function _namehash(string memory name) internal pure returns (bytes32) {
        // Delegate to a simple keccak of root + label for single-label names.
        // For multi-label we use the same iterative algorithm.
        bytes memory b = bytes(name);
        bytes32 node = bytes32(0);
        uint256 end = b.length;
        for (uint256 i = b.length; i > 0; ) {
            unchecked { --i; }
            if (b[i] == "." || i == 0) {
                uint256 start = (b[i] == ".") ? i + 1 : 0;
                uint256 labelLen = end - start;
                bytes memory label = new bytes(labelLen);
                for (uint256 j = 0; j < labelLen; j++) {
                    label[j] = b[start + j];
                }
                node = keccak256(abi.encodePacked(node, keccak256(label)));
                end = i;
            }
        }
        return node;
    }
}

contract ENSNameHealerInvariantTest is Test {
    ENSNameHealer internal healer;
    ENSNameHealerHandler internal handler;

    address internal admin = makeAddr("admin");
    address internal submitter = makeAddr("submitter");

    function setUp() public {
        ENSNameHealer impl = new ENSNameHealer();
        bytes memory initData = abi.encodeCall(ENSNameHealer.initialize, (admin));
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        healer = ENSNameHealer(address(proxy));

        vm.prank(admin);
        healer.grantRole(keccak256("SUBMITTER_ROLE"), submitter);

        handler = new ENSNameHealerHandler(healer, admin, submitter);

        // Tell Foundry to only call the handler, not the contract directly.
        targetContract(address(handler));
    }

    /// Once a namehash is recorded in healed[], it must remain true.
    /// (The mapping is append-only; setHealedStorageDisabled does not clear it.)
    function invariant_healed_isMonotone() public view {
        // We can't enumerate all possible keys, so we check a fixed set of
        // well-known namehashes used throughout the test suite.
        bytes32[3] memory knownNodes = [
            keccak256(abi.encodePacked(bytes32(0), keccak256("eth"))),                   // "eth"
            keccak256(abi.encodePacked(
                keccak256(abi.encodePacked(bytes32(0), keccak256("eth"))),
                keccak256("vitalik")
            )),  // "vitalik.eth"
            keccak256(abi.encodePacked(bytes32(0), keccak256("com")))                    // "com"
        ];

        for (uint256 i; i < knownNodes.length; i++) {
            if (handler.shadowHealedFor(knownNodes[i])) {
                assertTrue(healer.healed(knownNodes[i]), "healed mapping must be monotone");
            }
        }
    }

    /// No NameHealed event must ever be emitted while the contract is paused.
    function invariant_noNameHealedWhilePaused() public view {
        assertFalse(handler.nameHealedWhilePaused(), "NameHealed emitted while paused");
    }
}

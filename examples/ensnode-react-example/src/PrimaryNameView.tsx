import type { Address, ChainId } from "enssdk";
import { useState } from "react";

import { usePrimaryName } from "@ensnode/ensnode-react";

const DEFAULT_ADDRESS: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // vitalik.eth
const MAINNET: ChainId = 1;

export function PrimaryNameView() {
  const [address, setAddress] = useState<Address>(DEFAULT_ADDRESS);
  const [input, setInput] = useState<string>(DEFAULT_ADDRESS);

  const { data, isLoading, error } = usePrimaryName({
    address,
    chainId: MAINNET,
    accelerate: true,
  });

  return (
    <div>
      <h2>Primary Name</h2>
      <p>
        Resolves the ENSIP-19 Mainnet Primary Name for an address using <code>usePrimaryName</code>.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setAddress(input as Address);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="0x..."
          style={{ width: "28rem" }}
        />
        <button type="submit">Resolve</button>
      </form>

      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <p>
          Primary Name: <strong>{data.name ?? "(none)"}</strong>
        </p>
      )}
    </div>
  );
}

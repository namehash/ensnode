// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ENSNameHealer.sol";

/// @notice Deploys ENSNameHealer behind an ERC-1967 / UUPS proxy.
///
/// Required environment variables:
///   ADMIN_ADDRESS      — address to assign DEFAULT_ADMIN_ROLE on the proxy.
///
/// Optional environment variables:
///   SUBMITTER_ADDRESS  — if set, this address is granted SUBMITTER_ROLE
///                        during deployment (saves a separate grantRole tx).
///
/// Usage:
///   forge script script/Deploy.s.sol \
///     --rpc-url $RPC_URL \
///     --broadcast \
///     --verify
contract Deploy is Script {
    function run() external {
        address admin = vm.envAddress("ADMIN_ADDRESS");
        address submitter = vm.envOr("SUBMITTER_ADDRESS", address(0));

        vm.startBroadcast();

        ENSNameHealer impl = new ENSNameHealer();
        bytes memory initData = abi.encodeCall(ENSNameHealer.initialize, (admin));
        ENSNameHealer proxy = ENSNameHealer(address(new ERC1967Proxy(address(impl), initData)));

        if (submitter != address(0)) {
            proxy.grantRole(proxy.SUBMITTER_ROLE(), submitter);
            console.log("Submitter:     ", submitter);
        }

        vm.stopBroadcast();

        console.log("Implementation:", address(impl));
        console.log("Proxy:         ", address(proxy));
    }
}

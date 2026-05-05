// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ENSNameHealer.sol";

/// @notice Deploys ENSNameHealer behind an ERC-1967 / UUPS proxy.
///
/// Required environment variables:
///   ADMIN_ADDRESS  — address to assign DEFAULT_ADMIN_ROLE on the proxy.
///
/// Usage:
///   forge script script/Deploy.s.sol \
///     --rpc-url $RPC_URL \
///     --broadcast \
///     --verify
contract Deploy is Script {
    function run() external {
        address admin = vm.envAddress("ADMIN_ADDRESS");

        vm.startBroadcast();

        ENSNameHealer impl = new ENSNameHealer();
        bytes memory initData = abi.encodeCall(ENSNameHealer.initialize, (admin));
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);

        vm.stopBroadcast();

        console.log("Implementation:", address(impl));
        console.log("Proxy:         ", address(proxy));
    }
}

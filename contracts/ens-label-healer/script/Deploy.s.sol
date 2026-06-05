// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ENSLabelHealer.sol";

/// @notice Deploys ENSLabelHealer behind an ERC-1967 / UUPS proxy.
///
/// Required environment variables:
///   OWNER_ADDRESS      — address to assign ownership on the proxy.
///
/// Usage:
///   forge script script/Deploy.s.sol \
///     --rpc-url sepolia \
///     --broadcast \
///     --verify
contract Deploy is Script {
    function run() external {
        address owner = vm.envAddress("OWNER_ADDRESS");

        vm.startBroadcast();

        ENSLabelHealer impl = new ENSLabelHealer();
        bytes memory initData = abi.encodeCall(ENSLabelHealer.initialize, (owner));
        ENSLabelHealer proxy = ENSLabelHealer(address(new ERC1967Proxy(address(impl), initData)));

        vm.stopBroadcast();

        console.log("Implementation:", address(impl));
        console.log("Proxy:         ", address(proxy));
    }
}

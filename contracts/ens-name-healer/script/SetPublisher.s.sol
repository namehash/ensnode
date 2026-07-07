// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ENSNameHealer.sol";

/// @notice Sets the publisher on an existing ENSNameHealer proxy.
///
/// Required environment variables:
///   PROXY_ADDRESS       — deployed ENSNameHealer proxy address.
///   PUBLISHER_ADDRESS   — address to assign as publisher (use zero address to pause).
///
/// Usage:
///   forge script script/SetPublisher.s.sol \
///     --rpc-url sepolia \
///     --broadcast
contract SetPublisher is Script {
    function run() external {
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");
        address newPublisher = vm.envAddress("PUBLISHER_ADDRESS");
        require(proxyAddress != address(0), "PROXY_ADDRESS must not be zero");

        ENSNameHealer proxy = ENSNameHealer(proxyAddress);

        vm.startBroadcast();
        proxy.setPublisher(newPublisher);
        vm.stopBroadcast();

        console.log("Proxy:    ", proxyAddress);
        console.log("Publisher:", newPublisher);
    }
}

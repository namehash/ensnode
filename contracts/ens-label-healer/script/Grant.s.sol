// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ENSLabelHealer.sol";

/// @notice Grants submitter permissions on an existing ENSLabelHealer proxy.
///
/// Required environment variables:
///   PROXY_ADDRESS      — deployed ENSLabelHealer proxy address.
///   SUBMITTER_ADDRESS  — address to grant as submitter.
///
/// Usage:
///   forge script script/Grant.s.sol \
///     --rpc-url sepolia \
///     --broadcast
contract Grant is Script {
    function run() external {
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");
        address submitter = vm.envAddress("SUBMITTER_ADDRESS");

        ENSLabelHealer proxy = ENSLabelHealer(proxyAddress);

        vm.startBroadcast();
        proxy.grantSubmitter(submitter);
        vm.stopBroadcast();

        console.log("Proxy:     ", proxyAddress);
        console.log("Submitter: ", submitter);
    }
}

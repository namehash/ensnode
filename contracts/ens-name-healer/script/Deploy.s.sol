// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ENSNameHealer.sol";

/// @notice Deploys ENSNameHealer behind an ERC-1967 / UUPS proxy.
///
/// Required environment variables:
///   OWNER_ADDRESS      — address to assign ownership on the proxy.
///
/// Optional environment variables:
///   PUBLISHER_ADDRESS  — initial publisher (defaults to zero address / paused).
///
/// Usage:
///   forge script script/Deploy.s.sol \
///     --rpc-url sepolia \
///     --broadcast \
///     --verify
contract Deploy is Script {
    function run() external {
        address owner = vm.envAddress("OWNER_ADDRESS");
        address publisher = vm.envOr("PUBLISHER_ADDRESS", address(0));
        require(owner != address(0), "OWNER_ADDRESS must not be zero");

        vm.startBroadcast();

        ENSNameHealer impl = new ENSNameHealer();
        bytes memory initData = abi.encodeCall(ENSNameHealer.initialize, (owner, publisher));
        ENSNameHealer proxy = ENSNameHealer(address(new ERC1967Proxy(address(impl), initData)));

        vm.stopBroadcast();

        console.log("Implementation:", address(impl));
        console.log("Proxy:         ", address(proxy));
        console.log("Publisher:     ", publisher);
    }
}

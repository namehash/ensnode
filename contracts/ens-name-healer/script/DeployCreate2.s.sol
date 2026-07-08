// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./Create2Deploy.sol";
import "../src/ENSNameHealer.sol";

/// @notice CREATE2 vanity deploy via Nick's factory. Mine salt with `script/mine-create2-salt.sh` first.
///
/// Required: OWNER_ADDRESS, CREATE2_SALT
/// Optional: PUBLISHER_ADDRESS, CREATE2_IMPL_SALT, CREATE2_PREFIX (logged for verification only)
contract DeployCreate2 is Script {
    function run() external {
        address owner = vm.envAddress("OWNER_ADDRESS");
        require(owner != address(0), "OWNER_ADDRESS must not be zero");
        address publisher = vm.envOr("PUBLISHER_ADDRESS", address(0));
        bytes32 implSalt = vm.envOr("CREATE2_IMPL_SALT", bytes32(0));
        bytes32 proxySalt = vm.envBytes32("CREATE2_SALT");

        bytes memory implInitCode = type(ENSNameHealer).creationCode;
        bytes memory initData = abi.encodeCall(ENSNameHealer.initialize, (owner, publisher));
        address implPredicted = vm.computeCreate2Address(implSalt, keccak256(implInitCode), Create2Deploy.FACTORY);
        bytes memory proxyInitCode =
            abi.encodePacked(type(ERC1967Proxy).creationCode, abi.encode(implPredicted, initData));
        address proxyPredicted = vm.computeCreate2Address(proxySalt, keccak256(proxyInitCode), Create2Deploy.FACTORY);

        vm.startBroadcast();

        address impl = implPredicted;
        if (implPredicted.code.length == 0) {
            impl = Create2Deploy.deploy(implSalt, implInitCode);
            require(impl == implPredicted, "impl address mismatch");
        } else {
            console.log("Implementation already deployed, skipping CREATE2");
        }

        address proxy = proxyPredicted;
        if (proxyPredicted.code.length == 0) {
            proxy = Create2Deploy.deploy(proxySalt, proxyInitCode);
            require(proxy == proxyPredicted, "proxy address mismatch");
        } else {
            console.log("Proxy already deployed, skipping CREATE2");
        }

        vm.stopBroadcast();

        console.log("Implementation:", impl);
        console.log("Proxy:         ", proxy);
        console.log("Publisher:     ", publisher);
        console.log("CREATE2_SALT:  ", vm.toString(proxySalt));

        if (vm.envExists("CREATE2_PREFIX")) {
            console.log("CREATE2_PREFIX:", vm.envString("CREATE2_PREFIX"));
        }
    }
}

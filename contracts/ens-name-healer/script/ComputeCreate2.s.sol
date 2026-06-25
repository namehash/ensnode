// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./Create2Deploy.sol";
import "../src/ENSNameHealer.sol";

/// @notice Writes proxy CREATE2 init code to `cache/create2-proxy-init-code.hex` for `cast create2`.
///
/// Required: OWNER_ADDRESS
/// Optional: PUBLISHER_ADDRESS, CREATE2_IMPL_SALT (defaults to zero)
contract ComputeCreate2 is Script {
    function run() external {
        address owner = vm.envAddress("OWNER_ADDRESS");
        address publisher = vm.envOr("PUBLISHER_ADDRESS", address(0));
        bytes32 implSalt = vm.envOr("CREATE2_IMPL_SALT", bytes32(0));

        bytes memory implInitCode = type(ENSNameHealer).creationCode;
        address impl = vm.computeCreate2Address(implSalt, keccak256(implInitCode), Create2Deploy.FACTORY);

        bytes memory initData = abi.encodeCall(ENSNameHealer.initialize, (owner, publisher));
        bytes memory proxyInitCode = abi.encodePacked(type(ERC1967Proxy).creationCode, abi.encode(impl, initData));

        vm.createDir("cache", true);
        vm.writeFile("cache/create2-proxy-init-code.hex", _toHex(proxyInitCode));

        console.log("CREATE2 factory:     ", Create2Deploy.FACTORY);
        console.log("CREATE2_IMPL_SALT:   ", vm.toString(implSalt));
        console.log("Impl predicted:      ", impl);
        console.log("Proxy init code file:", "cache/create2-proxy-init-code.hex");
    }

    function _toHex(bytes memory data) private pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i]) >> 4];
            str[3 + i * 2] = alphabet[uint8(data[i]) & 0x0f];
        }
        return string(str);
    }
}

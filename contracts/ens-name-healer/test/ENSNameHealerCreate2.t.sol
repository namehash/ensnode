// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ENSNameHealer.sol";

/// @dev Uses native CREATE2 from this test contract (Nick's factory is not on a blank Anvil).
contract ENSNameHealerCreate2Test is Test {
    address internal owner = makeAddr("owner");
    address internal publisher = makeAddr("publisher");

    function test_create2_deployProxyWithVanityPrefix() public {
        bytes32 implSalt = bytes32(0);
        bytes memory implInitCode = type(ENSNameHealer).creationCode;
        address impl = _deployCreate2(implSalt, implInitCode);

        bytes memory initData = abi.encodeCall(ENSNameHealer.initialize, (owner, publisher));
        bytes memory proxyInitCode = abi.encodePacked(type(ERC1967Proxy).creationCode, abi.encode(impl, initData));

        bytes32 proxySalt = _mineSalt(proxyInitCode, 0x1a);
        address proxy = _deployCreate2(proxySalt, proxyInitCode);

        assertEq(uint8(uint160(proxy) >> 152), 0x1a);

        ENSNameHealer healer = ENSNameHealer(proxy);
        assertEq(healer.owner(), owner);
        assertEq(healer.publisher(), publisher);
    }

    function _deployCreate2(bytes32 salt, bytes memory initCode) internal returns (address deployed) {
        assembly {
            deployed := create2(0, add(initCode, 0x20), mload(initCode), salt)
        }
        require(deployed != address(0), "CREATE2 deploy failed");
    }

    function _mineSalt(bytes memory initCode, uint8 prefix) internal view returns (bytes32) {
        bytes32 initCodeHash = keccak256(initCode);
        for (uint256 i = 0; i < 200_000; i++) {
            bytes32 salt = bytes32(i);
            address predicted = vm.computeCreate2Address(salt, initCodeHash, address(this));
            if (uint8(uint160(predicted) >> 152) == prefix) {
                return salt;
            }
        }
        revert("salt not found");
    }
}

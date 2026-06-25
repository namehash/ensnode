// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ENSNameHealer.sol";

/// @dev Uses native CREATE2 from this test contract (Nick's factory is not on a blank Anvil).
/// Vanity prefix mining is covered by `script/mine-create2-salt.sh`, not here — brute-force
/// mining gas varies by test-contract address across Foundry hosts and breaks `forge snapshot`.
contract ENSNameHealerCreate2Test is Test {
    address internal owner = makeAddr("owner");
    address internal publisher = makeAddr("publisher");

    function test_create2_deployProxyAndInitialize() public {
        bytes32 implSalt = bytes32(0);
        bytes memory implInitCode = type(ENSNameHealer).creationCode;
        address implPredicted = vm.computeCreate2Address(implSalt, keccak256(implInitCode), address(this));
        address impl = _deployCreate2(implSalt, implInitCode);
        assertEq(impl, implPredicted);

        bytes memory initData = abi.encodeCall(ENSNameHealer.initialize, (owner, publisher));
        bytes memory proxyInitCode = abi.encodePacked(type(ERC1967Proxy).creationCode, abi.encode(impl, initData));

        bytes32 proxySalt = bytes32(uint256(1));
        address proxyPredicted = vm.computeCreate2Address(proxySalt, keccak256(proxyInitCode), address(this));
        address proxy = _deployCreate2(proxySalt, proxyInitCode);
        assertEq(proxy, proxyPredicted);

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
}

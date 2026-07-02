// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal helper for Nick's CREATE2 deployer (same default as `cast create2`).
library Create2Deploy {
    address internal constant FACTORY = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function deploy(bytes32 salt, bytes memory initCode) internal returns (address deployed) {
        (bool success, bytes memory data) = FACTORY.call(abi.encodePacked(salt, initCode));
        require(success && data.length >= 20, "CREATE2 deploy failed");
        assembly {
            deployed := shr(96, mload(add(data, 32)))
        }
    }
}

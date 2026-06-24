// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ENSNameHealer.sol";

contract ENSNameHealerFuzzTest is Test {
    ENSNameHealer internal impl;
    ENSNameHealer internal healer;

    address internal owner = makeAddr("owner");
    address internal publisher = makeAddr("publisher");

    function setUp() public {
        impl = new ENSNameHealer();
        bytes memory initData = abi.encodeCall(ENSNameHealer.initialize, (owner));
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        healer = ENSNameHealer(address(proxy));

        vm.prank(owner);
        healer.setPublisher(publisher);
    }

    function testFuzz_publishLabel_emitsForAnyLiteralLabel(string calldata literalLabel) public {
        vm.recordLogs();
        vm.prank(publisher);
        healer.publishLabel(literalLabel);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 sig = keccak256("LabelPublished(string,address)");
        uint256 count;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == sig) count++;
        }
        assertEq(count, 1);
    }

    function testFuzz_publishLabels_emitsOneEventPerInput(string[8] calldata input, uint8 seed) public {
        uint256 len = (uint256(seed) % 8) + 1;

        string[] memory literalLabels = new string[](len);
        for (uint256 i = 0; i < len; i++) {
            literalLabels[i] = input[i];
        }

        vm.recordLogs();
        vm.prank(publisher);
        healer.publishLabels(literalLabels);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 sig = keccak256("LabelPublished(string,address)");
        uint256 emitted;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == sig) emitted++;
        }
        assertEq(emitted, len);
    }
}

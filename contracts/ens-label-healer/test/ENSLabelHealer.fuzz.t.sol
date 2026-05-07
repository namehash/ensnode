// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ENSLabelHealer.sol";

contract ENSLabelHealerFuzzTest is Test {
    ENSLabelHealer internal impl;
    ENSLabelHealer internal healer;

    address internal admin = makeAddr("admin");
    address internal submitter = makeAddr("submitter");

    bytes32 internal constant SUBMITTER_ROLE = keccak256("SUBMITTER_ROLE");

    function setUp() public {
        impl = new ENSLabelHealer();
        bytes memory initData = abi.encodeCall(ENSLabelHealer.initialize, (admin));
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        healer = ENSLabelHealer(address(proxy));

        vm.prank(admin);
        healer.grantRole(SUBMITTER_ROLE, submitter);
    }

    function testFuzz_submit_emitsForAnyLabel(string calldata label) public {
        vm.recordLogs();
        vm.prank(submitter);
        healer.submit(label);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 sig = keccak256("LabelHealed(string)");
        uint256 count;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == sig) count++;
        }
        assertEq(count, 1);
    }

    function testFuzz_submitBatch_emitsOneEventPerInput(string[8] calldata input, uint8 seed) public {
        uint256 len = (uint256(seed) % 8) + 1;

        string[] memory labels = new string[](len);
        for (uint256 i = 0; i < len; i++) {
            labels[i] = input[i];
        }

        vm.recordLogs();
        vm.prank(submitter);
        healer.submitBatch(labels);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 sig = keccak256("LabelHealed(string)");
        uint256 emitted;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == sig) emitted++;
        }
        assertEq(emitted, len);
    }
}

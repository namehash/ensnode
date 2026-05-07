// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ENSLabelHealer.sol";

contract ENSLabelHealerTest is Test {
    ENSLabelHealer internal impl;
    ENSLabelHealer internal healer;

    address internal admin = makeAddr("admin");
    address internal submitter = makeAddr("submitter");
    address internal stranger = makeAddr("stranger");

    bytes32 internal constant SUBMITTER_ROLE = keccak256("SUBMITTER_ROLE");
    bytes32 internal constant DEFAULT_ADMIN_ROLE = bytes32(0);

    event LabelHealed(string label);

    function setUp() public {
        impl = new ENSLabelHealer();
        bytes memory initData = abi.encodeCall(ENSLabelHealer.initialize, (admin));
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        healer = ENSLabelHealer(address(proxy));

        vm.prank(admin);
        healer.grantRole(SUBMITTER_ROLE, submitter);
    }

    function test_initialize_assignsAdminRole() public view {
        assertTrue(healer.hasRole(DEFAULT_ADMIN_ROLE, admin));
    }

    function test_submit_revertsForNonSubmitter() public {
        vm.prank(stranger);
        vm.expectRevert();
        healer.submit("vitalik");
    }

    function test_submit_emitsLabelHealed() public {
        vm.expectEmit(false, false, false, true);
        emit LabelHealed("vitalik");

        vm.prank(submitter);
        healer.submit("vitalik");
    }

    function test_submit_allowsEmptyLabel() public {
        vm.expectEmit(false, false, false, true);
        emit LabelHealed("");

        vm.prank(submitter);
        healer.submit("");
    }

    function test_submit_allowsDuplicates() public {
        vm.recordLogs();
        vm.startPrank(submitter);
        healer.submit("vitalik");
        healer.submit("vitalik");
        vm.stopPrank();

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 sig = keccak256("LabelHealed(string)");
        uint256 count;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == sig) count++;
        }
        assertEq(count, 2);
    }

    function test_submitBatch_emitsForEveryItem() public {
        string[] memory labels = new string[](3);
        labels[0] = "vitalik";
        labels[1] = "";
        labels[2] = "vitalik";

        vm.recordLogs();
        vm.prank(submitter);
        healer.submitBatch(labels);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 sig = keccak256("LabelHealed(string)");
        uint256 count;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == sig) count++;
        }
        assertEq(count, labels.length);
    }

    function test_submit_revertsWhenPaused() public {
        vm.prank(admin);
        healer.pause();

        vm.prank(submitter);
        vm.expectRevert();
        healer.submit("vitalik");
    }

    function test_submitBatch_revertsWhenPaused() public {
        string[] memory labels = new string[](1);
        labels[0] = "vitalik";

        vm.prank(admin);
        healer.pause();

        vm.prank(submitter);
        vm.expectRevert();
        healer.submitBatch(labels);
    }

    function test_submit_succeedsAfterUnpause() public {
        vm.prank(admin);
        healer.pause();

        vm.prank(admin);
        healer.unpause();

        vm.prank(submitter);
        healer.submit("vitalik");
    }
}

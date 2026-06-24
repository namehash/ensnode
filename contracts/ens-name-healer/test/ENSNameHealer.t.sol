// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ENSNameHealer.sol";

contract ENSNameHealerTest is Test {
    ENSNameHealer internal impl;
    ENSNameHealer internal healer;

    address internal owner = makeAddr("owner");
    address internal publisher = makeAddr("publisher");
    address internal discoverer = makeAddr("discoverer");
    address internal stranger = makeAddr("stranger");

    event LabelPublished(string literalLabel, address indexed discoverer);

    function setUp() public {
        impl = new ENSNameHealer();
        bytes memory initData = abi.encodeCall(ENSNameHealer.initialize, (owner));
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        healer = ENSNameHealer(address(proxy));

        vm.prank(owner);
        healer.setPublisher(publisher);
    }

    function test_initialize_assignsOwner() public view {
        assertEq(healer.owner(), owner);
    }

    function test_initialize_revertsForZeroOwner() public {
        ENSNameHealer freshImpl = new ENSNameHealer();
        bytes memory initData = abi.encodeCall(ENSNameHealer.initialize, (address(0)));

        vm.expectRevert(ENSNameHealer.ZeroAddress.selector);
        new ERC1967Proxy(address(freshImpl), initData);
    }

    function test_setPublisher_revertsForNonOwner() public {
        vm.prank(stranger);
        vm.expectRevert();
        healer.setPublisher(publisher);
    }

    function test_setPublisher_setsPublisher() public {
        address newPublisher = makeAddr("newPublisher");

        vm.prank(owner);
        healer.setPublisher(newPublisher);

        assertEq(healer.publisher(), newPublisher);
    }

    function test_publishLabel_revertsForNonPublisher() public {
        vm.prank(stranger);
        vm.expectRevert(ENSNameHealer.NotPublisher.selector);
        healer.publishLabel("vitalik");
    }

    function test_publishLabel_revertsWhenPublisherUnset() public {
        vm.prank(owner);
        healer.setPublisher(address(0));

        vm.prank(publisher);
        vm.expectRevert(ENSNameHealer.NotPublisher.selector);
        healer.publishLabel("vitalik");
    }

    function test_publishLabel_emitsLabelPublished() public {
        vm.expectEmit(true, true, true, true);
        emit LabelPublished("vitalik", address(0));

        vm.prank(publisher);
        healer.publishLabel("vitalik");
    }

    function test_publishLabel_withDiscoverer_emitsLabelPublished() public {
        vm.expectEmit(true, true, true, true);
        emit LabelPublished("vitalik", discoverer);

        vm.prank(publisher);
        healer.publishLabel("vitalik", discoverer);
    }

    function test_publishLabel_allowsEmptyLiteralLabel() public {
        vm.expectEmit(true, true, true, true);
        emit LabelPublished("", address(0));

        vm.prank(publisher);
        healer.publishLabel("");
    }

    function test_publishLabel_allowsDuplicates() public {
        vm.recordLogs();
        vm.startPrank(publisher);
        healer.publishLabel("vitalik");
        healer.publishLabel("vitalik");
        vm.stopPrank();

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 sig = keccak256("LabelPublished(string,address)");
        uint256 count;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == sig) count++;
        }
        assertEq(count, 2);
    }

    function test_publishLabels_emitsForEveryItem() public {
        string[] memory literalLabels = new string[](3);
        literalLabels[0] = "vitalik";
        literalLabels[1] = "";
        literalLabels[2] = "vitalik";

        vm.recordLogs();
        vm.prank(publisher);
        healer.publishLabels(literalLabels);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 sig = keccak256("LabelPublished(string,address)");
        uint256 count;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == sig) count++;
        }
        assertEq(count, literalLabels.length);
    }

    function test_publishLabels_withDiscoverer_emitsForEveryItem() public {
        string[] memory literalLabels = new string[](2);
        literalLabels[0] = "vitalik";
        literalLabels[1] = "eth";

        vm.recordLogs();
        vm.prank(publisher);
        healer.publishLabels(literalLabels, discoverer);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 sig = keccak256("LabelPublished(string,address)");
        uint256 count;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == sig) count++;
        }
        assertEq(count, literalLabels.length);
    }

    function test_setPublisher_toZeroPausesPublishing() public {
        vm.prank(owner);
        healer.setPublisher(address(0));

        vm.prank(publisher);
        vm.expectRevert(ENSNameHealer.NotPublisher.selector);
        healer.publishLabel("vitalik");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ENSNameHealer.sol";

/// @dev Thin harness that exposes the internal _namehash function for testing.
contract ENSNameHealerHarness is ENSNameHealer {
    function namehash(string memory name) external pure returns (bytes32) {
        return _namehash(name);
    }
}

contract ENSNameHealerTest is Test {
    ENSNameHealerHarness internal impl;
    ENSNameHealerHarness internal healer; // proxy cast to harness

    address internal admin = makeAddr("admin");
    address internal submitter = makeAddr("submitter");
    address internal stranger = makeAddr("stranger");

    // Cache role constants to avoid consuming vm.prank with a getter call.
    bytes32 internal constant SUBMITTER_ROLE = keccak256("SUBMITTER_ROLE");
    bytes32 internal constant DEFAULT_ADMIN_ROLE = bytes32(0);

    event NameHealed(bytes32 indexed namehash, string name, address indexed submitter);
    event HealedStorageDisabledSet(bool disabled);

    function setUp() public {
        impl = new ENSNameHealerHarness();
        bytes memory initData = abi.encodeCall(ENSNameHealer.initialize, (admin));
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        healer = ENSNameHealerHarness(address(proxy));

        vm.prank(admin);
        healer.grantRole(SUBMITTER_ROLE, submitter);
    }

    // ── Access control ────────────────────────────────────────────────────

    function test_submit_revertsForNonSubmitter() public {
        vm.prank(stranger);
        vm.expectRevert();
        healer.submit("vitalik.eth");
    }

    function test_forceResubmit_revertsForNonSubmitter() public {
        vm.prank(stranger);
        vm.expectRevert();
        healer.forceResubmit("vitalik.eth");
    }

    function test_pause_revertsForNonAdmin() public {
        vm.prank(submitter);
        vm.expectRevert();
        healer.pause();
    }

    function test_unpause_revertsForNonAdmin() public {
        vm.prank(admin);
        healer.pause();

        vm.prank(submitter);
        vm.expectRevert();
        healer.unpause();
    }

    function test_setHealedStorageDisabled_revertsForNonAdmin() public {
        vm.prank(submitter);
        vm.expectRevert();
        healer.setHealedStorageDisabled(true);
    }

    function test_upgradeToAndCall_revertsForNonAdmin() public {
        ENSNameHealerHarness newImpl = new ENSNameHealerHarness();
        vm.prank(submitter);
        vm.expectRevert();
        healer.upgradeToAndCall(address(newImpl), "");
    }

    // ── Initialization ────────────────────────────────────────────────────

    function test_initialize_assignsAdminRole() public view {
        assertTrue(healer.hasRole(DEFAULT_ADMIN_ROLE, admin));
    }

    function test_initialize_revertsIfCalledAgain() public {
        vm.expectRevert();
        healer.initialize(stranger);
    }

    // ── Input validation ──────────────────────────────────────────────────

    function test_submit_revertsOnEmptyName() public {
        vm.prank(submitter);
        vm.expectRevert(ENSNameHealer.InvalidName.selector);
        healer.submit("");
    }

    function test_forceResubmit_revertsOnEmptyName() public {
        vm.prank(submitter);
        vm.expectRevert(ENSNameHealer.InvalidName.selector);
        healer.forceResubmit("");
    }

    // ── Namehash correctness ──────────────────────────────────────────────

    function test_namehash_basic_cases() public view {
        assertEq(healer.namehash(""), 0x0000000000000000000000000000000000000000000000000000000000000000);
        assertEq(healer.namehash("eth"), 0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae);
        assertEq(healer.namehash("vitalik.eth"), 0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835);
        assertEq(healer.namehash("a.b.eth"), 0xebc915e66aa50750038115f9be3353f7023247e4ab549b4ba1271481b81890a5);
        assertEq(healer.namehash("llev.me"), 0xfd61e92511e7897624f7fa44a07886c50edb954f07e608539d3ce4bbf1db31e2);
    }

    function test_namehash_distinctForDistinctNames() public view {
        assertTrue(healer.namehash("foo.eth") != healer.namehash("bar.eth"));
        assertTrue(healer.namehash("foo.eth") != healer.namehash("foo.com"));
    }

    // ── submit ────────────────────────────────────────────────────────────

    function test_submit_emitsNameHealed() public {
        bytes32 expectedHash = healer.namehash("vitalik.eth");
        // catch indexed expectedHash, indexed submitted, and non-indexed name in data
        vm.expectEmit(true, true, false, true);
        emit NameHealed(expectedHash, "vitalik.eth", submitter);

        vm.prank(submitter);
        healer.submit("vitalik.eth");
    }

    function test_submit_setsHealedMapping() public {
        bytes32 node = healer.namehash("vitalik.eth");
        assertFalse(healer.healed(node));

        vm.prank(submitter);
        healer.submit("vitalik.eth");

        assertTrue(healer.healed(node));
    }

    function test_submit_revertsOnDuplicate() public {
        vm.startPrank(submitter);
        healer.submit("vitalik.eth");

        bytes32 node = healer.namehash("vitalik.eth");
        vm.expectRevert(abi.encodeWithSelector(ENSNameHealer.AlreadyHealed.selector, node));
        healer.submit("vitalik.eth");
        vm.stopPrank();
    }

    // ── forceResubmit ─────────────────────────────────────────────────────

    function test_forceResubmit_succeedsOnDuplicate() public {
        vm.startPrank(submitter);
        healer.submit("vitalik.eth");
        healer.forceResubmit("vitalik.eth"); // must not revert
        vm.stopPrank();
    }

    function test_forceResubmit_emitsTwoEventsForTwoCalls() public {
        vm.startPrank(submitter);
        vm.recordLogs();
        healer.forceResubmit("nick.eth");
        healer.forceResubmit("nick.eth");
        vm.stopPrank();

        Vm.Log[] memory logs = vm.getRecordedLogs();
        // Both calls emit NameHealed
        uint256 count;
        bytes32 sig = keccak256("NameHealed(bytes32,string,address)");
        for (uint256 i; i < logs.length; i++) {
            if (logs[i].topics[0] == sig) count++;
        }
        assertEq(count, 2);
    }

    // ── Pausable ──────────────────────────────────────────────────────────

    function test_submit_revertsWhenPaused() public {
        vm.prank(admin);
        healer.pause();

        vm.prank(submitter);
        vm.expectRevert();
        healer.submit("vitalik.eth");
    }

    function test_forceResubmit_revertsWhenPaused() public {
        vm.prank(admin);
        healer.pause();

        vm.prank(submitter);
        vm.expectRevert();
        healer.forceResubmit("vitalik.eth");
    }

    function test_submit_succeedsAfterUnpause() public {
        vm.prank(admin);
        healer.pause();

        vm.prank(admin);
        healer.unpause();

        vm.prank(submitter);
        healer.submit("vitalik.eth"); // must not revert
    }

    // ── healedStorageDisabled ─────────────────────────────────────────────

    function test_setHealedStorageDisabled_emitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit HealedStorageDisabledSet(true);

        vm.prank(admin);
        healer.setHealedStorageDisabled(true);
    }

    function test_healedStorageDisabled_allowsDuplicateSubmits() public {
        vm.prank(admin);
        healer.setHealedStorageDisabled(true);

        vm.startPrank(submitter);
        healer.submit("vitalik.eth"); // should not revert
        healer.submit("vitalik.eth"); // should not revert (no dedup)
        vm.stopPrank();
    }

    function test_healedStorageDisabled_doesNotWriteMapping() public {
        vm.prank(admin);
        healer.setHealedStorageDisabled(true);

        bytes32 node = healer.namehash("vitalik.eth");
        vm.prank(submitter);
        healer.submit("vitalik.eth");

        assertFalse(healer.healed(node));
    }

    function test_healedStorageDisabled_resumesDedupWhenReenabled() public {
        // Submit once normally
        vm.prank(submitter);
        healer.submit("vitalik.eth");

        // Disable then re-enable storage
        vm.startPrank(admin);
        healer.setHealedStorageDisabled(true);
        healer.setHealedStorageDisabled(false);
        vm.stopPrank();

        // Dedup should resume: second submit reverts
        bytes32 node = healer.namehash("vitalik.eth");
        vm.prank(submitter);
        vm.expectRevert(abi.encodeWithSelector(ENSNameHealer.AlreadyHealed.selector, node));
        healer.submit("vitalik.eth");
    }

    // ── submitBatch ───────────────────────────────────────────────────────

    function test_submitBatch_revertsForNonSubmitter() public {
        string[] memory names = new string[](1);
        names[0] = "vitalik.eth";
        vm.prank(stranger);
        vm.expectRevert();
        healer.submitBatch(names);
    }

    function test_submitBatch_revertsWhenPaused() public {
        string[] memory names = new string[](1);
        names[0] = "vitalik.eth";
        vm.prank(admin);
        healer.pause();
        vm.prank(submitter);
        vm.expectRevert();
        healer.submitBatch(names);
    }

    function test_submitBatch_emitsEventForEachName() public {
        string[] memory names = new string[](3);
        names[0] = "vitalik.eth";
        names[1] = "nick.eth";
        names[2] = "ens.eth";

        vm.recordLogs();
        vm.prank(submitter);
        healer.submitBatch(names);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 sig = keccak256("NameHealed(bytes32,string,address)");
        uint256 count;
        for (uint256 i; i < logs.length; i++) {
            if (logs[i].topics[0] == sig) count++;
        }
        assertEq(count, 3);
    }

    function test_submitBatch_emptyArrayIsNoop() public {
        string[] memory names = new string[](0);
        vm.recordLogs();
        vm.prank(submitter);
        healer.submitBatch(names);
        assertEq(vm.getRecordedLogs().length, 0);
    }

    function test_submitBatch_revertsOnDuplicateWithinBatch() public {
        string[] memory names = new string[](2);
        names[0] = "vitalik.eth";
        names[1] = "vitalik.eth";
        vm.prank(submitter);
        vm.expectRevert();
        healer.submitBatch(names);
    }

    function test_submitBatch_revertsOnPreviouslyHealedName() public {
        vm.prank(submitter);
        healer.submit("vitalik.eth");

        string[] memory names = new string[](1);
        names[0] = "vitalik.eth";
        vm.prank(submitter);
        vm.expectRevert();
        healer.submitBatch(names);
    }

    function test_submitBatch_revertsOnEmptyName() public {
        string[] memory names = new string[](2);
        names[0] = "vitalik.eth";
        names[1] = "";
        vm.prank(submitter);
        vm.expectRevert(ENSNameHealer.InvalidName.selector);
        healer.submitBatch(names);
    }

    // ── forceResubmitBatch ────────────────────────────────────────────────

    function test_forceResubmitBatch_revertsForNonSubmitter() public {
        string[] memory names = new string[](1);
        names[0] = "vitalik.eth";
        vm.prank(stranger);
        vm.expectRevert();
        healer.forceResubmitBatch(names);
    }

    function test_forceResubmitBatch_revertsWhenPaused() public {
        string[] memory names = new string[](1);
        names[0] = "vitalik.eth";
        vm.prank(admin);
        healer.pause();
        vm.prank(submitter);
        vm.expectRevert();
        healer.forceResubmitBatch(names);
    }

    function test_forceResubmitBatch_succeedsOnDuplicates() public {
        string[] memory names = new string[](2);
        names[0] = "vitalik.eth";
        names[1] = "vitalik.eth";

        vm.recordLogs();
        vm.prank(submitter);
        healer.forceResubmitBatch(names); // must not revert

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 sig = keccak256("NameHealed(bytes32,string,address)");
        uint256 count;
        for (uint256 i; i < logs.length; i++) {
            if (logs[i].topics[0] == sig) count++;
        }
        assertEq(count, 2);
    }

    function test_forceResubmitBatch_emptyArrayIsNoop() public {
        string[] memory names = new string[](0);
        vm.recordLogs();
        vm.prank(submitter);
        healer.forceResubmitBatch(names);
        assertEq(vm.getRecordedLogs().length, 0);
    }

    // ── Upgradeability ────────────────────────────────────────────────────

    function test_upgrade_preservesHealedStorage() public {
        vm.prank(submitter);
        healer.submit("vitalik.eth");

        bytes32 node = healer.namehash("vitalik.eth");
        assertTrue(healer.healed(node));

        // Upgrade to a new implementation
        ENSNameHealerHarness newImpl = new ENSNameHealerHarness();
        vm.prank(admin);
        healer.upgradeToAndCall(address(newImpl), "");

        // Storage survives upgrade
        assertTrue(healer.healed(node));
    }

    function test_upgrade_preservesRoles() public {
        ENSNameHealerHarness newImpl = new ENSNameHealerHarness();
        vm.prank(admin);
        healer.upgradeToAndCall(address(newImpl), "");

        assertTrue(healer.hasRole(DEFAULT_ADMIN_ROLE, admin));
        assertTrue(healer.hasRole(SUBMITTER_ROLE, submitter));
    }
}

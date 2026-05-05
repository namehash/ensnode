// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ENSNameHealer.sol";

/// @dev Harness exposes internal _namehash.
contract ENSNameHealerHarness is ENSNameHealer {
    function namehash(string memory name) external pure returns (bytes32) {
        return _namehash(name);
    }
}

/// @dev Independent reference implementation of ENS namehash used to validate
///      the contract's on-chain implementation against a second code path.
///      Uses a recursive approach vs the contract's iterative approach.
library ReferenceNamehash {
    function compute(string memory name) internal pure returns (bytes32 node) {
        bytes memory b = bytes(name);
        if (b.length == 0) return bytes32(0);

        // Find first dot
        uint256 dotPos = type(uint256).max;
        for (uint256 i = 0; i < b.length; i++) {
            if (b[i] == ".") {
                dotPos = i;
                break;
            }
        }

        bytes memory label;
        string memory rest;

        if (dotPos == type(uint256).max) {
            // No dot — this is the root label
            label = b;
            rest = "";
        } else {
            label = new bytes(dotPos);
            for (uint256 i = 0; i < dotPos; i++) {
                label[i] = b[i];
            }
            bytes memory restBytes = new bytes(b.length - dotPos - 1);
            for (uint256 i = dotPos + 1; i < b.length; i++) {
                restBytes[i - dotPos - 1] = b[i];
            }
            rest = string(restBytes);
        }

        bytes32 parentNode = (bytes(rest).length == 0) ? bytes32(0) : compute(rest);
        node = keccak256(abi.encodePacked(parentNode, keccak256(label)));
    }
}

contract ENSNameHealerFuzzTest is Test {
    ENSNameHealerHarness internal impl;
    ENSNameHealerHarness internal healer;

    address internal admin = makeAddr("admin");
    address internal submitter = makeAddr("submitter");

    bytes32 internal constant SUBMITTER_ROLE = keccak256("SUBMITTER_ROLE");

    function setUp() public {
        impl = new ENSNameHealerHarness();
        bytes memory initData = abi.encodeCall(ENSNameHealer.initialize, (admin));
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        healer = ENSNameHealerHarness(address(proxy));

        vm.prank(admin);
        healer.grantRole(SUBMITTER_ROLE, submitter);
    }

    // ── Namehash property tests ───────────────────────────────────────────

    /// For any non-empty name without a trailing dot, the contract's namehash
    /// matches an independently written recursive reference implementation.
    function testFuzz_namehash_matchesReference(string calldata name) public view {
        vm.assume(bytes(name).length > 0);
        // Exclude trailing dots — an edge case not present in valid ENS names.
        vm.assume(bytes(name)[bytes(name).length - 1] != ".");
        // Exclude leading dots.
        vm.assume(bytes(name)[0] != ".");
        // Exclude consecutive dots (invalid ENS names).
        bytes memory b = bytes(name);
        for (uint256 i = 0; i + 1 < b.length; i++) {
            vm.assume(!(b[i] == "." && b[i + 1] == "."));
        }

        bytes32 contractResult = healer.namehash(name);
        bytes32 referenceResult = ReferenceNamehash.compute(name);
        assertEq(contractResult, referenceResult, "namehash mismatch");
    }

    /// The namehash of any non-empty name is never bytes32(0)
    /// (the namehash of the empty string / root node).
    function testFuzz_namehash_neverZeroForNonEmpty(string calldata name) public view {
        vm.assume(bytes(name).length > 0);
        assertTrue(healer.namehash(name) != bytes32(0));
    }

    /// Two distinct non-empty names must produce distinct namehashes.
    function testFuzz_namehash_distinctForDistinctNames(
        string calldata a,
        string calldata b
    ) public view {
        vm.assume(bytes(a).length > 0 && bytes(b).length > 0);
        vm.assume(keccak256(bytes(a)) != keccak256(bytes(b)));
        assertTrue(healer.namehash(a) != healer.namehash(b));
    }

    // ── submit deduplication ──────────────────────────────────────────────

    /// For any valid name, a second submit without forceResubmit always reverts.
    function testFuzz_submit_dedup(string calldata name) public {
        vm.assume(bytes(name).length > 0);

        vm.startPrank(submitter);
        healer.submit(name);

        bytes32 node = healer.namehash(name);
        vm.expectRevert(abi.encodeWithSelector(ENSNameHealer.AlreadyHealed.selector, node));
        healer.submit(name);
        vm.stopPrank();
    }

    // ── forceResubmit ─────────────────────────────────────────────────────

    /// forceResubmit always succeeds and emits an event, regardless of how
    /// many times it has been called before.
    function testFuzz_forceResubmit_alwaysSucceeds(string calldata name, uint8 n) public {
        vm.assume(bytes(name).length > 0);
        vm.assume(n > 0 && n <= 10);

        vm.recordLogs();
        vm.startPrank(submitter);
        for (uint256 i; i < n; i++) {
            healer.forceResubmit(name);
        }
        vm.stopPrank();

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 sig = keccak256("NameHealed(bytes32,string,address)");
        uint256 count;
        for (uint256 i; i < logs.length; i++) {
            if (logs[i].topics[0] == sig) count++;
        }
        assertEq(count, n, "expected n NameHealed events");
    }

    // ── healedStorageDisabled ─────────────────────────────────────────────

    /// When healedStorageDisabled is true, any number of submits never reverts.
    function testFuzz_healedStorageDisabled_noDuplicateRevert(
        string calldata name,
        uint8 n
    ) public {
        vm.assume(bytes(name).length > 0);
        vm.assume(n > 0 && n <= 10);

        vm.prank(admin);
        healer.setHealedStorageDisabled(true);

        vm.startPrank(submitter);
        for (uint256 i; i < n; i++) {
            healer.submit(name); // must never revert
        }
        vm.stopPrank();
    }

    // ── batch ─────────────────────────────────────────────────────────────

    /// submitBatch emits exactly one NameHealed per unique name.
    function testFuzz_submitBatch_emitsOneEventPerName(string[4] calldata input) public {
        // Build a deduplicated array of non-empty names.
        string[] memory names = new string[](4);
        uint256 count;
        for (uint256 i = 0; i < 4; i++) {
            if (bytes(input[i]).length == 0) continue;
            // Skip if already in the list (simple O(n^2) dedup for small N).
            bool dup;
            for (uint256 j = 0; j < count; j++) {
                if (keccak256(bytes(names[j])) == keccak256(bytes(input[i]))) {
                    dup = true;
                    break;
                }
            }
            if (!dup) names[count++] = input[i];
        }
        // Resize to actual count.
        string[] memory unique = new string[](count);
        for (uint256 i = 0; i < count; i++) unique[i] = names[i];

        vm.assume(count > 0);

        vm.recordLogs();
        vm.prank(submitter);
        healer.submitBatch(unique);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 sig = keccak256("NameHealed(bytes32,string,address)");
        uint256 emitted;
        for (uint256 i; i < logs.length; i++) {
            if (logs[i].topics[0] == sig) emitted++;
        }
        assertEq(emitted, count);
    }

    /// forceResubmitBatch always emits exactly names.length events regardless
    /// of duplicates or prior state.
    function testFuzz_forceResubmitBatch_alwaysEmitsForEveryName(
        string calldata name,
        uint8 batchSize
    ) public {
        vm.assume(bytes(name).length > 0);
        vm.assume(batchSize > 0 && batchSize <= 10);

        string[] memory names = new string[](batchSize);
        for (uint256 i = 0; i < batchSize; i++) names[i] = name;

        // First submit to ensure names are already healed.
        vm.prank(submitter);
        healer.submit(name);

        vm.recordLogs();
        vm.prank(submitter);
        healer.forceResubmitBatch(names);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 sig = keccak256("NameHealed(bytes32,string,address)");
        uint256 emitted;
        for (uint256 i; i < logs.length; i++) {
            if (logs[i].topics[0] == sig) emitted++;
        }
        assertEq(emitted, batchSize);
    }
}

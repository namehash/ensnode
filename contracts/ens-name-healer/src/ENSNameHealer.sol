// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @title ENSNameHealer
/// @notice On-chain oracle for healing unresolvable ENS names.
///
/// ENSv1's old registry contract emits events containing only a namehash — no
/// label string. This contract allows trusted submitters to publish the
/// human-readable name that corresponds to a given namehash, emitting a
/// `NameHealed` event that any indexer (such as ENSNode) can consume to
/// recover the readable form of an otherwise unresolvable name.
///
/// @dev Upgradeable via UUPS. Storage layout must be preserved across upgrades.
contract ENSNameHealer is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // ── Roles ──────────────────────────────────────────────────────────────

    /// Role for addresses permitted to submit names for healing.
    /// Intended for the `ens-rainbow-beam` off-chain service hot key.
    bytes32 public constant SUBMITTER_ROLE = keccak256("SUBMITTER_ROLE");

    // ── State ──────────────────────────────────────────────────────────────

    /// Maps ENS namehashes to whether they have been healed.
    /// Writes are skipped when `healedStorageDisabled` is true.
    mapping(bytes32 => bool) public healed;

    /// When true the deduplication check and storage writes in `submit` are
    /// both bypassed. Controlled by `DEFAULT_ADMIN_ROLE`.
    ///
    /// Intended as an operational escape hatch: if on-chain storage costs
    /// become prohibitive at scale, an admin can disable the mapping without
    /// upgrading the contract. Downstream consumers (e.g. the ENSNode
    /// indexer) must be prepared to handle duplicate `NameHealed` events.
    bool public healedStorageDisabled;

    // ── Events ─────────────────────────────────────────────────────────────

    /// Emitted when a name is successfully healed.
    /// @param namehash The ENS namehash computed on-chain from `name`.
    /// @param name     The full dot-separated ENS name (e.g. "vitalik.eth").
    /// @param submitter The address that submitted the name.
    event NameHealed(bytes32 indexed namehash, string name, address indexed submitter);

    /// Emitted when `healedStorageDisabled` is toggled.
    event HealedStorageDisabledSet(bool disabled);

    // ── Errors ─────────────────────────────────────────────────────────────

    /// Thrown when an empty string is submitted.
    error InvalidName();

    /// Thrown when `submit` is called for a name whose namehash is already
    /// recorded in `healed` and `healedStorageDisabled` is false.
    error AlreadyHealed(bytes32 namehash);

    // ── Initializer ────────────────────────────────────────────────────────

    /// @param admin Address to assign `DEFAULT_ADMIN_ROLE`.
    function initialize(address admin) external initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ── Admin ──────────────────────────────────────────────────────────────

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /// Enable or disable the healed-name storage and deduplication check.
    /// @param disabled If true, `submit` will no longer write to or read from
    ///                 `healed`, and duplicate events may be emitted.
    function setHealedStorageDisabled(bool disabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        healedStorageDisabled = disabled;
        emit HealedStorageDisabledSet(disabled);
    }

    // ── Submission ─────────────────────────────────────────────────────────

    /// Submit a name for healing.
    ///
    /// Reverts with `AlreadyHealed` if the name's namehash has already been
    /// recorded and `healedStorageDisabled` is false.
    ///
    /// @param name The full dot-separated ENS name (e.g. "vitalik.eth").
    function submit(string calldata name) external onlyRole(SUBMITTER_ROLE) whenNotPaused {
        _processName(name, false);
    }

    /// Submit a name for healing, bypassing the already-healed deduplication
    /// check.
    ///
    /// Use during indexer recovery, after toggling `healedStorageDisabled`, or
    /// whenever an event must be re-emitted regardless of prior state.
    ///
    /// @param name The full dot-separated ENS name (e.g. "vitalik.eth").
    function forceResubmit(string calldata name) external onlyRole(SUBMITTER_ROLE) whenNotPaused {
        _processName(name, true);
    }

    // ── UUPS ───────────────────────────────────────────────────────────────

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // ── Internal ───────────────────────────────────────────────────────────

    function _processName(string calldata name, bool force) internal {
        if (bytes(name).length == 0) revert InvalidName();

        bytes32 node = _namehash(name);

        if (!healedStorageDisabled) {
            if (!force && healed[node]) revert AlreadyHealed(node);
            healed[node] = true;
        }

        emit NameHealed(node, name, msg.sender);
    }

    /// Compute the ENS namehash for a dot-separated name string.
    ///
    /// Implements EIP-137: iterate labels right-to-left, computing
    ///   node = keccak256(abi.encodePacked(node, keccak256(label)))
    /// starting from node = bytes32(0) (the namehash of the empty string).
    ///
    /// @param name Dot-separated ENS name (e.g. "vitalik.eth").
    /// @return node The resulting bytes32 namehash.
    function _namehash(string memory name) internal pure returns (bytes32 node) {
        bytes memory b = bytes(name);
        uint256 len = b.length;

        node = bytes32(0);
        uint256 end = len;

        // Walk right-to-left. When a dot or the start of string is reached,
        // hash the label that spans [start, end) into the accumulator.
        for (uint256 i = len; i > 0; ) {
            unchecked {
                --i;
            }
            if (b[i] == "." || i == 0) {
                uint256 start = (b[i] == ".") ? i + 1 : 0;
                uint256 labelLen = end - start;
                bytes memory label = new bytes(labelLen);
                for (uint256 j = 0; j < labelLen; j++) {
                    label[j] = b[start + j];
                }
                node = keccak256(abi.encodePacked(node, keccak256(label)));
                end = i; // next label ends at this dot
            }
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/// @title ENSLabelHealer
/// @notice Permissioned on-chain emitter for unresolved ENS labels.
///
/// Some ENS registry contracts emit events containing only a labelhash.
/// This contract lets trusted submitters publish the corresponding label
/// string so indexers can consume `LabelHealed` events.
///
/// @dev Upgradeable via UUPS. Storage layout must be preserved across upgrades.
contract ENSLabelHealer is Initializable, AccessControlUpgradeable, PausableUpgradeable, UUPSUpgradeable {
    bytes32 public constant SUBMITTER_ROLE = keccak256("SUBMITTER_ROLE");

    event LabelHealed(string label);

    /// @param admin Address to assign `DEFAULT_ADMIN_ROLE`.
    function initialize(address admin) external initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function submit(string calldata label) external onlyRole(SUBMITTER_ROLE) whenNotPaused {
        emit LabelHealed(label);
    }

    function submitBatch(string[] calldata labels) external onlyRole(SUBMITTER_ROLE) whenNotPaused {
        for (uint256 i = 0; i < labels.length; i++) {
            emit LabelHealed(labels[i]);
        }
    }

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}

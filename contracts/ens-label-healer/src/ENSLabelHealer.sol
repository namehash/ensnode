// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
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
contract ENSLabelHealer is
    Initializable,
    OwnableUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant SUBMITTER_ROLE = keccak256("SUBMITTER_ROLE");

    event LabelHealed(string label);

    /// @param owner Address to assign ownership.
    function initialize(address owner) external initializer {
        __Ownable_init(owner);
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function grantSubmitter(address submitter) external onlyOwner {
        _grantRole(SUBMITTER_ROLE, submitter);
    }

    function revokeSubmitter(address submitter) external onlyOwner {
        _revokeRole(SUBMITTER_ROLE, submitter);
    }

    function submit(string calldata label) external onlyRole(SUBMITTER_ROLE) whenNotPaused {
        emit LabelHealed(label);
    }

    function submitBatch(string[] calldata labels) external onlyRole(SUBMITTER_ROLE) whenNotPaused {
        for (uint256 i = 0; i < labels.length; i++) {
            emit LabelHealed(labels[i]);
        }
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}

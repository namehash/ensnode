// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title ENSNameHealer
/// @notice Onchain publisher of LiteralLabels so ENS indexers can heal unknown labels.
///
/// Some ENS registry contracts emit events containing only a labelhash, without the
/// plaintext label. This applies to both the original ENS Registry and ENS Registry
/// With Fallback. See:
/// - https://ensnode.io/ensrainbow#the-problem-unknown-labels
/// - https://ensnode.io/ensrainbow/concepts/unknown-labels
///
/// ENSNameHealer is the sole onchain outlet for publishing discovered label preimages.
/// Healing happens in indexers; this contract only emits `LabelPublished` events.
///
/// @dev Upgradeable via UUPS. Storage layout must be preserved across upgrades.
///
/// Design: a single publisher address is enforced at a time. This minimizes duplicate
/// `LabelPublished` events indexers must consume and avoids coordination complexity
/// across multiple publishers. Only one ENSRainbowBeam instance, acting as publisher,
/// is needed across the ENS ecosystem. To pause publishing, the owner sets the
/// publisher to the zero address.
contract ENSNameHealer is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    /// @notice Sole address permitted to publish labels onchain.
    address public publisher;

    /// @param literalLabel Any possible string (a LiteralLabel); not limited to ENSIP-15 labels.
    /// @param discoverer Optional attribution for who discovered the label. `address(0)` when absent.
    event LabelPublished(string literalLabel, address indexed discoverer);

    event PublisherSet(address indexed publisher);

    error NotPublisher();
    error ZeroAddress();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @param owner Address to assign ownership.
    function initialize(address owner) external initializer {
        if (owner == address(0)) revert ZeroAddress();

        __Ownable_init(owner);
        __UUPSUpgradeable_init();
    }

    /// @notice Assign the sole publisher. Set to `address(0)` to pause publishing.
    function setPublisher(address newPublisher) external onlyOwner {
        publisher = newPublisher;
        emit PublisherSet(newPublisher);
    }

    function publishLabel(string calldata literalLabel) external onlyPublisher {
        emit LabelPublished(literalLabel, address(0));
    }

    function publishLabel(string calldata literalLabel, address discoverer) external onlyPublisher {
        emit LabelPublished(literalLabel, discoverer);
    }

    function publishLabels(string[] calldata literalLabels) external onlyPublisher {
        for (uint256 i = 0; i < literalLabels.length; i++) {
            emit LabelPublished(literalLabels[i], address(0));
        }
    }

    function publishLabels(string[] calldata literalLabels, address discoverer) external onlyPublisher {
        for (uint256 i = 0; i < literalLabels.length; i++) {
            emit LabelPublished(literalLabels[i], discoverer);
        }
    }

    modifier onlyPublisher() {
        if (msg.sender != publisher) revert NotPublisher();
        _;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}

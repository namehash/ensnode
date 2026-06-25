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
/// ENSNameHealer does not heal labels itself. It emits `LabelPublished` events that
/// indexers consume to heal unknown labels in indexed ENS name data.
///
/// ## Ecosystem
///
/// - **Discoverers** submit candidate label preimages to ENSRainbowBeam (offchain).
///   A discoverer address may be attributed when labels are published onchain.
/// - **ENSRainbowBeam** filters submissions and calls this contract as the sole publisher.
/// - **Publisher** — the single `publisher` address enforced by this contract.
/// - **Indexers** consume `LabelPublished` events and update indexed data.
///
/// ## Responsibilities
///
/// 1. Discoverers find preimages of encoded labelhashes in indexed ENS data.
/// 2. Discoverers submit candidates to ENSRainbowBeam with optional discoverer attribution.
/// 3. ENSRainbowBeam minimizes unproductive publishes that would not heal indexed labels.
/// 4. ENSNameHealer enforces single-publisher access and emits all published labels.
/// 5. Indexers interpret each LiteralLabel, handle duplicates idempotently, and retain
///    published labels so a label indexed at time T may heal additional names at T+N.
///
/// ## Design
///
/// A single publisher is enforced to minimize duplicate events and coordination overhead.
/// Only one ENSRainbowBeam instance should publish across the ENS ecosystem. To pause
/// publishing, the owner sets `publisher` to the zero address.
///
/// @dev Upgradeable via UUPS. Storage layout must be preserved across upgrades.
contract ENSNameHealer is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    /// @notice Sole address permitted to publish labels onchain.
    address public publisher;

    /// @notice A LiteralLabel was published for indexer consumption.
    /// @param literalLabel Any possible string; see https://ensnode.io/docs/reference/terminology
    /// @param discoverer Optional discoverer attribution. `address(0)` when absent.
    event LabelPublished(string literalLabel, address indexed discoverer);

    /// @notice The publisher address was updated.
    event PublisherSet(address indexed publisher);

    error NotPublisher();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @param owner Address to assign ownership.
    /// @param initialPublisher Initial publisher address. Use `address(0)` to start paused.
    function initialize(address owner, address initialPublisher) external initializer {
        __Ownable_init(owner);
        __UUPSUpgradeable_init();
        publisher = initialPublisher;
        emit PublisherSet(initialPublisher);
    }

    /// @notice Assign the sole publisher. Set to `address(0)` to pause publishing.
    function setPublisher(address newPublisher) external onlyOwner {
        publisher = newPublisher;
        emit PublisherSet(newPublisher);
    }

    /// @notice Publish a LiteralLabel without discoverer attribution.
    function publishLabel(string calldata literalLabel) external onlyPublisher {
        emit LabelPublished(literalLabel, address(0));
    }

    /// @notice Publish a LiteralLabel with discoverer attribution.
    function publishLabel(string calldata literalLabel, address discoverer) external onlyPublisher {
        emit LabelPublished(literalLabel, discoverer);
    }

    /// @notice Publish multiple LiteralLabels without discoverer attribution.
    function publishLabels(string[] calldata literalLabels) external onlyPublisher {
        for (uint256 i = 0; i < literalLabels.length; i++) {
            emit LabelPublished(literalLabels[i], address(0));
        }
    }

    /// @notice Publish multiple LiteralLabels with shared discoverer attribution.
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

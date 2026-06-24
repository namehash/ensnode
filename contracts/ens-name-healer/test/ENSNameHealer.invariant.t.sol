// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ENSNameHealer.sol";

contract ENSNameHealerHandler is Test {
    ENSNameHealer internal healer;
    address internal owner;
    address internal publisher;

    bool public labelPublishedWhilePaused;

    constructor(ENSNameHealer _healer, address _owner, address _publisher) {
        healer = _healer;
        owner = _owner;
        publisher = _publisher;
    }

    function publishLabel(string calldata literalLabel) external {
        bool paused = healer.publisher() == address(0);

        vm.recordLogs();
        vm.prank(publisher);
        try healer.publishLabel(literalLabel) {
            if (paused) {
                Vm.Log[] memory logs = vm.getRecordedLogs();
                bytes32 sig = keccak256("LabelPublished(string,address)");
                for (uint256 i = 0; i < logs.length; i++) {
                    if (logs[i].topics[0] == sig) labelPublishedWhilePaused = true;
                }
            }
        } catch {}
    }

    function publishLabels(string[4] calldata input, uint8 seed) external {
        uint256 len = (uint256(seed) % 4) + 1;
        string[] memory literalLabels = new string[](len);
        for (uint256 i = 0; i < len; i++) {
            literalLabels[i] = input[i];
        }

        bool paused = healer.publisher() == address(0);

        vm.recordLogs();
        vm.prank(publisher);
        try healer.publishLabels(literalLabels) {
            if (paused) {
                Vm.Log[] memory logs = vm.getRecordedLogs();
                bytes32 sig = keccak256("LabelPublished(string,address)");
                for (uint256 i = 0; i < logs.length; i++) {
                    if (logs[i].topics[0] == sig) labelPublishedWhilePaused = true;
                }
            }
        } catch {}
    }

    function pause() external {
        if (healer.publisher() != address(0)) {
            vm.prank(owner);
            healer.setPublisher(address(0));
        }
    }

    function unpause() external {
        if (healer.publisher() == address(0)) {
            vm.prank(owner);
            healer.setPublisher(publisher);
        }
    }
}

contract ENSNameHealerInvariantTest is Test {
    ENSNameHealer internal healer;
    ENSNameHealerHandler internal handler;

    address internal owner = makeAddr("owner");
    address internal publisher = makeAddr("publisher");

    function setUp() public {
        ENSNameHealer impl = new ENSNameHealer();
        bytes memory initData = abi.encodeCall(ENSNameHealer.initialize, (owner));
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        healer = ENSNameHealer(address(proxy));

        vm.prank(owner);
        healer.setPublisher(publisher);

        handler = new ENSNameHealerHandler(healer, owner, publisher);
        targetContract(address(handler));
    }

    function invariant_noLabelPublishedWhilePaused() public view {
        assertFalse(handler.labelPublishedWhilePaused(), "LabelPublished emitted while paused");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ENSLabelHealer.sol";

contract ENSLabelHealerHandler is Test {
    ENSLabelHealer internal healer;
    address internal admin;
    address internal submitter;

    bool public labelHealedWhilePaused;

    constructor(ENSLabelHealer _healer, address _admin, address _submitter) {
        healer = _healer;
        admin = _admin;
        submitter = _submitter;
    }

    function submit(string calldata label) external {
        bool paused = healer.paused();

        vm.recordLogs();
        vm.prank(submitter);
        try healer.submit(label) {
            if (paused) {
                Vm.Log[] memory logs = vm.getRecordedLogs();
                bytes32 sig = keccak256("LabelHealed(string)");
                for (uint256 i = 0; i < logs.length; i++) {
                    if (logs[i].topics[0] == sig) labelHealedWhilePaused = true;
                }
            }
        } catch {}
    }

    function pause() external {
        if (!healer.paused()) {
            vm.prank(admin);
            healer.pause();
        }
    }

    function unpause() external {
        if (healer.paused()) {
            vm.prank(admin);
            healer.unpause();
        }
    }
}

contract ENSLabelHealerInvariantTest is Test {
    ENSLabelHealer internal healer;
    ENSLabelHealerHandler internal handler;

    address internal admin = makeAddr("admin");
    address internal submitter = makeAddr("submitter");

    function setUp() public {
        ENSLabelHealer impl = new ENSLabelHealer();
        bytes memory initData = abi.encodeCall(ENSLabelHealer.initialize, (admin));
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        healer = ENSLabelHealer(address(proxy));

        vm.prank(admin);
        healer.grantRole(keccak256("SUBMITTER_ROLE"), submitter);

        handler = new ENSLabelHealerHandler(healer, admin, submitter);
        targetContract(address(handler));
    }

    function invariant_noLabelHealedWhilePaused() public view {
        assertFalse(handler.labelHealedWhilePaused(), "LabelHealed emitted while paused");
    }
}

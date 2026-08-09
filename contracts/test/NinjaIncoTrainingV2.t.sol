// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IncoTest} from "@inco/lightning/src/test/IncoTest.sol";
import {euint256} from "@inco/lightning/src/Lib.sol";
import {NinjaIncoProgressionV2} from "../src/NinjaIncoProgressionV2.sol";
import {NinjaIncoTrainingV2} from "../src/NinjaIncoTrainingV2.sol";

contract TestNinjaIncoTrainingV2 is IncoTest {
    NinjaIncoProgressionV2 progression;
    NinjaIncoTrainingV2 training;
    address promoter = address(0xA0A0);

    function setUp() public override {
        super.setUp();
        progression = new NinjaIncoProgressionV2();
        training = new NinjaIncoTrainingV2(address(progression));
        progression.setAuthorizedTrainer(address(training), true);
        progression.setAuthorizedRankUpdater(promoter, true);
    }

    function testDeploymentReferencesProgression() public view {
        assertEq(address(training.progression()), address(progression));
    }

    function testZeroAddressRejected() public {
        vm.expectRevert(NinjaIncoTrainingV2.ZeroAddress.selector);
        new NinjaIncoTrainingV2(address(0));
    }

    function testPlayerTrainingIncreasesOnlyConfidentialTraining() public {
        vm.prank(alice);
        training.train(keccak256("alice-training-1"));
        processAllOperations();

        (uint256 wins, uint256 count) = _plaintextProgress(alice);
        assertEq(wins, 0);
        assertEq(count, 1);
        assertEq(uint8(progression.rankOf(alice)), uint8(NinjaIncoProgressionV2.Rank.Academy));
    }

    function testDirectProgressionTrainingRejected() public {
        vm.prank(alice);
        vm.expectRevert(NinjaIncoProgressionV2.UnauthorizedTrainer.selector);
        progression.recordConfidentialTraining(alice, keccak256("direct"));
    }

    function testReplayAndZeroActionIdsRejected() public {
        bytes32 actionId = keccak256("one-action");
        vm.prank(alice); training.train(actionId);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(NinjaIncoProgressionV2.ActionAlreadyConsumed.selector, actionId));
        training.train(actionId);
        vm.prank(alice);
        vm.expectRevert(NinjaIncoProgressionV2.InvalidActionId.selector);
        training.train(bytes32(0));
    }

    function testMultipleActionsAccumulate() public {
        for (uint256 i; i < 4; ++i) {
            vm.prank(alice);
            training.train(keccak256(abi.encode("training", alice, i)));
        }
        processAllOperations();
        (, uint256 count) = _plaintextProgress(alice);
        assertEq(count, 4);
    }

    function testOnlyProgressionOwnerCanAuthorizeTrainer() public {
        NinjaIncoTrainingV2 other = new NinjaIncoTrainingV2(address(progression));
        vm.prank(alice);
        vm.expectRevert();
        progression.setAuthorizedTrainer(address(other), true);
        vm.prank(alice);
        vm.expectRevert(NinjaIncoProgressionV2.UnauthorizedTrainer.selector);
        other.train(keccak256("unauthorized-contract"));
    }

    function testTrainingRemainsAvailableAtChuninAndJoninWithoutChangingRank() public {
        _advance(alice, NinjaIncoProgressionV2.Rank.Chunin, "chunin");
        vm.prank(alice); training.train(keccak256("chunin-training"));
        assertEq(uint8(progression.rankOf(alice)), uint8(NinjaIncoProgressionV2.Rank.Chunin));

        _advance(alice, NinjaIncoProgressionV2.Rank.Jonin, "jonin");
        vm.prank(alice); training.train(keccak256("jonin-training"));
        processAllOperations();
        (, uint256 count) = _plaintextProgress(alice);
        assertEq(count, 2);
        assertEq(uint8(progression.rankOf(alice)), uint8(NinjaIncoProgressionV2.Rank.Jonin));
    }

    function testTrainingCannotSkipRanks() public {
        vm.prank(alice); training.train(keccak256("many-1"));
        vm.prank(alice); training.train(keccak256("many-2"));
        vm.prank(alice); training.train(keccak256("many-3"));
        assertEq(uint8(progression.rankOf(alice)), uint8(NinjaIncoProgressionV2.Rank.Academy));
        vm.prank(address(training));
        vm.expectRevert(NinjaIncoProgressionV2.UnauthorizedRankUpdater.selector);
        progression.advanceRank(alice, NinjaIncoProgressionV2.Rank.Jonin, keccak256("skip"));
    }

    function _advance(address player, NinjaIncoProgressionV2.Rank rank, string memory label) internal {
        vm.prank(promoter);
        progression.advanceRank(player, rank, keccak256(bytes(label)));
    }

    function _plaintextProgress(address player) internal returns (uint256 wins, uint256 count) {
        vm.prank(player);
        (euint256 encryptedWins, euint256 encryptedCount) = progression.getMyConfidentialProgress();
        processAllOperations();
        return (getUint256Value(encryptedWins), getUint256Value(encryptedCount));
    }
}

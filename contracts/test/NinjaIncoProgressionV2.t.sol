// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IncoTest} from "@inco/lightning/src/test/IncoTest.sol";
import {e, ebool, euint256} from "@inco/lightning/src/Lib.sol";
import {NinjaIncoProgressionV2} from "../src/NinjaIncoProgressionV2.sol";
import {NinjaIncoTechniqueRegistry} from "../src/NinjaIncoTechniqueRegistry.sol";
import {NinjaIncoChallengeRegistry} from "../src/NinjaIncoChallengeRegistry.sol";

contract TestNinjaIncoProgressionV2 is IncoTest {
    NinjaIncoProgressionV2 progression;
    NinjaIncoTechniqueRegistry techniques;
    NinjaIncoChallengeRegistry challenges;
    address duelSettler = address(0xD0E1);
    address trainer = address(0x7A11);
    address promoter = address(0xA0A0);

    function setUp() public override {
        super.setUp();
        progression = new NinjaIncoProgressionV2();
        techniques = new NinjaIncoTechniqueRegistry();
        challenges = new NinjaIncoChallengeRegistry(address(techniques));
        progression.setAuthorizedDuelSettler(duelSettler, true);
        progression.setAuthorizedTrainer(trainer, true);
        progression.setAuthorizedRankUpdater(promoter, true);
    }

    function testDefaultsAndConfidentialZeroCounters() public {
        assertEq(uint8(progression.rankOf(alice)), uint8(NinjaIncoProgressionV2.Rank.Academy));
        (euint256 wins, euint256 training) = _getProgress(alice);
        assertEq(getUint256Value(wins), 0);
        assertEq(getUint256Value(training), 0);
    }

    function testTrueWinIncrementsAndFalseDoesNot() public {
        _settle(alice, true, keccak256("win-1"));
        _settle(alice, false, keccak256("loss-1"));
        _settle(alice, true, keccak256("win-2"));
        processAllOperations();
        (euint256 wins,) = _getProgress(alice);
        assertEq(getUint256Value(wins), 2);
    }

    function testTrainingAndConfidentialEligibility() public {
        _train(alice, 2);
        _settle(alice, true, keccak256("w1")); _settle(alice, true, keccak256("w2")); _settle(alice, true, keccak256("w3"));
        processAllOperations();
        vm.prank(promoter);
        ebool eligible = progression.getPromotionEligibility(alice);
        processAllOperations();
        assertTrue(getBoolValue(eligible));
    }

    function testReplayAndUnauthorizedSettlementRejected() public {
        bytes32 actionId = keccak256("duel-action");
        _settle(alice, true, actionId);
        vm.startPrank(duelSettler);
        ebool replayWin = e.asEbool(true);
        e.allow(replayWin, address(progression));
        vm.expectRevert(abi.encodeWithSelector(NinjaIncoProgressionV2.ActionAlreadyConsumed.selector, actionId));
        progression.recordConfidentialChallengeResult(alice, replayWin, actionId);
        vm.stopPrank();
        vm.startPrank(bob);
        ebool unauthorizedWin = e.asEbool(true);
        e.allow(unauthorizedWin, address(progression));
        vm.expectRevert(NinjaIncoProgressionV2.UnauthorizedDuelSettler.selector);
        progression.recordConfidentialChallengeResult(alice, unauthorizedWin, keccak256("unauthorized"));
        vm.stopPrank();
    }

    function testRankSequentialAndRegistryIntegration() public {
        vm.prank(promoter);
        vm.expectRevert(abi.encodeWithSelector(NinjaIncoProgressionV2.InvalidRankTransition.selector, NinjaIncoProgressionV2.Rank.Academy, NinjaIncoProgressionV2.Rank.Jonin));
        progression.advanceRank(alice, NinjaIncoProgressionV2.Rank.Jonin, keccak256("skip"));
        vm.prank(promoter);
        progression.advanceRank(alice, NinjaIncoProgressionV2.Rank.Chunin, keccak256("chunin"));
        assertTrue(techniques.isTechniqueAvailable(6, NinjaIncoTechniqueRegistry.Rank.Chunin));
        assertTrue(challenges.canEnterChallenge(1, NinjaIncoChallengeRegistry.Rank.Chunin));
        vm.prank(promoter);
        vm.expectRevert(abi.encodeWithSelector(NinjaIncoProgressionV2.InvalidRankTransition.selector, NinjaIncoProgressionV2.Rank.Chunin, NinjaIncoProgressionV2.Rank.Academy));
        progression.advanceRank(alice, NinjaIncoProgressionV2.Rank.Academy, keccak256("back"));
    }

    function testZeroAddressAndRoleSeparation() public {
        vm.expectRevert(NinjaIncoProgressionV2.InvalidAddress.selector);
        progression.setAuthorizedDuelSettler(address(0), true);
        vm.prank(duelSettler);
        vm.expectRevert(NinjaIncoProgressionV2.UnauthorizedRankUpdater.selector);
        progression.advanceRank(alice, NinjaIncoProgressionV2.Rank.Chunin, keccak256("bad-rank"));
    }

    function _settle(address player, bool won, bytes32 actionId) internal {
        vm.startPrank(duelSettler);
        ebool encryptedWon = e.asEbool(won);
        e.allow(encryptedWon, address(progression));
        progression.recordConfidentialChallengeResult(player, encryptedWon, actionId);
        vm.stopPrank();
    }

    function _train(address player, uint256 count) internal {
        for (uint256 i; i < count; ++i) {
            vm.prank(trainer);
            progression.recordConfidentialTraining(player, keccak256(abi.encode(player, "training", i)));
        }
    }

    function _getProgress(address player) internal returns (euint256 wins, euint256 training) {
        vm.prank(player);
        return progression.getMyConfidentialProgress();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {NinjaIncoTechniqueRegistry} from "../src/NinjaIncoTechniqueRegistry.sol";
import {NinjaIncoProgression} from "../src/NinjaIncoProgression.sol";

contract TestNinjaIncoV2Foundation is Test {
    NinjaIncoTechniqueRegistry registry;
    NinjaIncoProgression progression;
    address updater = address(0xBEEF);
    address player = address(0xCAFE);

    function setUp() public {
        registry = new NinjaIncoTechniqueRegistry();
        progression = new NinjaIncoProgression();
        progression.setAuthorizedUpdater(updater, true);
    }

    function testTechniqueIdsAndMetadataAreStable() public view {
        NinjaIncoTechniqueRegistry.Technique memory shadow = registry.getTechnique(0);
        NinjaIncoTechniqueRegistry.Technique memory guard = registry.getTechnique(1);
        NinjaIncoTechniqueRegistry.Technique memory step = registry.getTechnique(2);
        NinjaIncoTechniqueRegistry.Technique memory flame = registry.getTechnique(3);
        NinjaIncoTechniqueRegistry.Technique memory ultimate = registry.getTechnique(10);

        assertEq(shadow.id, 0); assertEq(keccak256(bytes(shadow.name)), keccak256(bytes("Shadow Blade")));
        assertEq(guard.id, 1); assertEq(keccak256(bytes(guard.name)), keccak256(bytes("Spirit Guard")));
        assertEq(step.id, 2); assertEq(keccak256(bytes(step.name)), keccak256(bytes("Phantom Step")));
        assertEq(flame.id, 3); assertEq(uint8(flame.requiredRank), uint8(NinjaIncoTechniqueRegistry.Rank.Chunin));
        assertEq(ultimate.id, 10); assertEq(uint8(ultimate.requiredRank), uint8(NinjaIncoTechniqueRegistry.Rank.Jonin));
    }

    function testTechniqueAvailabilityFollowsRankAndEnabledState() public {
        assertTrue(registry.isTechniqueAvailable(0, NinjaIncoTechniqueRegistry.Rank.Academy));
        assertFalse(registry.isTechniqueAvailable(3, NinjaIncoTechniqueRegistry.Rank.Academy));
        assertTrue(registry.isTechniqueAvailable(3, NinjaIncoTechniqueRegistry.Rank.Chunin));
        registry.setTechniqueEnabled(3, false);
        assertFalse(registry.isTechniqueAvailable(3, NinjaIncoTechniqueRegistry.Rank.Chunin));
    }

    function testCombatRulesPreserveAcademyCycleAndSymmetry() public view {
        assertEq(uint8(registry.getCombatRule(0, 2)), uint8(NinjaIncoTechniqueRegistry.OutcomeRule.TechniqueAWin));
        assertEq(uint8(registry.getCombatRule(2, 0)), uint8(NinjaIncoTechniqueRegistry.OutcomeRule.TechniqueBWin));
        assertEq(uint8(registry.getCombatRule(1, 0)), uint8(NinjaIncoTechniqueRegistry.OutcomeRule.TechniqueAWin));
        assertEq(uint8(registry.getCombatRule(2, 1)), uint8(NinjaIncoTechniqueRegistry.OutcomeRule.TechniqueAWin));
        assertEq(uint8(registry.getCombatRule(4, 3)), uint8(NinjaIncoTechniqueRegistry.OutcomeRule.Draw));
        assertEq(uint8(registry.getCombatRule(3, 3)), uint8(NinjaIncoTechniqueRegistry.OutcomeRule.Draw));
    }

    function testEveryTechniquePairHasDeterministicRule() public view {
        for (uint16 a; a < 11; ++a) {
            for (uint16 b; b < 11; ++b) {
                registry.getCombatRule(a, b);
            }
        }
    }

    function testInvalidOrDisabledTechniqueCannotResolveRule() public {
        vm.expectRevert(abi.encodeWithSelector(NinjaIncoTechniqueRegistry.TechniqueNotFound.selector, uint16(11)));
        registry.getCombatRule(11, 0);
        registry.setTechniqueEnabled(3, false);
        vm.expectRevert(abi.encodeWithSelector(NinjaIncoTechniqueRegistry.TechniqueNotFound.selector, uint16(3)));
        registry.getCombatRule(3, 0);
    }

    function testOnlyOwnerCanModifyCombatRules() public {
        vm.prank(updater);
        vm.expectRevert();
        registry.setCombatRule(0, 1, NinjaIncoTechniqueRegistry.OutcomeRule.Draw);
        registry.setCombatRule(0, 1, NinjaIncoTechniqueRegistry.OutcomeRule.Draw);
        assertEq(uint8(registry.getCombatRule(0, 1)), uint8(NinjaIncoTechniqueRegistry.OutcomeRule.Draw));
    }

    function testOnlyOwnerCanChangeTechniqueDefinitions() public {
        vm.prank(updater);
        vm.expectRevert();
        registry.setTechniqueEnabled(0, false);
    }

    function testDuplicateTechniqueIdsCannotOverwrite() public {
        vm.expectRevert(abi.encodeWithSelector(NinjaIncoTechniqueRegistry.TechniqueAlreadyExists.selector, uint16(0)));
        registry.addTechnique(0, "Different", NinjaIncoTechniqueRegistry.Rank.Academy, NinjaIncoTechniqueRegistry.Category.Special);
    }

    function testPlayersStartAsAcademyWithZeroCounters() public view {
        NinjaIncoProgression.Progress memory progress = progression.getProgress(player);
        assertEq(uint8(progress.rank), uint8(NinjaIncoProgression.Rank.Academy));
        assertEq(progress.trainingCount, 0);
        assertEq(progress.challengeWins, 0);
    }

    function testUnauthorizedPlayersCannotGrantProgress() public {
        vm.prank(player);
        vm.expectRevert(NinjaIncoProgression.UnauthorizedUpdater.selector);
        progression.recordChallengeWin(player, keccak256("win"));
    }

    function testAuthorizedUpdaterRecordsEachActionOnce() public {
        bytes32 training = keccak256("training-1");
        bytes32 win = keccak256("win-1");
        vm.startPrank(updater);
        progression.recordTraining(player, training);
        progression.recordChallengeWin(player, win);
        vm.expectRevert(abi.encodeWithSelector(NinjaIncoProgression.ActionAlreadyConsumed.selector, training));
        progression.recordTraining(player, training);
        vm.stopPrank();

        NinjaIncoProgression.Progress memory progress = progression.getProgress(player);
        assertEq(progress.trainingCount, 1);
        assertEq(progress.challengeWins, 1);
    }

    function testRankCannotSkipAndOnlyMovesForward() public {
        vm.startPrank(updater);
        vm.expectRevert(abi.encodeWithSelector(NinjaIncoProgression.InvalidRankTransition.selector, NinjaIncoProgression.Rank.Academy, NinjaIncoProgression.Rank.Jonin));
        progression.advanceRank(player, NinjaIncoProgression.Rank.Jonin, keccak256("skip"));
        progression.advanceRank(player, NinjaIncoProgression.Rank.Chunin, keccak256("chunin"));
        vm.expectRevert(abi.encodeWithSelector(NinjaIncoProgression.InvalidRankTransition.selector, NinjaIncoProgression.Rank.Chunin, NinjaIncoProgression.Rank.Academy));
        progression.advanceRank(player, NinjaIncoProgression.Rank.Academy, keccak256("back"));
        vm.stopPrank();
        assertEq(uint8(progression.rankOf(player)), uint8(NinjaIncoProgression.Rank.Chunin));
    }
}

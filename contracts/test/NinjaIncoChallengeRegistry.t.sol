// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {NinjaIncoTechniqueRegistry} from "../src/NinjaIncoTechniqueRegistry.sol";
import {NinjaIncoChallengeRegistry} from "../src/NinjaIncoChallengeRegistry.sol";

contract TestNinjaIncoChallengeRegistry is Test {
    NinjaIncoTechniqueRegistry techniques;
    NinjaIncoChallengeRegistry challenges;
    address nonOwner = address(0xBEEF);

    function setUp() public {
        techniques = new NinjaIncoTechniqueRegistry();
        challenges = new NinjaIncoChallengeRegistry(address(techniques));
    }

    function testInitialChallenges() public view {
        NinjaIncoChallengeRegistry.Challenge memory academy = challenges.getChallenge(0);
        NinjaIncoChallengeRegistry.Challenge memory chunin = challenges.getChallenge(1);
        NinjaIncoChallengeRegistry.Challenge memory jonin = challenges.getChallenge(2);
        assertEq(academy.id, 0); assertEq(uint8(academy.requiredRank), uint8(NinjaIncoChallengeRegistry.Rank.Academy)); assertEq(uint8(academy.opponentTier), uint8(NinjaIncoChallengeRegistry.Rank.Academy)); assertEq(academy.difficulty, 1); assertTrue(academy.enabled);
        assertEq(uint8(chunin.requiredRank), uint8(NinjaIncoChallengeRegistry.Rank.Chunin)); assertEq(uint8(chunin.opponentTier), uint8(NinjaIncoChallengeRegistry.Rank.Chunin)); assertEq(chunin.difficulty, 2); assertTrue(chunin.enabled);
        assertEq(uint8(jonin.requiredRank), uint8(NinjaIncoChallengeRegistry.Rank.Jonin)); assertEq(uint8(jonin.opponentTier), uint8(NinjaIncoChallengeRegistry.Rank.Jonin)); assertEq(jonin.difficulty, 3); assertTrue(jonin.enabled);
    }

    function testInitialTechniquePools() public view {
        assertEq(challenges.getTechniquePoolIds(0), _ids(3));
        assertEq(challenges.getTechniquePoolIds(1), _ids(7));
        assertEq(challenges.getTechniquePoolIds(2), _ids(11));
    }

    function testRankGating() public view {
        assertTrue(challenges.canEnterChallenge(0, NinjaIncoChallengeRegistry.Rank.Academy));
        assertTrue(challenges.canEnterChallenge(0, NinjaIncoChallengeRegistry.Rank.Chunin));
        assertTrue(challenges.canEnterChallenge(0, NinjaIncoChallengeRegistry.Rank.Jonin));
        assertFalse(challenges.canEnterChallenge(1, NinjaIncoChallengeRegistry.Rank.Academy));
        assertTrue(challenges.canEnterChallenge(1, NinjaIncoChallengeRegistry.Rank.Chunin));
        assertTrue(challenges.canEnterChallenge(1, NinjaIncoChallengeRegistry.Rank.Jonin));
        assertFalse(challenges.canEnterChallenge(2, NinjaIncoChallengeRegistry.Rank.Academy));
        assertFalse(challenges.canEnterChallenge(2, NinjaIncoChallengeRegistry.Rank.Chunin));
        assertTrue(challenges.canEnterChallenge(2, NinjaIncoChallengeRegistry.Rank.Jonin));
    }

    function testOwnerCanUpdateAndDisable() public {
        challenges.updateChallenge(1, "Chunin Trial", NinjaIncoChallengeRegistry.Rank.Chunin, NinjaIncoChallengeRegistry.Rank.Chunin, 1, 4);
        assertEq(keccak256(bytes(challenges.getChallenge(1).name)), keccak256(bytes("Chunin Trial")));
        challenges.setChallengeEnabled(1, false);
        assertFalse(challenges.canEnterChallenge(1, NinjaIncoChallengeRegistry.Rank.Jonin));
    }

    function testNonOwnerCannotAdminister() public {
        vm.startPrank(nonOwner);
        vm.expectRevert(); challenges.setChallengeEnabled(0, false);
        vm.expectRevert(); challenges.setTechniquePoolEnabled(0, false);
        vm.expectRevert(); challenges.addChallenge(8, "Nope", NinjaIncoChallengeRegistry.Rank.Academy, NinjaIncoChallengeRegistry.Rank.Academy, 0, 1);
        vm.stopPrank();
    }

    function testDuplicateIdsAndInvalidConfigurationRejected() public {
        vm.expectRevert(abi.encodeWithSelector(NinjaIncoChallengeRegistry.ChallengeAlreadyExists.selector, uint256(0)));
        challenges.addChallenge(0, "Duplicate", NinjaIncoChallengeRegistry.Rank.Academy, NinjaIncoChallengeRegistry.Rank.Academy, 0, 1);
        vm.expectRevert(abi.encodeWithSelector(NinjaIncoChallengeRegistry.PoolAlreadyExists.selector, uint256(0)));
        challenges.addTechniquePool(0, "Duplicate", _ids(3));
        vm.expectRevert(NinjaIncoChallengeRegistry.EmptyName.selector);
        challenges.addChallenge(8, "", NinjaIncoChallengeRegistry.Rank.Academy, NinjaIncoChallengeRegistry.Rank.Academy, 0, 1);
        vm.expectRevert(NinjaIncoChallengeRegistry.InvalidDifficulty.selector);
        challenges.addChallenge(8, "Bad", NinjaIncoChallengeRegistry.Rank.Academy, NinjaIncoChallengeRegistry.Rank.Academy, 0, 0);
        vm.expectRevert(abi.encodeWithSelector(NinjaIncoChallengeRegistry.ChallengePoolNotFound.selector, uint256(9)));
        challenges.addChallenge(8, "Bad", NinjaIncoChallengeRegistry.Rank.Academy, NinjaIncoChallengeRegistry.Rank.Academy, 9, 1);
        vm.expectRevert(abi.encodeWithSelector(NinjaIncoChallengeRegistry.TechniqueNotFound.selector, uint256(99)));
        challenges.updateTechniquePool(2, "Bad", _ids(1, 99));
    }

    function testDisabledPoolPreventsEntry() public {
        challenges.setTechniquePoolEnabled(0, false);
        assertFalse(challenges.canEnterChallenge(0, NinjaIncoChallengeRegistry.Rank.Academy));
    }

    function _ids(uint256 length) private pure returns (uint256[] memory ids) { ids = new uint256[](length); for (uint256 i; i < length; ++i) ids[i] = i; }
    function _ids(uint256 first, uint256 second) private pure returns (uint256[] memory ids) { ids = new uint256[](2); ids[0] = first; ids[1] = second; }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {NinjaIncoTechniqueRegistry} from "../src/NinjaIncoTechniqueRegistry.sol";
import {NinjaIncoChallengeRegistry} from "../src/NinjaIncoChallengeRegistry.sol";
import {NinjaIncoProgressionV2} from "../src/NinjaIncoProgressionV2.sol";
import {NinjaIncoTrainingV2} from "../src/NinjaIncoTrainingV2.sol";
import {NinjaIncoDuelV2} from "../src/NinjaIncoDuelV2.sol";
import {NinjaIncoPromotionV2} from "../src/NinjaIncoPromotionV2.sol";

contract TestNinjaIncoV2Deployment is Test {
    NinjaIncoTechniqueRegistry t; NinjaIncoChallengeRegistry c; NinjaIncoProgressionV2 p; NinjaIncoTrainingV2 tr; NinjaIncoDuelV2 d; NinjaIncoPromotionV2 pr;
    function setUp() public { t = new NinjaIncoTechniqueRegistry(); c = new NinjaIncoChallengeRegistry(address(t)); p = new NinjaIncoProgressionV2(); tr = new NinjaIncoTrainingV2(address(p)); d = new NinjaIncoDuelV2(address(t), address(c), address(p)); pr = new NinjaIncoPromotionV2(address(p), address(t), address(c)); p.setAuthorizedTrainer(address(tr), true); p.setAuthorizedDuelSettler(address(d), true); p.setAuthorizedRankUpdater(address(pr), true); }
    function testFullGraphAndInitialRegistryState() public view { assertTrue(address(t) != address(0) && address(c) != address(0) && address(p) != address(0) && address(tr) != address(0) && address(d) != address(0) && address(pr) != address(0)); assertEq(address(c.techniqueRegistry()), address(t)); assertEq(address(tr.progression()), address(p)); assertEq(address(d.techniqueRegistry()), address(t)); assertEq(address(d.challengeRegistry()), address(c)); assertEq(address(d.progression()), address(p)); assertEq(address(pr.progression()), address(p)); assertEq(address(pr.techniqueRegistry()), address(t)); assertEq(address(pr.challengeRegistry()), address(c)); assertTrue(p.authorizedTrainer(address(tr))); assertTrue(p.authorizedDuelSettler(address(d))); assertTrue(p.authorizedRankUpdater(address(pr))); assertTrue(c.isTechniquePoolEnabled(0) && c.isTechniquePoolEnabled(1) && c.isTechniquePoolEnabled(2)); assertTrue(c.isChallengeEnabled(0) && c.isChallengeEnabled(1) && c.isChallengeEnabled(2)); assertTrue(c.canEnterChallenge(0, NinjaIncoChallengeRegistry.Rank.Academy)); assertTrue(c.canEnterChallenge(1, NinjaIncoChallengeRegistry.Rank.Chunin)); assertTrue(c.canEnterChallenge(2, NinjaIncoChallengeRegistry.Rank.Jonin)); }
}

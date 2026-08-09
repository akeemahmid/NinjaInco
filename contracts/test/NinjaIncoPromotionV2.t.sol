// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IncoTest} from "@inco/lightning/src/test/IncoTest.sol";
import {e, ebool, euint256, inco} from "@inco/lightning/src/Lib.sol";
import {DecryptionAttestation} from "@inco/lightning/src/lightning-parts/DecryptionAttester.types.sol";
import {AllowanceProof, AdvancedAccessControl} from "@inco/lightning/src/lightning-parts/AccessControl/AdvancedAccessControl.sol";
import {NinjaIncoTechniqueRegistry} from "../src/NinjaIncoTechniqueRegistry.sol";
import {NinjaIncoChallengeRegistry} from "../src/NinjaIncoChallengeRegistry.sol";
import {NinjaIncoProgressionV2} from "../src/NinjaIncoProgressionV2.sol";
import {NinjaIncoTrainingV2} from "../src/NinjaIncoTrainingV2.sol";
import {NinjaIncoDuelV2} from "../src/NinjaIncoDuelV2.sol";
import {NinjaIncoPromotionV2} from "../src/NinjaIncoPromotionV2.sol";

contract PromotionFixedDuelV2 is NinjaIncoDuelV2 {
    uint256 immutable fixedTechnique;
    constructor(address t, address c, address p) NinjaIncoDuelV2(t, c, p) { fixedTechnique = 2; }
    function _selectOpponentTechnique(uint256[] memory) internal override returns (euint256 selected) { selected = e.asEuint256(fixedTechnique); }
}

contract TestNinjaIncoPromotionV2 is IncoTest {
    NinjaIncoTechniqueRegistry techniques; NinjaIncoChallengeRegistry challenges; NinjaIncoProgressionV2 progression;
    NinjaIncoTrainingV2 training; PromotionFixedDuelV2 duel; NinjaIncoPromotionV2 promotion;
    uint256 actionNonce;

    function setUp() public override {
        super.setUp(); techniques = new NinjaIncoTechniqueRegistry(); challenges = new NinjaIncoChallengeRegistry(address(techniques)); progression = new NinjaIncoProgressionV2();
        training = new NinjaIncoTrainingV2(address(progression)); duel = new PromotionFixedDuelV2(address(techniques), address(challenges), address(progression)); promotion = new NinjaIncoPromotionV2(address(progression), address(techniques), address(challenges));
        progression.setAuthorizedTrainer(address(training), true); progression.setAuthorizedDuelSettler(address(duel), true); progression.setAuthorizedRankUpdater(address(promotion), true);
    }

    function testAcademyToChuninEndToEndWithRealTrainingAndDuel() public {
        _train(2); _wins(3); vm.prank(alice); promotion.evaluatePromotion(); processAllOperations();
        ebool eligibility = promotion.getPendingEligibility(alice); processAllOperations(); assertTrue(getBoolValue(eligibility));
        (DecryptionAttestation memory attestation, bytes[] memory signatures) = _attestation(alice, eligibility);
        vm.prank(alice); promotion.finalizePromotion(alice, attestation, signatures);
        assertEq(uint8(progression.rankOf(alice)), uint8(NinjaIncoProgressionV2.Rank.Chunin));
        for (uint16 i; i <= 6; ++i) assertTrue(techniques.isTechniqueAvailable(i, NinjaIncoTechniqueRegistry.Rank.Chunin));
        assertFalse(techniques.isTechniqueAvailable(7, NinjaIncoTechniqueRegistry.Rank.Chunin)); assertTrue(challenges.canEnterChallenge(1, NinjaIncoChallengeRegistry.Rank.Chunin));
        vm.prank(alice); vm.expectRevert(NinjaIncoPromotionV2.NoPendingEvaluation.selector); promotion.finalizePromotion(alice, attestation, signatures);
    }

    function testChuninToJoninEndToEnd() public {
        _promoteAcademy(); _train(2); _wins(3); vm.prank(alice); promotion.evaluatePromotion(); processAllOperations();
        ebool eligibility = promotion.getPendingEligibility(alice); processAllOperations(); (DecryptionAttestation memory attestation, bytes[] memory signatures) = _attestation(alice, eligibility);
        vm.prank(alice); promotion.finalizePromotion(alice, attestation, signatures); assertEq(uint8(progression.rankOf(alice)), uint8(NinjaIncoProgressionV2.Rank.Jonin));
        for (uint16 i; i <= 10; ++i) assertTrue(techniques.isTechniqueAvailable(i, NinjaIncoTechniqueRegistry.Rank.Jonin)); assertTrue(challenges.canEnterChallenge(2, NinjaIncoChallengeRegistry.Rank.Jonin));
        vm.prank(alice); vm.expectRevert(NinjaIncoPromotionV2.NoPendingEvaluation.selector); promotion.finalizePromotion(alice, attestation, signatures);
    }

    function testInsufficientProgressCannotFinalize() public { vm.prank(alice); promotion.evaluatePromotion(); processAllOperations(); ebool eligibility = promotion.getPendingEligibility(alice); processAllOperations(); (DecryptionAttestation memory attestation, bytes[] memory signatures) = _attestation(alice, eligibility); vm.prank(alice); vm.expectRevert(NinjaIncoPromotionV2.NotEligible.selector); promotion.finalizePromotion(alice, attestation, signatures); }

    function testStaleEvaluationRejected() public { _train(2); _wins(3); vm.prank(alice); promotion.evaluatePromotion(); processAllOperations(); ebool eligibility = promotion.getPendingEligibility(alice); processAllOperations(); progression.setAuthorizedRankUpdater(address(this), true); progression.advanceRank(alice, NinjaIncoProgressionV2.Rank.Chunin, keccak256("external")); (DecryptionAttestation memory attestation, bytes[] memory signatures) = _attestation(alice, eligibility); vm.prank(alice); vm.expectRevert(NinjaIncoPromotionV2.InvalidEvaluation.selector); promotion.finalizePromotion(alice, attestation, signatures); }

    function testInvalidAttestationAndAuthorizationBoundaries() public { vm.prank(alice); promotion.evaluatePromotion(); processAllOperations(); ebool eligibility = promotion.getPendingEligibility(alice); processAllOperations(); (DecryptionAttestation memory attestation, bytes[] memory signatures) = _attestation(alice, eligibility); attestation.handle = bytes32(uint256(1)); vm.prank(alice); vm.expectRevert(NinjaIncoPromotionV2.InvalidAttestation.selector); promotion.finalizePromotion(alice, attestation, signatures); vm.prank(alice); vm.expectRevert(NinjaIncoProgressionV2.UnauthorizedRankUpdater.selector); progression.advanceRank(alice, NinjaIncoProgressionV2.Rank.Chunin, keccak256("skip")); vm.prank(alice); vm.expectRevert(NinjaIncoProgressionV2.UnauthorizedTrainer.selector); progression.recordConfidentialTraining(alice, keccak256("direct")); }

    function _promoteAcademy() internal { _train(2); _wins(3); vm.prank(alice); promotion.evaluatePromotion(); processAllOperations(); ebool e1 = promotion.getPendingEligibility(alice); processAllOperations(); (DecryptionAttestation memory a, bytes[] memory s) = _attestation(alice, e1); vm.prank(alice); promotion.finalizePromotion(alice, a, s); }
    function _train(uint256 n) internal { for (uint256 i; i < n; ++i) { vm.prank(alice); training.train(keccak256(abi.encode("training", actionNonce++))); } processAllOperations(); }
    function _wins(uint256 n) internal { for (uint256 i; i < n; ++i) { PromotionFixedDuelV2 current = new PromotionFixedDuelV2(address(techniques), address(challenges), address(progression)); progression.setAuthorizedDuelSettler(address(current), true); bytes memory encrypted = fakePrepareEuint256Ciphertext(0, alice, address(current)); uint256 fee = inco.getFee() * 512; vm.deal(alice, 10 ether); vm.prank(alice); uint256 id = current.duel{value: fee}(0, encrypted); processAllOperations(); vm.prank(alice); current.settleDuel(id); actionNonce++; } processAllOperations(); }
    function _attestation(address player, ebool eligibility) internal returns (DecryptionAttestation memory, bytes[] memory) { AllowanceProof memory empty; return getDecryptionAttestation(player, HandleWithProof({handle: ebool.unwrap(eligibility), proof: empty})); }
}

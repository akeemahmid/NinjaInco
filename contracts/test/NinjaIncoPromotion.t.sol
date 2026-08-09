// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {NinjaIncoGame} from "../src/NinjaIncoGame.sol";
import {NinjaIncoDuel} from "../src/NinjaIncoDuel.sol";
import {NinjaIncoPromotion} from "../src/NinjaIncoPromotion.sol";
import {IncoTest} from "@inco/lightning/src/test/IncoTest.sol";
import {inco, e, euint256, ebool} from "@inco/lightning/src/Lib.sol";
import {DecryptionAttestation} from "@inco/lightning/src/lightning-parts/DecryptionAttester.types.sol";
import {AllowanceProof} from "@inco/lightning/src/lightning-parts/AccessControl/AdvancedAccessControl.sol";

contract PromotionTestDuel is NinjaIncoDuel {
    constructor(address registry) NinjaIncoDuel(registry) {}
    function _selectSenseiTechnique() internal override returns (euint256) {
        euint256 technique = e.asEuint256(2);
        e.allow(technique, address(this));
        return technique;
    }
}

contract TestNinjaIncoPromotion is IncoTest {
    NinjaIncoGame game;
    NinjaIncoDuel duel;
    NinjaIncoPromotion promotion;

    function setUp() public override {
        super.setUp();
        game = new NinjaIncoGame();
        duel = new PromotionTestDuel(address(game));
        promotion = new NinjaIncoPromotion(address(duel));
        duel.setPromotionContract(address(promotion));
    }

    function testSuccessfulPlayerPromotion() public {
        _registerAndWinDuel(alice);
        vm.prank(alice);
        promotion.evaluatePromotion();
        processAllOperations();
        (DecryptionAttestation memory attestation, bytes[] memory signatures) = _promotionAttestation(alice);
        vm.prank(alice);
        promotion.finalizePromotion(alice, attestation, signatures);
        assertEq(uint256(promotion.rank(alice)), uint256(NinjaIncoPromotion.Rank.Genin));
    }

    function testPlayerPromotionFailure() public {
        _register(alice);
        vm.prank(alice);
        promotion.evaluatePromotion();
        processAllOperations();
        ebool eligibility = promotion.getPendingEligibility(alice);
        assertFalse(getBoolValue(eligibility));
        (DecryptionAttestation memory attestation, bytes[] memory signatures) = _promotionAttestation(alice);
        vm.prank(alice);
        vm.expectRevert(NinjaIncoPromotion.NotEligible.selector);
        promotion.finalizePromotion(alice, attestation, signatures);
        assertEq(uint256(promotion.rank(alice)), uint256(NinjaIncoPromotion.Rank.Initiate));
    }

    function testUnauthorizedPromotionAttempts() public {
        _register(alice);
        vm.prank(bob);
        vm.expectRevert(NinjaIncoDuel.UnauthorizedPromotionContract.selector);
        duel.getExperienceForPromotion(alice);
        vm.prank(bob);
        vm.expectRevert(NinjaIncoPromotion.UnauthorizedFinalization.selector);
        promotion.finalizePromotion(alice, DecryptionAttestation(bytes32(0), bytes32(0)), new bytes[](0));
    }

    function testReplayProtectionAndPublicRankUpdate() public {
        _registerAndWinDuel(alice);
        vm.prank(alice);
        promotion.evaluatePromotion();
        processAllOperations();
        (DecryptionAttestation memory attestation, bytes[] memory signatures) = _promotionAttestation(alice);
        vm.prank(alice);
        promotion.finalizePromotion(alice, attestation, signatures);
        assertEq(uint256(promotion.rank(alice)), uint256(NinjaIncoPromotion.Rank.Genin));

        vm.prank(alice);
        vm.expectRevert(NinjaIncoPromotion.AlreadyPromoted.selector);
        promotion.evaluatePromotion();
        vm.prank(alice);
        vm.expectRevert(NinjaIncoPromotion.NoPendingEvaluation.selector);
        promotion.finalizePromotion(alice, attestation, signatures);
    }

    function testInvalidAttestationRejected() public {
        _registerAndWinDuel(alice);
        vm.prank(alice);
        promotion.evaluatePromotion();
        processAllOperations();
        vm.prank(alice);
        vm.expectRevert(NinjaIncoPromotion.InvalidAttestation.selector);
        promotion.finalizePromotion(alice, DecryptionAttestation(bytes32(uint256(1)), bytes32(uint256(1))), new bytes[](0));
    }

    function _promotionAttestation(address player) internal returns (DecryptionAttestation memory attestation, bytes[] memory signatures) {
        ebool eligibility = promotion.getPendingEligibility(player);
        AllowanceProof memory emptyProof;
        return getDecryptionAttestation(player, HandleWithProof({handle: ebool.unwrap(eligibility), proof: emptyProof}));
    }

    function _register(address player) internal {
        bytes memory encryptedTechnique = fakePrepareEuint256Ciphertext(0, player, address(game));
        uint256 fee = inco.getFee(); vm.deal(player, 1 ether); vm.prank(player);
        game.registerPlayer{value: fee}("Promotion Ninja", 0, encryptedTechnique); processAllOperations();
    }

    function _registerAndWinDuel(address player) internal {
        _register(player);
        bytes memory encryptedTechnique = fakePrepareEuint256Ciphertext(0, player, address(duel));
        uint256 fee = inco.getFee(); vm.prank(player); duel.duel{value: fee * 2}(encryptedTechnique); processAllOperations();
    }
}

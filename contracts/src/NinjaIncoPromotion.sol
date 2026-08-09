// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {e, ebool, euint256, inco} from "@inco/lightning/src/Lib.sol";
import {DecryptionAttestation} from "@inco/lightning/src/lightning-parts/DecryptionAttester.types.sol";
import {asBool} from "@inco/lightning/src/shared/TypeUtils.sol";

interface IDuelExperience {
    function getExperienceForPromotion(address player) external returns (euint256);
}

contract NinjaIncoPromotion {
    enum Rank { Initiate, Genin }
    IDuelExperience public immutable duel;
    mapping(address => Rank) public rank;
    mapping(address => ebool) private _pendingEligibility;
    mapping(address => bool) private _hasPendingEligibility;

    event PromotionEvaluated(address indexed player);
    event PlayerPromoted(address indexed player, Rank rank);
    error NotEligible();
    error InvalidAttestation();
    error HandleMismatch();
    error AlreadyPromoted();
    error NoPendingEvaluation();
    error UnauthorizedFinalization();

    constructor(address duelAddress) { duel = IDuelExperience(duelAddress); }

    function evaluatePromotion() external {
        address player = msg.sender;
        if (rank[player] == Rank.Genin) revert AlreadyPromoted();
        euint256 experience = duel.getExperienceForPromotion(player);
        ebool eligible = e.ge(experience, e.asEuint256(1));
        e.allow(eligible, address(this));
        e.allow(eligible, player);
        _pendingEligibility[player] = eligible;
        _hasPendingEligibility[player] = true;
        emit PromotionEvaluated(player);
    }

    function getPendingEligibility(address player) external view returns (ebool) {
        return _pendingEligibility[player];
    }

    function finalizePromotion(
        address player,
        DecryptionAttestation memory decryption,
        bytes[] memory signatures
    ) external {
        if (msg.sender != player) revert UnauthorizedFinalization();
        if (!_hasPendingEligibility[player]) revert NoPendingEvaluation();
        if (!inco.incoVerifier().isValidDecryptionAttestation(decryption, signatures)) revert InvalidAttestation();
        if (ebool.unwrap(_pendingEligibility[player]) != decryption.handle) revert HandleMismatch();
        if (!asBool(decryption.value)) revert NotEligible();
        _hasPendingEligibility[player] = false;
        rank[player] = Rank.Genin;
        emit PlayerPromoted(player, Rank.Genin);
    }
}

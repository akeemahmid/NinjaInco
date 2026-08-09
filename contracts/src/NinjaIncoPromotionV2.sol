// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {e, ebool, inco} from "@inco/lightning/src/Lib.sol";
import {DecryptionAttestation} from "@inco/lightning/src/lightning-parts/DecryptionAttester.types.sol";
import {asBool} from "@inco/lightning/src/shared/TypeUtils.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {NinjaIncoProgressionV2} from "./NinjaIncoProgressionV2.sol";
import {NinjaIncoTechniqueRegistry} from "./NinjaIncoTechniqueRegistry.sol";
import {NinjaIncoChallengeRegistry} from "./NinjaIncoChallengeRegistry.sol";

contract NinjaIncoPromotionV2 is Ownable2Step {
    NinjaIncoProgressionV2 public immutable progression;
    NinjaIncoTechniqueRegistry public immutable techniqueRegistry;
    NinjaIncoChallengeRegistry public immutable challengeRegistry;

    struct Evaluation { NinjaIncoProgressionV2.Rank fromRank; NinjaIncoProgressionV2.Rank targetRank; ebool eligibility; bool pending; }
    mapping(address => Evaluation) private _evaluations;

    event PromotionEvaluated(address indexed player, NinjaIncoProgressionV2.Rank fromRank, NinjaIncoProgressionV2.Rank targetRank);
    event PromotionFinalized(address indexed player, NinjaIncoProgressionV2.Rank newRank);
    error ZeroAddress(); error NotEligible(); error NoPendingEvaluation(); error InvalidEvaluation(); error AlreadyAtHighestRank(); error InvalidAttestation(); error HandleMismatch(); error UnauthorizedFinalization();

    constructor(address progressionAddress, address techniqueRegistryAddress, address challengeRegistryAddress) Ownable(msg.sender) {
        if (progressionAddress == address(0) || techniqueRegistryAddress == address(0) || challengeRegistryAddress == address(0)) revert ZeroAddress();
        progression = NinjaIncoProgressionV2(progressionAddress); techniqueRegistry = NinjaIncoTechniqueRegistry(techniqueRegistryAddress); challengeRegistry = NinjaIncoChallengeRegistry(challengeRegistryAddress);
    }

    function evaluatePromotion() external {
        NinjaIncoProgressionV2.Rank current = progression.rankOf(msg.sender);
        if (current == NinjaIncoProgressionV2.Rank.Jonin) revert AlreadyAtHighestRank();
        NinjaIncoProgressionV2.Rank target = current == NinjaIncoProgressionV2.Rank.Academy ? NinjaIncoProgressionV2.Rank.Chunin : NinjaIncoProgressionV2.Rank.Jonin;
        ebool eligibility = progression.getPromotionEligibility(msg.sender);
        e.allow(eligibility, address(this)); e.allow(eligibility, msg.sender);
        _evaluations[msg.sender] = Evaluation(current, target, eligibility, true);
        emit PromotionEvaluated(msg.sender, current, target);
    }

    function getPendingEligibility(address player) external view returns (ebool) {
        if (!_evaluations[player].pending) revert NoPendingEvaluation();
        return _evaluations[player].eligibility;
    }

    function finalizePromotion(address player, DecryptionAttestation memory decryption, bytes[] memory signatures) external {
        if (msg.sender != player) revert UnauthorizedFinalization();
        Evaluation memory evaluation = _evaluations[player];
        if (!evaluation.pending) revert NoPendingEvaluation();
        if (!inco.incoVerifier().isValidDecryptionAttestation(decryption, signatures)) revert InvalidAttestation();
        if (ebool.unwrap(evaluation.eligibility) != decryption.handle) revert HandleMismatch();
        if (!asBool(decryption.value)) revert NotEligible();
        if (progression.rankOf(player) != evaluation.fromRank) revert InvalidEvaluation();
        delete _evaluations[player];
        progression.advanceRank(player, evaluation.targetRank, keccak256(abi.encode("promotion-v2", address(this), player, evaluation.fromRank, evaluation.targetRank)));
        emit PromotionFinalized(player, evaluation.targetRank);
    }

    function getEvaluation(address player) external view returns (Evaluation memory) { return _evaluations[player]; }
    function canPromote(address player) external view returns (bool) { return progression.rankOf(player) != NinjaIncoProgressionV2.Rank.Jonin; }
}

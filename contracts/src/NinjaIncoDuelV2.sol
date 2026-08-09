// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {e, ebool, euint256, inco} from "@inco/lightning/src/Lib.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {NinjaIncoTechniqueRegistry} from "./NinjaIncoTechniqueRegistry.sol";
import {NinjaIncoChallengeRegistry} from "./NinjaIncoChallengeRegistry.sol";
import {NinjaIncoProgressionV2} from "./NinjaIncoProgressionV2.sol";

contract NinjaIncoDuelV2 is Ownable2Step {
    enum Outcome { Draw, PlayerWin, SenseiWin }
    struct Duel { address player; uint256 challengeId; euint256 playerTechnique; euint256 opponentTechnique; euint256 outcome; bool exists; bool settled; }

    NinjaIncoTechniqueRegistry public immutable techniqueRegistry;
    NinjaIncoChallengeRegistry public immutable challengeRegistry;
    NinjaIncoProgressionV2 public immutable progression;
    uint256 public nextDuelId;
    mapping(address => uint256) public lastDuelId;
    mapping(uint256 => Duel) private _duels;

    error ZeroAddress(); error InvalidChallenge(); error InsufficientRank(); error InvalidTechnique(); error InsufficientFees(); error DuelNotFound(); error UnauthorizedSettlement(); error AlreadySettled();

    constructor(address techniqueAddress, address challengeAddress, address progressionAddress) Ownable(msg.sender) {
        if (techniqueAddress == address(0) || challengeAddress == address(0) || progressionAddress == address(0)) revert ZeroAddress();
        techniqueRegistry = NinjaIncoTechniqueRegistry(techniqueAddress); challengeRegistry = NinjaIncoChallengeRegistry(challengeAddress); progression = NinjaIncoProgressionV2(progressionAddress);
    }

    function duel(uint256 challengeId, bytes calldata encryptedTechnique) external payable returns (uint256 duelId) {
        NinjaIncoProgressionV2.Rank playerRank = progression.rankOf(msg.sender);
        if (!challengeRegistry.canEnterChallenge(challengeId, NinjaIncoChallengeRegistry.Rank(uint8(playerRank)))) revert InvalidChallenge();
        NinjaIncoChallengeRegistry.TechniquePool memory pool = challengeRegistry.getTechniquePool(challengeRegistry.getChallenge(challengeId).techniquePoolId);
        if (!challengeRegistry.isTechniquePoolEnabled(pool.id)) revert InvalidChallenge();
        uint256 resolverFee = inco.getFee() * (pool.techniqueIds.length * pool.techniqueIds.length * 3 + pool.techniqueIds.length * 4 + 16);
        if (msg.value < inco.getFee() + resolverFee) revert InsufficientFees();
        euint256 playerTechnique = e.newEuint256(encryptedTechnique, msg.sender); e.allow(playerTechnique, address(this));
        euint256 opponentTechnique = _selectOpponentTechnique(pool.techniqueIds);
        e.allow(opponentTechnique, address(this)); e.allow(opponentTechnique, msg.sender);
        uint16[] memory allowed = _toUint16(pool.techniqueIds);
        e.allow(playerTechnique, address(techniqueRegistry)); e.allow(opponentTechnique, address(techniqueRegistry));
        (euint256 outcome, ebool validPlayer, ebool validOpponent) = techniqueRegistry.resolveConfidentialRule{value: resolverFee}(playerTechnique, opponentTechnique, allowed);
        ebool valid = e.and(validPlayer, validOpponent);
        outcome = e.select(valid, outcome, e.asEuint256(uint256(Outcome.SenseiWin)));
        e.allow(outcome, address(this)); e.allow(outcome, msg.sender);
        duelId = nextDuelId++; lastDuelId[msg.sender] = duelId;
        _duels[duelId] = Duel(msg.sender, challengeId, playerTechnique, opponentTechnique, outcome, true, false);
        emit DuelCreated(msg.sender, duelId, challengeId);
    }

    function settleDuel(uint256 duelId) external {
        Duel storage current = _duels[duelId]; if (!current.exists) revert DuelNotFound(); if (current.player != msg.sender) revert UnauthorizedSettlement(); if (current.settled) revert AlreadySettled();
        ebool won = e.eq(current.outcome, uint256(Outcome.PlayerWin)); e.allow(won, address(progression));
        current.settled = true;
        progression.recordConfidentialChallengeResult(msg.sender, won, keccak256(abi.encode("duel-v2", address(this), duelId)));
        emit DuelSettled(msg.sender, duelId);
    }

    function getMyDuel(uint256 duelId) external view returns (uint256 challengeId, euint256 playerTechnique, euint256 opponentTechnique, euint256 outcome, bool settled) {
        Duel storage current = _duels[duelId]; if (!current.exists || current.player != msg.sender) revert DuelNotFound();
        return (current.challengeId, current.playerTechnique, current.opponentTechnique, current.outcome, current.settled);
    }

    event DuelCreated(address indexed player, uint256 indexed duelId, uint256 indexed challengeId);
    event DuelSettled(address indexed player, uint256 indexed duelId);

    function _toUint16(uint256[] memory values) private pure returns (uint16[] memory result) { result = new uint16[](values.length); for (uint256 i; i < values.length; ++i) result[i] = uint16(values[i]); }
    function _selectOpponentTechnique(uint256[] memory techniqueIds) internal virtual returns (euint256 selected) {
        euint256 index = e.randBounded(uint256(techniqueIds.length));
        selected = e.asEuint256(techniqueIds[0]);
        for (uint256 i = 1; i < techniqueIds.length; ++i) selected = e.select(e.eq(index, i), e.asEuint256(techniqueIds[i]), selected);
    }
}

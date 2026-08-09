// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {e, ebool, euint256} from "@inco/lightning/src/Lib.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Canonical confidential progression state for the V2 game.
contract NinjaIncoProgressionV2 is Ownable2Step {
    enum Rank { Academy, Chunin, Jonin }

    struct ConfidentialProgress {
        Rank rank;
        euint256 challengeWins;
        euint256 trainingCount;
        bool initialized;
    }

    mapping(address => ConfidentialProgress) private _progress;
    mapping(address => bool) public authorizedDuelSettler;
    mapping(address => bool) public authorizedTrainer;
    mapping(address => bool) public authorizedRankUpdater;
    mapping(bytes32 => bool) public consumedAction;

    event AuthorizationChanged(address indexed account, uint8 indexed role, bool authorized);
    event ChallengeResultSettled(address indexed player, bytes32 indexed actionId);
    event TrainingRecorded(address indexed player, bytes32 indexed actionId);
    event RankAdvanced(address indexed player, Rank previousRank, Rank newRank, bytes32 indexed actionId);

    error UnauthorizedDuelSettler();
    error UnauthorizedTrainer();
    error UnauthorizedRankUpdater();
    error InvalidAddress();
    error InvalidActionId();
    error ActionAlreadyConsumed(bytes32 actionId);
    error InvalidRankTransition(Rank currentRank, Rank requestedRank);

    constructor() Ownable(msg.sender) {}

    function setAuthorizedDuelSettler(address account, bool authorized) external onlyOwner {
        _validateAddress(account); authorizedDuelSettler[account] = authorized; emit AuthorizationChanged(account, 1, authorized);
    }

    function setAuthorizedTrainer(address account, bool authorized) external onlyOwner {
        _validateAddress(account); authorizedTrainer[account] = authorized; emit AuthorizationChanged(account, 2, authorized);
    }

    function setAuthorizedRankUpdater(address account, bool authorized) external onlyOwner {
        _validateAddress(account); authorizedRankUpdater[account] = authorized; emit AuthorizationChanged(account, 3, authorized);
    }

    /// @dev The encrypted boolean must be produced and allowed to this contract by an authorized DuelV2.
    function recordConfidentialChallengeResult(address player, ebool playerWon, bytes32 actionId) external {
        if (!authorizedDuelSettler[msg.sender]) revert UnauthorizedDuelSettler();
        _consume(player, actionId);
        ConfidentialProgress storage progress = _initialize(player);
        euint256 updated = e.select(playerWon, e.add(progress.challengeWins, 1), progress.challengeWins);
        e.allow(updated, address(this));
        e.allow(updated, player);
        progress.challengeWins = updated;
        emit ChallengeResultSettled(player, actionId);
    }

    function recordConfidentialTraining(address player, bytes32 actionId) external {
        if (!authorizedTrainer[msg.sender]) revert UnauthorizedTrainer();
        _consume(player, actionId);
        ConfidentialProgress storage progress = _initialize(player);
        euint256 updated = e.add(progress.trainingCount, 1);
        e.allow(updated, address(this));
        e.allow(updated, player);
        progress.trainingCount = updated;
        emit TrainingRecorded(player, actionId);
    }

    function advanceRank(address player, Rank newRank, bytes32 actionId) external {
        if (!authorizedRankUpdater[msg.sender]) revert UnauthorizedRankUpdater();
        _consume(player, actionId);
        ConfidentialProgress storage progress = _initialize(player);
        Rank current = progress.rank;
        if (uint8(newRank) != uint8(current) + 1) revert InvalidRankTransition(current, newRank);
        progress.rank = newRank;
        emit RankAdvanced(player, current, newRank, actionId);
    }

    function rankOf(address player) external view returns (Rank) { return _progress[player].rank; }

    /// @notice Owner-scoped handles; plaintext counters are never returned.
    function getMyConfidentialProgress() external returns (euint256 challengeWins, euint256 trainingCount) {
        ConfidentialProgress storage progress = _initialize(msg.sender);
        return (progress.challengeWins, progress.trainingCount);
    }

    /// @notice Produces encrypted promotion eligibility without revealing either counter.
    function getPromotionEligibility(address player) external returns (ebool eligible) {
        if (!authorizedRankUpdater[msg.sender]) revert UnauthorizedRankUpdater();
        ConfidentialProgress storage progress = _initialize(player);
        if (progress.rank == Rank.Academy) {
            eligible = e.and(e.ge(progress.trainingCount, 2), e.ge(progress.challengeWins, 3));
        } else if (progress.rank == Rank.Chunin) {
            eligible = e.and(e.ge(progress.trainingCount, 4), e.ge(progress.challengeWins, 6));
        } else {
            eligible = e.asEbool(false);
        }
        e.allow(eligible, address(this));
        e.allow(eligible, msg.sender);
        e.allow(eligible, player);
    }

    function _initialize(address player) internal returns (ConfidentialProgress storage progress) {
        _validateAddress(player);
        progress = _progress[player];
        if (!progress.initialized) {
            progress.challengeWins = e.asEuint256(0);
            progress.trainingCount = e.asEuint256(0);
            progress.initialized = true;
            e.allow(progress.challengeWins, address(this)); e.allow(progress.challengeWins, player);
            e.allow(progress.trainingCount, address(this)); e.allow(progress.trainingCount, player);
        }
    }

    function _consume(address player, bytes32 actionId) internal {
        _validateAddress(player);
        if (actionId == bytes32(0)) revert InvalidActionId();
        if (consumedAction[actionId]) revert ActionAlreadyConsumed(actionId);
        consumedAction[actionId] = true;
    }

    function _validateAddress(address account) internal pure { if (account == address(0)) revert InvalidAddress(); }
}

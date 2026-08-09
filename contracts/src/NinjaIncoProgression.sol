// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice V2 public progression ledger. Only explicitly authorized game contracts may record progress.
contract NinjaIncoProgression is Ownable2Step {
    enum Rank { Academy, Chunin, Jonin }

    struct Progress {
        Rank rank;
        uint64 trainingCount;
        uint64 challengeWins;
    }

    mapping(address => Progress) private _progress;
    mapping(address => bool) public authorizedUpdater;
    mapping(bytes32 => bool) public consumedAction;

    event UpdaterAuthorizationChanged(address indexed updater, bool authorized);
    event TrainingRecorded(address indexed player, uint64 trainingCount, bytes32 indexed actionId);
    event ChallengeWinRecorded(address indexed player, uint64 challengeWins, bytes32 indexed actionId);
    event RankAdvanced(address indexed player, Rank previousRank, Rank newRank, bytes32 indexed actionId);

    error UnauthorizedUpdater();
    error InvalidPlayer();
    error InvalidUpdater();
    error InvalidActionId();
    error ActionAlreadyConsumed(bytes32 actionId);
    error InvalidRankTransition(Rank currentRank, Rank requestedRank);

    constructor() Ownable(msg.sender) {}

    modifier onlyUpdater() {
        if (!authorizedUpdater[msg.sender]) revert UnauthorizedUpdater();
        _;
    }

    function setAuthorizedUpdater(address updater, bool authorized) external onlyOwner {
        if (updater == address(0)) revert InvalidUpdater();
        authorizedUpdater[updater] = authorized;
        emit UpdaterAuthorizationChanged(updater, authorized);
    }

    function recordTraining(address player, bytes32 actionId) external onlyUpdater {
        _consume(player, actionId);
        Progress storage progress = _progress[player];
        progress.trainingCount += 1;
        emit TrainingRecorded(player, progress.trainingCount, actionId);
    }

    function recordChallengeWin(address player, bytes32 actionId) external onlyUpdater {
        _consume(player, actionId);
        Progress storage progress = _progress[player];
        progress.challengeWins += 1;
        emit ChallengeWinRecorded(player, progress.challengeWins, actionId);
    }

    function advanceRank(address player, Rank newRank, bytes32 actionId) external onlyUpdater {
        _consume(player, actionId);
        Progress storage progress = _progress[player];
        Rank currentRank = progress.rank;
        if (uint8(newRank) != uint8(currentRank) + 1) revert InvalidRankTransition(currentRank, newRank);
        progress.rank = newRank;
        emit RankAdvanced(player, currentRank, newRank, actionId);
    }

    function getProgress(address player) external view returns (Progress memory) {
        return _progress[player];
    }

    function rankOf(address player) external view returns (Rank) {
        return _progress[player].rank;
    }

    function isRankUnlocked(address player, Rank requiredRank) external view returns (bool) {
        return uint8(_progress[player].rank) >= uint8(requiredRank);
    }

    function _consume(address player, bytes32 actionId) internal {
        if (player == address(0)) revert InvalidPlayer();
        if (actionId == bytes32(0)) revert InvalidActionId();
        if (consumedAction[actionId]) revert ActionAlreadyConsumed(actionId);
        consumedAction[actionId] = true;
    }
}

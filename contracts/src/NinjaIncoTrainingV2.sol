// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {NinjaIncoProgressionV2} from "./NinjaIncoProgressionV2.sol";

/// @notice Minimal player-facing V2 training entry point.
/// @dev ProgressionV2 remains authoritative for authorization, replay protection, and confidential counters.
contract NinjaIncoTrainingV2 {
    NinjaIncoProgressionV2 public immutable progression;

    event TrainingCompleted(address indexed player, bytes32 indexed actionId, NinjaIncoProgressionV2.Rank rank);

    error ZeroAddress();

    constructor(address progressionAddress) {
        if (progressionAddress == address(0)) revert ZeroAddress();
        progression = NinjaIncoProgressionV2(progressionAddress);
    }

    /// @notice Records one training action for the caller.
    /// @param actionId A unique, nonzero identifier chosen for this training action.
    function train(bytes32 actionId) external {
        NinjaIncoProgressionV2.Rank rank = progression.rankOf(msg.sender);
        progression.recordConfidentialTraining(msg.sender, actionId);
        emit TrainingCompleted(msg.sender, actionId, rank);
    }
}

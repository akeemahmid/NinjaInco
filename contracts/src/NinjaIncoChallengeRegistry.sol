// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {NinjaIncoTechniqueRegistry} from "./NinjaIncoTechniqueRegistry.sol";

/// @notice Public V2 challenge and opponent-pool metadata.
/// @dev Confidential technique selection and combat resolution belong to NinjaIncoDuelV2.
contract NinjaIncoChallengeRegistry is Ownable2Step {
    enum Rank { Academy, Chunin, Jonin }

    struct TechniquePool {
        uint256 id;
        string name;
        uint256[] techniqueIds;
        bool enabled;
    }

    struct Challenge {
        uint256 id;
        string name;
        Rank requiredRank;
        Rank opponentTier;
        uint256 techniquePoolId;
        uint8 difficulty;
        bool enabled;
    }

    NinjaIncoTechniqueRegistry public immutable techniqueRegistry;
    mapping(uint256 => TechniquePool) private _pools;
    mapping(uint256 => bool) private _poolExists;
    mapping(uint256 => Challenge) private _challenges;
    mapping(uint256 => bool) private _challengeExists;

    event TechniquePoolCreated(uint256 indexed poolId, string name);
    event TechniquePoolUpdated(uint256 indexed poolId, string name);
    event TechniquePoolStatusChanged(uint256 indexed poolId, bool enabled);
    event ChallengeCreated(uint256 indexed challengeId, string name);
    event ChallengeUpdated(uint256 indexed challengeId, string name);
    event ChallengeStatusChanged(uint256 indexed challengeId, bool enabled);

    error PoolAlreadyExists(uint256 poolId);
    error PoolNotFound(uint256 poolId);
    error ChallengeAlreadyExists(uint256 challengeId);
    error ChallengeNotFound(uint256 challengeId);
    error EmptyName();
    error InvalidRank(uint8 rank);
    error InvalidDifficulty();
    error EmptyTechniquePool(uint256 poolId);
    error TechniqueNotFound(uint256 techniqueId);
    error TechniqueRankIncompatible(uint256 techniqueId, uint8 requiredRank, uint8 poolRank);
    error PoolRankIncompatible(uint8 challengeRank, uint8 poolRank);
    error ChallengePoolNotFound(uint256 poolId);

    constructor(address techniqueRegistryAddress) Ownable(msg.sender) {
        techniqueRegistry = NinjaIncoTechniqueRegistry(techniqueRegistryAddress);
        _createPool(0, "Academy", _academyIds());
        _createPool(1, "Chunin", _chuninIds());
        _createPool(2, "Jonin", _joninIds());
        _createChallenge(0, "Academy Sensei", Rank.Academy, Rank.Academy, 0, 1);
        _createChallenge(1, "Chunin Examiner", Rank.Chunin, Rank.Chunin, 1, 2);
        _createChallenge(2, "Jonin Guardian", Rank.Jonin, Rank.Jonin, 2, 3);
    }

    function addTechniquePool(uint256 poolId, string calldata name, uint256[] calldata techniqueIds) external onlyOwner {
        _createPool(poolId, name, techniqueIds);
    }

    function updateTechniquePool(uint256 poolId, string calldata name, uint256[] calldata techniqueIds) external onlyOwner {
        if (!_poolExists[poolId]) revert PoolNotFound(poolId);
        _validatePool(poolId, name, techniqueIds);
        TechniquePool storage pool = _pools[poolId];
        pool.name = name;
        delete pool.techniqueIds;
        for (uint256 i; i < techniqueIds.length; ++i) pool.techniqueIds.push(techniqueIds[i]);
        emit TechniquePoolUpdated(poolId, name);
    }

    function setTechniquePoolEnabled(uint256 poolId, bool enabled) external onlyOwner {
        if (!_poolExists[poolId]) revert PoolNotFound(poolId);
        _pools[poolId].enabled = enabled;
        emit TechniquePoolStatusChanged(poolId, enabled);
    }

    function addChallenge(uint256 challengeId, string calldata name, Rank requiredRank, Rank opponentTier, uint256 techniquePoolId, uint8 difficulty) external onlyOwner {
        _createChallenge(challengeId, name, requiredRank, opponentTier, techniquePoolId, difficulty);
    }

    function updateChallenge(uint256 challengeId, string calldata name, Rank requiredRank, Rank opponentTier, uint256 techniquePoolId, uint8 difficulty) external onlyOwner {
        if (!_challengeExists[challengeId]) revert ChallengeNotFound(challengeId);
        _validateChallenge(name, requiredRank, opponentTier, techniquePoolId, difficulty);
        _challenges[challengeId] = Challenge(challengeId, name, requiredRank, opponentTier, techniquePoolId, difficulty, _challenges[challengeId].enabled);
        emit ChallengeUpdated(challengeId, name);
    }

    function setChallengeEnabled(uint256 challengeId, bool enabled) external onlyOwner {
        if (!_challengeExists[challengeId]) revert ChallengeNotFound(challengeId);
        _challenges[challengeId].enabled = enabled;
        emit ChallengeStatusChanged(challengeId, enabled);
    }

    function getChallenge(uint256 challengeId) external view returns (Challenge memory) {
        if (!_challengeExists[challengeId]) revert ChallengeNotFound(challengeId);
        return _challenges[challengeId];
    }

    function getTechniquePool(uint256 poolId) external view returns (TechniquePool memory) {
        if (!_poolExists[poolId]) revert PoolNotFound(poolId);
        return _pools[poolId];
    }

    function getTechniquePoolIds(uint256 poolId) external view returns (uint256[] memory) {
        if (!_poolExists[poolId]) revert PoolNotFound(poolId);
        return _pools[poolId].techniqueIds;
    }

    function isChallengeEnabled(uint256 challengeId) external view returns (bool) {
        return _challengeExists[challengeId] && _challenges[challengeId].enabled;
    }

    function isTechniquePoolEnabled(uint256 poolId) external view returns (bool) {
        return _poolExists[poolId] && _pools[poolId].enabled;
    }

    function canEnterChallenge(uint256 challengeId, Rank playerRank) external view returns (bool) {
        if (!_challengeExists[challengeId]) return false;
        Challenge storage challenge = _challenges[challengeId];
        return challenge.enabled && _pools[challenge.techniquePoolId].enabled && uint8(playerRank) >= uint8(challenge.requiredRank);
    }

    function _createPool(uint256 poolId, string memory name, uint256[] memory techniqueIds) internal {
        if (_poolExists[poolId]) revert PoolAlreadyExists(poolId);
        _validatePool(poolId, name, techniqueIds);
        _poolExists[poolId] = true;
        _pools[poolId] = TechniquePool(poolId, name, techniqueIds, true);
        emit TechniquePoolCreated(poolId, name);
    }

    function _validatePool(uint256 poolId, string memory name, uint256[] memory techniqueIds) internal view {
        if (bytes(name).length == 0) revert EmptyName();
        if (techniqueIds.length == 0) revert EmptyTechniquePool(poolId);
        if (poolId > uint256(Rank.Jonin)) revert InvalidRank(uint8(poolId));
        for (uint256 i; i < techniqueIds.length; ++i) {
            if (!techniqueRegistry.techniqueExists(uint16(techniqueIds[i]))) revert TechniqueNotFound(techniqueIds[i]);
            NinjaIncoTechniqueRegistry.Technique memory technique = techniqueRegistry.getTechnique(uint16(techniqueIds[i]));
            if (uint8(technique.requiredRank) > poolId) revert TechniqueRankIncompatible(techniqueIds[i], uint8(technique.requiredRank), uint8(poolId));
        }
    }

    function _createChallenge(uint256 challengeId, string memory name, Rank requiredRank, Rank opponentTier, uint256 techniquePoolId, uint8 difficulty) internal {
        if (_challengeExists[challengeId]) revert ChallengeAlreadyExists(challengeId);
        _validateChallenge(name, requiredRank, opponentTier, techniquePoolId, difficulty);
        _challengeExists[challengeId] = true;
        _challenges[challengeId] = Challenge(challengeId, name, requiredRank, opponentTier, techniquePoolId, difficulty, true);
        emit ChallengeCreated(challengeId, name);
    }

    function _validateChallenge(string memory name, Rank requiredRank, Rank opponentTier, uint256 techniquePoolId, uint8 difficulty) internal view {
        if (bytes(name).length == 0) revert EmptyName();
        if (uint8(requiredRank) > uint8(Rank.Jonin)) revert InvalidRank(uint8(requiredRank));
        if (uint8(opponentTier) > uint8(Rank.Jonin)) revert InvalidRank(uint8(opponentTier));
        if (difficulty == 0) revert InvalidDifficulty();
        if (!_poolExists[techniquePoolId]) revert ChallengePoolNotFound(techniquePoolId);
        if (techniquePoolId < uint256(requiredRank)) revert PoolRankIncompatible(uint8(requiredRank), uint8(techniquePoolId));
        if (uint8(opponentTier) < uint8(requiredRank)) revert PoolRankIncompatible(uint8(requiredRank), uint8(opponentTier));
    }

    function _academyIds() private pure returns (uint256[] memory ids) { ids = new uint256[](3); ids[0] = 0; ids[1] = 1; ids[2] = 2; }
    function _chuninIds() private pure returns (uint256[] memory ids) { ids = new uint256[](7); for (uint256 i; i < 7; ++i) ids[i] = i; }
    function _joninIds() private pure returns (uint256[] memory ids) { ids = new uint256[](11); for (uint256 i; i < 11; ++i) ids[i] = i; }
}

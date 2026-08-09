// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {e, ebool, euint256} from "@inco/lightning/src/Lib.sol";

/// @notice Public metadata for V2 techniques. A player's selected technique remains encrypted in combat.
contract NinjaIncoTechniqueRegistry is Ownable2Step {
    enum Rank { Academy, Chunin, Jonin }
    enum Category { Attack, Defense, Control, Mobility, Special, Ultimate }
    enum OutcomeRule { Draw, TechniqueAWin, TechniqueBWin }

    struct Technique {
        uint16 id;
        string name;
        Rank requiredRank;
        Category category;
        bool enabled;
    }

    mapping(uint16 => Technique) private _techniques;
    mapping(uint16 => bool) private _exists;
    mapping(uint16 => mapping(uint16 => OutcomeRule)) private _combatRules;
    mapping(uint16 => mapping(uint16 => bool)) private _combatRuleDefined;

    event TechniqueAdded(uint16 indexed id, string name, Rank requiredRank, Category category);
    event TechniqueStatusChanged(uint16 indexed id, bool enabled);
    event CombatRuleSet(uint16 indexed techniqueA, uint16 indexed techniqueB, OutcomeRule rule);

    error TechniqueAlreadyExists(uint16 id);
    error TechniqueNotFound(uint16 id);
    error EmptyTechniqueName();
    error CombatRuleAlreadyDefined(uint16 techniqueA, uint16 techniqueB);
    error CombatRuleNotDefined(uint16 techniqueA, uint16 techniqueB);

    constructor() Ownable(msg.sender) {
        _add(0, "Shadow Blade", Rank.Academy, Category.Attack);
        _add(1, "Spirit Guard", Rank.Academy, Category.Defense);
        _add(2, "Phantom Step", Rank.Academy, Category.Mobility);
        _add(3, "Flame Release", Rank.Chunin, Category.Attack);
        _add(4, "Lightning Surge", Rank.Chunin, Category.Attack);
        _add(5, "Earth Wall", Rank.Chunin, Category.Defense);
        _add(6, "Water Prison", Rank.Chunin, Category.Control);
        _add(7, "Shadow Clone", Rank.Jonin, Category.Special);
        _add(8, "Chakra Burst", Rank.Jonin, Category.Attack);
        _add(9, "Sealing Art", Rank.Jonin, Category.Control);
        _add(10, "Ultimate Defense", Rank.Jonin, Category.Ultimate);
        _initializeCombatRules();
    }

    function addTechnique(uint16 id, string calldata name, Rank requiredRank, Category category) external onlyOwner {
        _add(id, name, requiredRank, category);
    }

    function setTechniqueEnabled(uint16 id, bool enabled) external onlyOwner {
        if (!_exists[id]) revert TechniqueNotFound(id);
        _techniques[id].enabled = enabled;
        emit TechniqueStatusChanged(id, enabled);
    }

    function getTechnique(uint16 id) external view returns (Technique memory) {
        if (!_exists[id]) revert TechniqueNotFound(id);
        return _techniques[id];
    }

    function techniqueExists(uint16 id) external view returns (bool) {
        return _exists[id];
    }

    function isTechniqueAvailable(uint16 id, Rank playerRank) external view returns (bool) {
        return _exists[id] && _techniques[id].enabled && uint8(playerRank) >= uint8(_techniques[id].requiredRank);
    }

    function setCombatRule(uint16 techniqueA, uint16 techniqueB, OutcomeRule rule) external onlyOwner {
        _validateTechniquePair(techniqueA, techniqueB);
        _combatRules[techniqueA][techniqueB] = rule;
        _combatRules[techniqueB][techniqueA] = rule == OutcomeRule.TechniqueAWin
            ? OutcomeRule.TechniqueBWin
            : rule == OutcomeRule.TechniqueBWin ? OutcomeRule.TechniqueAWin : OutcomeRule.Draw;
        _combatRuleDefined[techniqueA][techniqueB] = true;
        _combatRuleDefined[techniqueB][techniqueA] = true;
        emit CombatRuleSet(techniqueA, techniqueB, rule);
    }

    function getCombatRule(uint16 techniqueA, uint16 techniqueB) external view returns (OutcomeRule) {
        _validateTechniquePair(techniqueA, techniqueB);
        if (!_combatRuleDefined[techniqueA][techniqueB]) revert CombatRuleNotDefined(techniqueA, techniqueB);
        return techniqueA == techniqueB ? OutcomeRule.Draw : _combatRules[techniqueA][techniqueB];
    }

    function resolvePublicRule(uint16 techniqueA, uint16 techniqueB) external view returns (OutcomeRule) {
        return this.getCombatRule(techniqueA, techniqueB);
    }

    /// @notice Resolves two encrypted technique IDs against this registry's authoritative rule matrix.
    function resolveConfidentialRule(euint256 techniqueA, euint256 techniqueB, uint16[] calldata allowedTechniqueIds)
        external payable returns (euint256 outcome, ebool validA, ebool validB)
    {
        validA = e.asEbool(false); validB = e.asEbool(false);
        outcome = e.asEuint256(uint256(OutcomeRule.Draw));
        for (uint256 i; i < allowedTechniqueIds.length; ++i) {
            uint16 a = allowedTechniqueIds[i];
            if (!_exists[a] || !_techniques[a].enabled) continue;
            ebool isA = e.eq(techniqueA, uint256(a));
            ebool isB = e.eq(techniqueB, uint256(a));
            validA = e.or(validA, isA); validB = e.or(validB, isB);
            for (uint256 j; j < allowedTechniqueIds.length; ++j) {
                uint16 b = allowedTechniqueIds[j];
                if (!_exists[b] || !_techniques[b].enabled || !_combatRuleDefined[a][b]) continue;
                ebool pair = e.and(isA, e.eq(techniqueB, uint256(b)));
                outcome = e.select(pair, e.asEuint256(uint256(_combatRules[a][b])), outcome);
            }
        }
        e.allow(outcome, msg.sender); e.allow(validA, msg.sender); e.allow(validB, msg.sender);
    }

    function _add(uint16 id, string memory name, Rank requiredRank, Category category) internal {
        if (_exists[id]) revert TechniqueAlreadyExists(id);
        if (bytes(name).length == 0) revert EmptyTechniqueName();
        _exists[id] = true;
        _techniques[id] = Technique(id, name, requiredRank, category, true);
        emit TechniqueAdded(id, name, requiredRank, category);
    }

    function _validateTechniquePair(uint16 techniqueA, uint16 techniqueB) internal view {
        if (!_exists[techniqueA]) revert TechniqueNotFound(techniqueA);
        if (!_exists[techniqueB]) revert TechniqueNotFound(techniqueB);
        if (!_techniques[techniqueA].enabled) revert TechniqueNotFound(techniqueA);
        if (!_techniques[techniqueB].enabled) revert TechniqueNotFound(techniqueB);
    }

    function _initializeCombatRules() internal {
        for (uint16 a; a < 11; ++a) {
            for (uint16 b; b < 11; ++b) {
                _combatRules[a][b] = OutcomeRule.Draw;
                _combatRuleDefined[a][b] = true;
            }
        }

        // Academy cycle: Spirit Guard beats Shadow Blade, Shadow Blade beats Phantom Step,
        // and Phantom Step beats Spirit Guard.
        _setInitialPair(0, 1, OutcomeRule.TechniqueBWin);
        _setInitialPair(0, 2, OutcomeRule.TechniqueAWin);
        _setInitialPair(1, 2, OutcomeRule.TechniqueBWin);

        // Explicit advanced matchups. All pairs not listed remain intentional neutral draws.
        _setInitialPair(3, 0, OutcomeRule.TechniqueAWin);
        _setInitialPair(3, 1, OutcomeRule.TechniqueBWin);
        _setInitialPair(3, 2, OutcomeRule.TechniqueAWin);
        _setInitialPair(4, 0, OutcomeRule.TechniqueAWin);
        _setInitialPair(4, 1, OutcomeRule.TechniqueAWin);
        _setInitialPair(4, 2, OutcomeRule.TechniqueBWin);
        _setInitialPair(5, 0, OutcomeRule.TechniqueBWin);
        _setInitialPair(5, 1, OutcomeRule.TechniqueAWin);
        _setInitialPair(5, 2, OutcomeRule.TechniqueBWin);
        _setInitialPair(6, 0, OutcomeRule.TechniqueBWin);
        _setInitialPair(6, 1, OutcomeRule.TechniqueAWin);
        _setInitialPair(6, 2, OutcomeRule.TechniqueAWin);
        _setInitialPair(7, 3, OutcomeRule.TechniqueBWin);
        _setInitialPair(7, 4, OutcomeRule.TechniqueAWin);
        _setInitialPair(7, 5, OutcomeRule.TechniqueAWin);
        _setInitialPair(7, 6, OutcomeRule.TechniqueBWin);
        _setInitialPair(8, 3, OutcomeRule.TechniqueAWin);
        _setInitialPair(8, 4, OutcomeRule.TechniqueBWin);
        _setInitialPair(8, 5, OutcomeRule.TechniqueAWin);
        _setInitialPair(8, 6, OutcomeRule.TechniqueBWin);
        _setInitialPair(9, 3, OutcomeRule.TechniqueBWin);
        _setInitialPair(9, 4, OutcomeRule.TechniqueAWin);
        _setInitialPair(9, 5, OutcomeRule.TechniqueBWin);
        _setInitialPair(9, 6, OutcomeRule.TechniqueAWin);
        _setInitialPair(10, 3, OutcomeRule.TechniqueBWin);
        _setInitialPair(10, 4, OutcomeRule.TechniqueBWin);
        _setInitialPair(10, 5, OutcomeRule.TechniqueAWin);
        _setInitialPair(10, 6, OutcomeRule.TechniqueAWin);
        _setInitialPair(7, 8, OutcomeRule.TechniqueBWin);
        _setInitialPair(7, 9, OutcomeRule.TechniqueAWin);
        _setInitialPair(7, 10, OutcomeRule.TechniqueBWin);
        _setInitialPair(8, 9, OutcomeRule.TechniqueAWin);
        _setInitialPair(8, 10, OutcomeRule.TechniqueBWin);
        _setInitialPair(9, 10, OutcomeRule.TechniqueAWin);
    }

    function _setInitialPair(uint16 techniqueA, uint16 techniqueB, OutcomeRule rule) internal {
        _combatRules[techniqueA][techniqueB] = rule;
        _combatRules[techniqueB][techniqueA] = rule == OutcomeRule.TechniqueAWin
            ? OutcomeRule.TechniqueBWin
            : rule == OutcomeRule.TechniqueBWin ? OutcomeRule.TechniqueAWin : OutcomeRule.Draw;
    }
}

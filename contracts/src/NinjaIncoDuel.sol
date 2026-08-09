// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {e, ebool, euint256, inco} from "@inco/lightning/src/Lib.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

interface IDuelPlayerRegistry {
    function isRegistered(address wallet) external view returns (bool);
}

contract NinjaIncoDuel is Ownable2Step {
    enum Outcome { Draw, PlayerWin, SenseiWin }

    struct Duel {
        euint256 playerTechnique;
        euint256 senseiTechnique;
        euint256 outcome;
        bool exists;
    }

    IDuelPlayerRegistry public immutable playerRegistry;
    address public promotionContract;
    uint256 public nextDuelId;
    mapping(address => uint256) public lastDuelId;
    mapping(uint256 => mapping(address => Duel)) private _duels;
    mapping(address => euint256) private _experience;

    event DuelCompleted(address indexed player, uint256 indexed duelId);

    error PlayerNotRegistered();
    error InvalidTechnique();
    error InsufficientFees();
    error DuelNotFound();
    error UnauthorizedPromotionContract();

    constructor(address registryAddress) Ownable(msg.sender) {
        playerRegistry = IDuelPlayerRegistry(registryAddress);
    }

    function setPromotionContract(address promotionAddress) external onlyOwner {
        promotionContract = promotionAddress;
    }

    function duel(bytes calldata encryptedTechnique) external payable returns (uint256 duelId) {
        if (!playerRegistry.isRegistered(msg.sender)) revert PlayerNotRegistered();
        uint256 fee = inco.getFee();
        if (msg.value < fee * 2) revert InsufficientFees();

        euint256 playerTechnique = e.newEuint256(encryptedTechnique, msg.sender);
        e.allow(playerTechnique, address(this));

        euint256 senseiTechnique = _selectSenseiTechnique();
        e.allow(senseiTechnique, address(this));
        e.allow(senseiTechnique, msg.sender);

        // Invalid encrypted inputs resolve to a Sensei win without revealing validity.
        ebool validTechnique = e.or(
            e.eq(playerTechnique, 0),
            e.or(e.eq(playerTechnique, 1), e.eq(playerTechnique, 2))
        );
        ebool draw = e.and(validTechnique, e.eq(playerTechnique, senseiTechnique));
        ebool playerWin = e.and(
            validTechnique,
            e.or(
                e.and(e.eq(playerTechnique, 0), e.eq(senseiTechnique, 2)),
                e.or(
                    e.and(e.eq(playerTechnique, 1), e.eq(senseiTechnique, 0)),
                    e.and(e.eq(playerTechnique, 2), e.eq(senseiTechnique, 1))
                )
            )
        );

        euint256 outcome = e.select(
            draw,
            e.asEuint256(uint256(Outcome.Draw)),
            e.select(
                playerWin,
                e.asEuint256(uint256(Outcome.PlayerWin)),
                e.asEuint256(uint256(Outcome.SenseiWin))
            )
        );
        e.allow(outcome, address(this));
        e.allow(outcome, msg.sender);

        euint256 currentExperience = _experience[msg.sender];
        euint256 awardedExperience = e.select(
            playerWin,
            e.add(currentExperience, e.asEuint256(1)),
            currentExperience
        );
        e.allow(awardedExperience, address(this));
        e.allow(awardedExperience, msg.sender);
        _experience[msg.sender] = awardedExperience;

        duelId = nextDuelId++;
        lastDuelId[msg.sender] = duelId;
        _duels[duelId][msg.sender] = Duel({
            playerTechnique: playerTechnique,
            senseiTechnique: senseiTechnique,
            outcome: outcome,
            exists: true
        });
        emit DuelCompleted(msg.sender, duelId);
    }

    function getMyDuel(uint256 duelId) external view returns (euint256, euint256, euint256) {
        Duel storage currentDuel = _duels[duelId][msg.sender];
        if (!currentDuel.exists) revert DuelNotFound();
        return (currentDuel.playerTechnique, currentDuel.senseiTechnique, currentDuel.outcome);
    }

    function getMyExperience() external view returns (euint256) {
        return _experience[msg.sender];
    }

    function getExperienceForPromotion(address player) external returns (euint256 experience) {
        if (msg.sender != promotionContract) revert UnauthorizedPromotionContract();
        experience = _experience[player];
        if (euint256.unwrap(experience) == bytes32(0)) {
            experience = e.asEuint256(0);
            _experience[player] = experience;
            e.allow(experience, address(this));
        }
        e.allow(experience, msg.sender);
    }

    function _selectSenseiTechnique() internal virtual returns (euint256) {
        return e.randBounded(3);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {e, euint256, inco} from "@inco/lightning/src/Lib.sol";

contract NinjaIncoGame {
    enum Village {
        Ember,
        Mist,
        Storm,
        Stone
    }

    struct Player {
        address wallet;
        string displayName;
        Village village;
        euint256 encryptedTechnique;
        uint256 createdAt;
    }

    mapping(address => Player) private _players;

    event PlayerRegistered(
        address indexed wallet,
        string displayName,
        Village village,
        uint256 createdAt
    );

    error AlreadyRegistered();
    error NotRegistered();
    error EmptyDisplayName();
    error InvalidVillage();
    error InsufficientFees();

    function registerPlayer(
        string calldata displayName,
        uint8 village,
        bytes calldata encryptedTechnique
    ) external payable {
        if (_players[msg.sender].wallet != address(0)) revert AlreadyRegistered();
        if (bytes(displayName).length == 0) revert EmptyDisplayName();
        if (village > uint8(Village.Stone)) revert InvalidVillage();
        if (msg.value < inco.getFee()) revert InsufficientFees();

        euint256 technique = e.newEuint256(encryptedTechnique, msg.sender);
        e.allow(technique, address(this));
        e.allow(technique, msg.sender);

        _players[msg.sender] = Player({
            wallet: msg.sender,
            displayName: displayName,
            village: Village(village),
            encryptedTechnique: technique,
            createdAt: block.timestamp
        });

        emit PlayerRegistered(
            msg.sender,
            displayName,
            Village(village),
            block.timestamp
        );
    }

    function getPublicProfile(
        address wallet
    ) external view returns (
        address playerWallet,
        string memory displayName,
        Village village,
        uint256 createdAt
    ) {
        Player storage player = _players[wallet];
        if (player.wallet == address(0)) revert NotRegistered();

        return (
            player.wallet,
            player.displayName,
            player.village,
            player.createdAt
        );
    }

    function getEncryptedTechnique() external view returns (euint256) {
        Player storage player = _players[msg.sender];
        if (player.wallet == address(0)) revert NotRegistered();
        return player.encryptedTechnique;
    }

    function isRegistered(address wallet) external view returns (bool) {
        return _players[wallet].wallet != address(0);
    }
}

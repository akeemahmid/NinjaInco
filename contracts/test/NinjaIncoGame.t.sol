// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {NinjaIncoGame} from "../src/NinjaIncoGame.sol";
import {IncoTest} from "@inco/lightning/src/test/IncoTest.sol";
import {inco, euint256} from "@inco/lightning/src/Lib.sol";

contract TestNinjaIncoGame is IncoTest {
    NinjaIncoGame game;

    function setUp() public override {
        super.setUp();
        game = new NinjaIncoGame();
    }

    function testSuccessfulRegistration() public {
        _register(alice, "Kage", NinjaIncoGame.Village.Ember, 0);

        assertTrue(game.isRegistered(alice));
    }

    function testDuplicateRegistrationReverts() public {
        _register(alice, "Kage", NinjaIncoGame.Village.Ember, 0);

        bytes memory encryptedTechnique = fakePrepareEuint256Ciphertext(
            1,
            alice,
            address(game)
        );

        uint256 fee = inco.getFee();
        vm.prank(alice);
        vm.expectRevert(NinjaIncoGame.AlreadyRegistered.selector);
        game.registerPlayer{value: fee}(
            "Second Kage",
            uint8(NinjaIncoGame.Village.Mist),
            encryptedTechnique
        );
    }

    function testPublicProfileRetrieval() public {
        uint256 createdAt = block.timestamp;
        _register(alice, "Stormborn", NinjaIncoGame.Village.Storm, 2);

        (
            address wallet,
            string memory displayName,
            NinjaIncoGame.Village village,
            uint256 profileCreatedAt
        ) = game.getPublicProfile(alice);

        assertEq(wallet, alice);
        assertEq(displayName, "Stormborn");
        assertEq(uint256(village), uint256(NinjaIncoGame.Village.Storm));
        assertEq(profileCreatedAt, createdAt);
    }

    function testConfidentialTechniqueStorage() public {
        _register(alice, "Mist Walker", NinjaIncoGame.Village.Mist, 1);

        vm.prank(alice);
        euint256 technique = game.getEncryptedTechnique();

        uint256 decryptedTechnique = getUint256Value(technique);
        assertEq(decryptedTechnique, 1, "Technique should remain stored as an encrypted handle");
    }

    function _register(
        address player,
        string memory displayName,
        NinjaIncoGame.Village village,
        uint256 technique
    ) internal {
        bytes memory encryptedTechnique = fakePrepareEuint256Ciphertext(
            technique,
            player,
            address(game)
        );

        vm.deal(player, 1 ether);
        uint256 fee = inco.getFee();
        vm.prank(player);
        game.registerPlayer{value: fee}(
            displayName,
            uint8(village),
            encryptedTechnique
        );
        processAllOperations();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {NinjaIncoGame} from "../src/NinjaIncoGame.sol";
import {NinjaIncoAttributes} from "../src/NinjaIncoAttributes.sol";
import {IncoTest} from "@inco/lightning/src/test/IncoTest.sol";
import {inco, euint256} from "@inco/lightning/src/Lib.sol";

contract TestNinjaIncoAttributes is IncoTest {
    NinjaIncoGame game;
    NinjaIncoAttributes attributes;

    function setUp() public override {
        super.setUp();
        game = new NinjaIncoGame();
        attributes = new NinjaIncoAttributes(address(game));
    }

    function testRegisteredPlayerInitializesConfidentialAttributes() public {
        _registerPlayer(alice);
        _initializeAttributes(alice);

        assertTrue(attributes.hasAttributes(alice));
    }

    function testUnregisteredPlayerCannotInitializeAttributes() public {
        bytes[] memory encryptedValues = _encryptedAttributes(alice);
        uint256 fee = inco.getFee() * 6;
        vm.deal(alice, fee);

        vm.prank(alice);
        vm.expectRevert(NinjaIncoAttributes.PlayerNotRegistered.selector);
        attributes.initializeAttributes{value: fee}(encryptedValues);
    }

    function testAttributesCannotBeInitializedTwice() public {
        _registerPlayer(alice);
        _initializeAttributes(alice);

        bytes[] memory encryptedValues = _encryptedAttributes(alice);
        uint256 fee = inco.getFee() * 6;
        vm.prank(alice);
        vm.expectRevert(NinjaIncoAttributes.AttributesAlreadyInitialized.selector);
        attributes.initializeAttributes{value: fee}(encryptedValues);
    }

    function testWalletOwnerCanReadAndDecryptAttributes() public {
        _registerPlayer(alice);
        _initializeAttributes(alice);

        vm.prank(alice);
        (
            euint256 power,
            euint256 speed,
            euint256 focus,
            euint256 luck,
            euint256 chakra,
            euint256 startingStyle
        ) = attributes.getMyAttributes();

        assertEq(getUint256Value(power), 72);
        assertEq(getUint256Value(speed), 61);
        assertEq(getUint256Value(focus), 84);
        assertEq(getUint256Value(luck), 43);
        assertEq(getUint256Value(chakra), 77);
        assertEq(getUint256Value(startingStyle), 1);
    }

    function testOtherWalletCannotUseOwnerScopedGetter() public {
        _registerPlayer(alice);
        _initializeAttributes(alice);

        vm.prank(bob);
        vm.expectRevert(NinjaIncoAttributes.AttributesNotInitialized.selector);
        attributes.getMyAttributes();
    }

    function testTrainingIncreasesOnlyWeakestAttribute() public {
        _registerPlayer(alice);
        _initializeAttributes(alice);

        vm.prank(alice);
        attributes.train();
        processAllOperations();

        vm.prank(alice);
        (
            euint256 power,
            euint256 speed,
            euint256 focus,
            euint256 luck,
            euint256 chakra,
            euint256 startingStyle
        ) = attributes.getMyAttributes();

        assertEq(getUint256Value(power), 72);
        assertEq(getUint256Value(speed), 61);
        assertEq(getUint256Value(focus), 84);
        assertEq(getUint256Value(luck), 48, "Weakest attribute should increase by five");
        assertEq(getUint256Value(chakra), 77);
        assertEq(getUint256Value(startingStyle), 1);
    }

    function testCannotTrainBeforeAttributesAreInitialized() public {
        _registerPlayer(alice);

        vm.prank(alice);
        vm.expectRevert(NinjaIncoAttributes.AttributesNotInitialized.selector);
        attributes.train();
    }

    function _registerPlayer(address player) internal {
        bytes memory encryptedTechnique = fakePrepareEuint256Ciphertext(
            0,
            player,
            address(game)
        );
        uint256 fee = inco.getFee();
        vm.deal(player, 1 ether);

        vm.prank(player);
        game.registerPlayer{value: fee}(
            "Attribute Ninja",
            uint8(NinjaIncoGame.Village.Ember),
            encryptedTechnique
        );
        processAllOperations();
    }

    function _initializeAttributes(address player) internal {
        bytes[] memory encryptedValues = _encryptedAttributes(player);
        uint256 fee = inco.getFee() * 6;

        vm.prank(player);
        attributes.initializeAttributes{value: fee}(encryptedValues);
        processAllOperations();
    }

    function _encryptedAttributes(address player) internal view returns (bytes[] memory values) {
        values = new bytes[](6);
        values[0] = fakePrepareEuint256Ciphertext(72, player, address(attributes));
        values[1] = fakePrepareEuint256Ciphertext(61, player, address(attributes));
        values[2] = fakePrepareEuint256Ciphertext(84, player, address(attributes));
        values[3] = fakePrepareEuint256Ciphertext(43, player, address(attributes));
        values[4] = fakePrepareEuint256Ciphertext(77, player, address(attributes));
        values[5] = fakePrepareEuint256Ciphertext(1, player, address(attributes));
    }
}

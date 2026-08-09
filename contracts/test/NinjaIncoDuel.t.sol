// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {NinjaIncoGame} from "../src/NinjaIncoGame.sol";
import {NinjaIncoDuel} from "../src/NinjaIncoDuel.sol";
import {IncoTest} from "@inco/lightning/src/test/IncoTest.sol";
import {inco, e, euint256} from "@inco/lightning/src/Lib.sol";

contract FixedSenseiDuel is NinjaIncoDuel {
    uint256 private immutable fixedTechnique;

    constructor(address registryAddress, uint256 technique) NinjaIncoDuel(registryAddress) {
        fixedTechnique = technique;
    }

    function _selectSenseiTechnique() internal override returns (euint256) {
        euint256 technique = e.asEuint256(fixedTechnique);
        e.allow(technique, address(this));
        return technique;
    }
}

contract TestNinjaIncoDuel is IncoTest {
    NinjaIncoGame game;

    function testPlayerWin() public {
        FixedSenseiDuel duelContract = _newDuel(2); // Shadow Blade beats Phantom Step.
        _registerPlayer(alice);
        uint256 duelId = _play(alice, duelContract, 0);
        (, , euint256 outcome) = _getDuel(alice, duelContract, duelId);
        assertEq(getUint256Value(outcome), uint256(NinjaIncoDuel.Outcome.PlayerWin));
        vm.prank(alice);
        assertEq(getUint256Value(duelContract.getMyExperience()), 1);
    }

    function testSenseiWin() public {
        FixedSenseiDuel duelContract = _newDuel(1); // Shadow Blade loses to Spirit Guard.
        _registerPlayer(alice);
        uint256 duelId = _play(alice, duelContract, 0);
        (, , euint256 outcome) = _getDuel(alice, duelContract, duelId);
        assertEq(getUint256Value(outcome), uint256(NinjaIncoDuel.Outcome.SenseiWin));
    }

    function testDraw() public {
        FixedSenseiDuel duelContract = _newDuel(1);
        _registerPlayer(alice);
        uint256 duelId = _play(alice, duelContract, 1);
        (, , euint256 outcome) = _getDuel(alice, duelContract, duelId);
        assertEq(getUint256Value(outcome), uint256(NinjaIncoDuel.Outcome.Draw));
    }

    function testConfidentialRevealFlowIsOwnerScoped() public {
        FixedSenseiDuel duelContract = _newDuel(2);
        _registerPlayer(alice);
        uint256 duelId = _play(alice, duelContract, 0);

        vm.prank(alice);
        (euint256 playerTechnique, euint256 senseiTechnique, euint256 outcome) = duelContract.getMyDuel(duelId);
        assertEq(getUint256Value(playerTechnique), 0);
        assertEq(getUint256Value(senseiTechnique), 2);
        assertEq(getUint256Value(outcome), 1);

        vm.prank(bob);
        vm.expectRevert(NinjaIncoDuel.DuelNotFound.selector);
        duelContract.getMyDuel(duelId);
    }

    function _newDuel(uint256 senseiTechnique) internal returns (FixedSenseiDuel) {
        game = new NinjaIncoGame();
        return new FixedSenseiDuel(address(game), senseiTechnique);
    }

    function _registerPlayer(address player) internal {
        bytes memory encryptedTechnique = fakePrepareEuint256Ciphertext(0, player, address(game));
        uint256 fee = inco.getFee();
        vm.deal(player, 1 ether);
        vm.prank(player);
        game.registerPlayer{value: fee}("Duel Ninja", 0, encryptedTechnique);
        processAllOperations();
    }

    function _play(address player, FixedSenseiDuel duelContract, uint256 technique) internal returns (uint256 duelId) {
        bytes memory encryptedTechnique = fakePrepareEuint256Ciphertext(technique, player, address(duelContract));
        uint256 fee = inco.getFee();
        vm.deal(player, 1 ether);
        vm.prank(player);
        duelId = duelContract.duel{value: fee * 2}(encryptedTechnique);
        processAllOperations();
    }

    function _getDuel(address player, FixedSenseiDuel duelContract, uint256 duelId) internal returns (euint256, euint256, euint256) {
        vm.prank(player);
        return duelContract.getMyDuel(duelId);
    }
}

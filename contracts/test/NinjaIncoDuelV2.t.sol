// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {IncoTest} from "@inco/lightning/src/test/IncoTest.sol";
import {e, euint256, inco} from "@inco/lightning/src/Lib.sol";
import {NinjaIncoTechniqueRegistry} from "../src/NinjaIncoTechniqueRegistry.sol";
import {NinjaIncoChallengeRegistry} from "../src/NinjaIncoChallengeRegistry.sol";
import {NinjaIncoProgressionV2} from "../src/NinjaIncoProgressionV2.sol";
import {NinjaIncoDuelV2} from "../src/NinjaIncoDuelV2.sol";

contract FixedDuelV2 is NinjaIncoDuelV2 {
    uint256 fixedTechnique;
    constructor(address t,address c,address p,uint256 fixed_) NinjaIncoDuelV2(t,c,p) { fixedTechnique=fixed_; }
    function _selectOpponentTechnique(uint256[] memory) internal override returns (euint256 selected) { selected=e.asEuint256(fixedTechnique); }
}

contract TestNinjaIncoDuelV2 is IncoTest {
    NinjaIncoTechniqueRegistry techniques; NinjaIncoChallengeRegistry challenges; NinjaIncoProgressionV2 progression;
    function setUp() public override { super.setUp(); techniques=new NinjaIncoTechniqueRegistry(); challenges=new NinjaIncoChallengeRegistry(address(techniques)); progression=new NinjaIncoProgressionV2(); }

    function testAcademyCycleAndSettlement() public {
        FixedDuelV2 duelContract=_duel(2); uint256 id=_play(alice,duelContract,0,0); processAllOperations();
        (,euint256 player,euint256 opponent,euint256 outcome,)=_get(alice,duelContract,id);
        assertEq(getUint256Value(player),0); assertEq(getUint256Value(opponent),2); assertEq(getUint256Value(outcome),1);
        vm.prank(alice); duelContract.settleDuel(id); processAllOperations();
        (euint256 wins,)=_progress(alice); assertEq(getUint256Value(wins),1);
        vm.prank(alice); vm.expectRevert(NinjaIncoDuelV2.AlreadySettled.selector); duelContract.settleDuel(id);
    }

    function testDrawAndLossDoNotIncrement() public {
        FixedDuelV2 drawDuel=_duel(1); uint256 drawId=_play(alice,drawDuel,1,0); processAllOperations(); vm.prank(alice); drawDuel.settleDuel(drawId);
        FixedDuelV2 lossDuel=_duel(1); uint256 lossId=_play(alice,lossDuel,0,0); processAllOperations(); vm.prank(alice); lossDuel.settleDuel(lossId); processAllOperations();
        (euint256 wins,)=_progress(alice); assertEq(getUint256Value(wins),0);
    }

    function testRankChallengeAndTechniqueGating() public {
        FixedDuelV2 duelContract=_duel(0);
        uint256 fee = inco.getFee() * 512;
        vm.expectRevert(NinjaIncoDuelV2.InvalidChallenge.selector); _playWithFee(alice,duelContract,0,1,fee);
        _rank(alice,NinjaIncoProgressionV2.Rank.Chunin); _play(alice,duelContract,6,1);
        uint256 invalidId=_play(alice,duelContract,7,1); processAllOperations(); (, , ,euint256 invalidOutcome,)=_get(alice,duelContract,invalidId); assertEq(getUint256Value(invalidOutcome),2);
    }

    function testDisabledChallengeAndTechniqueRejected() public {
        FixedDuelV2 duelContract=_duel(0); challenges.setChallengeEnabled(0,false);
        uint256 fee = inco.getFee() * 512;
        vm.expectRevert(NinjaIncoDuelV2.InvalidChallenge.selector); _playWithFee(alice,duelContract,0,0,fee);
        challenges.setChallengeEnabled(0,true); techniques.setTechniqueEnabled(0,false);
        uint256 disabledId=_play(alice,duelContract,0,0); processAllOperations(); (, , ,euint256 disabledOutcome,)=_get(alice,duelContract,disabledId); assertEq(getUint256Value(disabledOutcome),2);
    }

    function testIdsOwnershipAndZeroAddresses() public {
        FixedDuelV2 duelContract=_duel(2); uint256 a=_play(alice,duelContract,0,0); uint256 b=_play(alice,duelContract,1,0);
        assertEq(a,0); assertEq(b,1); assertEq(duelContract.lastDuelId(alice),1);
        vm.prank(bob); vm.expectRevert(NinjaIncoDuelV2.DuelNotFound.selector); duelContract.getMyDuel(a);
        vm.expectRevert(NinjaIncoDuelV2.ZeroAddress.selector); new NinjaIncoDuelV2(address(0),address(challenges),address(progression));
    }

    function _duel(uint256 fixedTechnique) internal returns(FixedDuelV2 d){ d=new FixedDuelV2(address(techniques),address(challenges),address(progression),fixedTechnique); progression.setAuthorizedDuelSettler(address(d),true); }
    function _play(address player,FixedDuelV2 d,uint256 technique,uint256 challenge) internal returns(uint256){ return _playWithFee(player,d,technique,challenge,inco.getFee()*512); }
    function _playWithFee(address player,FixedDuelV2 d,uint256 technique,uint256 challenge,uint256 fee) internal returns(uint256){ bytes memory encrypted=fakePrepareEuint256Ciphertext(technique,player,address(d)); vm.deal(player,10 ether); vm.prank(player); return d.duel{value:fee}(challenge,encrypted); }
    function _get(address player,FixedDuelV2 d,uint256 id) internal returns(uint256,euint256,euint256,euint256,bool){vm.prank(player); return d.getMyDuel(id);}
    function _progress(address player) internal returns(euint256,euint256){vm.prank(player); return progression.getMyConfidentialProgress();}
    function _rank(address player,NinjaIncoProgressionV2.Rank rank) internal { progression.setAuthorizedRankUpdater(address(this),true); progression.advanceRank(player,rank,keccak256(abi.encode(player,rank))); }
}

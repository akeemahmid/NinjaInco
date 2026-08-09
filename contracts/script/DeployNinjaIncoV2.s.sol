// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {NinjaIncoTechniqueRegistry} from "../src/NinjaIncoTechniqueRegistry.sol";
import {NinjaIncoChallengeRegistry} from "../src/NinjaIncoChallengeRegistry.sol";
import {NinjaIncoProgressionV2} from "../src/NinjaIncoProgressionV2.sol";
import {NinjaIncoTrainingV2} from "../src/NinjaIncoTrainingV2.sol";
import {NinjaIncoDuelV2} from "../src/NinjaIncoDuelV2.sol";
import {NinjaIncoPromotionV2} from "../src/NinjaIncoPromotionV2.sol";

contract DeployNinjaIncoV2 is Script {
    error DeploymentVerificationFailed(string check);

    function run() external {
        vm.startBroadcast(_deployerKey());
        NinjaIncoTechniqueRegistry techniques = new NinjaIncoTechniqueRegistry();
        NinjaIncoChallengeRegistry challenges = new NinjaIncoChallengeRegistry(address(techniques));
        NinjaIncoProgressionV2 progression = new NinjaIncoProgressionV2();
        NinjaIncoTrainingV2 training = new NinjaIncoTrainingV2(address(progression));
        NinjaIncoDuelV2 duel = new NinjaIncoDuelV2(address(techniques), address(challenges), address(progression));
        NinjaIncoPromotionV2 promotion = new NinjaIncoPromotionV2(address(progression), address(techniques), address(challenges));

        progression.setAuthorizedTrainer(address(training), true);
        progression.setAuthorizedDuelSettler(address(duel), true);
        progression.setAuthorizedRankUpdater(address(promotion), true);
        vm.stopBroadcast();

        _verify(techniques, challenges, progression, training, duel, promotion);
        console.log("NinjaIncoTechniqueRegistry:", address(techniques));
        console.log("NinjaIncoChallengeRegistry:", address(challenges));
        console.log("NinjaIncoProgressionV2:", address(progression));
        console.log("NinjaIncoTrainingV2:", address(training));
        console.log("NinjaIncoDuelV2:", address(duel));
        console.log("NinjaIncoPromotionV2:", address(promotion));
        console.log("authorizedTrainer:", address(training));
        console.log("authorizedDuelSettler:", address(duel));
        console.log("authorizedRankUpdater:", address(promotion));
    }

    function _verify(NinjaIncoTechniqueRegistry t, NinjaIncoChallengeRegistry c, NinjaIncoProgressionV2 p, NinjaIncoTrainingV2 tr, NinjaIncoDuelV2 d, NinjaIncoPromotionV2 pr) internal view {
        if (address(t) == address(0) || address(c) == address(0) || address(p) == address(0) || address(tr) == address(0) || address(d) == address(0) || address(pr) == address(0)) revert DeploymentVerificationFailed("zero address");
        if (address(c.techniqueRegistry()) != address(t)) revert DeploymentVerificationFailed("challenge technique registry");
        if (address(d.techniqueRegistry()) != address(t) || address(d.challengeRegistry()) != address(c) || address(d.progression()) != address(p)) revert DeploymentVerificationFailed("duel dependencies");
        if (address(tr.progression()) != address(p)) revert DeploymentVerificationFailed("training progression");
        if (address(pr.progression()) != address(p) || address(pr.techniqueRegistry()) != address(t) || address(pr.challengeRegistry()) != address(c)) revert DeploymentVerificationFailed("promotion dependencies");
        if (!p.authorizedTrainer(address(tr))) revert DeploymentVerificationFailed("trainer authorization");
        if (!p.authorizedDuelSettler(address(d))) revert DeploymentVerificationFailed("duel authorization");
        if (!p.authorizedRankUpdater(address(pr))) revert DeploymentVerificationFailed("promotion authorization");
    }

    function _deployerKey() internal view returns (uint256) {
        if (block.chainid == 31337) return vm.envUint("PRIVATE_KEY_ANVIL");
        if (block.chainid == 84532) return vm.envUint("PRIVATE_KEY_BASE_SEPOLIA");
        if (block.chainid == 8453) return vm.envUint("PRIVATE_KEY_BASE");
        revert("Set a deployer private key in .env for this chain id");
    }
}

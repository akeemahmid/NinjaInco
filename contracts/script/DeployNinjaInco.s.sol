// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {NinjaIncoGame} from "../src/NinjaIncoGame.sol";

contract DeployNinjaInco is Script {
    function run() external {
        vm.startBroadcast(_deployerKey());

        NinjaIncoGame game = new NinjaIncoGame();
        console.log("NinjaIncoGame deployed at:", address(game));

        vm.stopBroadcast();
    }

    function _deployerKey() internal view returns (uint256) {
        if (block.chainid == 31337) return vm.envUint("PRIVATE_KEY_ANVIL");
        if (block.chainid == 84532) return vm.envUint("PRIVATE_KEY_BASE_SEPOLIA");
        if (block.chainid == 8453) return vm.envUint("PRIVATE_KEY_BASE");
        revert("Set a deployer private key in .env for this chain id");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {NinjaIncoDuel} from "../src/NinjaIncoDuel.sol";

contract DeployNinjaIncoDuel is Script {
    function run() external {
        address registryAddress = vm.envAddress("NINJAINCO_REGISTRY_ADDRESS");
        vm.startBroadcast(_deployerKey());
        NinjaIncoDuel duel = new NinjaIncoDuel(registryAddress);
        console.log("NinjaIncoDuel deployed at:", address(duel));
        vm.stopBroadcast();
    }

    function _deployerKey() internal view returns (uint256) {
        if (block.chainid == 31337) return vm.envUint("PRIVATE_KEY_ANVIL");
        if (block.chainid == 84532) return vm.envUint("PRIVATE_KEY_BASE_SEPOLIA");
        if (block.chainid == 8453) return vm.envUint("PRIVATE_KEY_BASE");
        revert("Set a deployer private key in .env for this chain id");
    }
}

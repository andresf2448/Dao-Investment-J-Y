// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Script, console} from "forge-std/Script.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {GovernanceToken} from "../../contracts/governance/GovernanceToken.sol";

contract DeployGovernanceToken is Script {
    address public governanceTokenAddress;

    function run(address _deployer) external {
        HelperConfig config = new HelperConfig();
        HelperConfig.NetworkConfig memory networkConfig = config.getActiveNetworkConfig();

        uint256 deployerPrivateKey = networkConfig.deployerPrivateKey;
        address deployer = _deployer == address(0) ? vm.addr(deployerPrivateKey) : _deployer;

        vm.startBroadcast(deployerPrivateKey);
            GovernanceToken governanceToken = new GovernanceToken(deployer);
        vm.stopBroadcast();

        governanceTokenAddress = address(governanceToken);
        console.log("GovernanceToken deployed at:", address(governanceToken));
    }
}
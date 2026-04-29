// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Script, console} from "forge-std/Script.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {MockERC20} from "../../test/mocks/MockERC20.sol";
import {MockAavePool} from "../../test/mocks/MockAavePool.sol";
import {MockV3Aggregator} from "../../test/mocks/MockV3Aggregator.sol";

contract DeployMocks is Script {
  function run() external returns (address mockERC20, address mockAavePool, address mockV3Aggregator) {
    HelperConfig config = new HelperConfig();
    HelperConfig.NetworkConfig memory networkConfig = config.getActiveNetworkConfig();

    uint256 deployerPrivateKey = networkConfig.deployerPrivateKey;

    vm.startBroadcast(deployerPrivateKey);
      MockERC20 mockERC20Instance = new MockERC20();
      MockAavePool mockAavePoolInstance = new MockAavePool();
      MockV3Aggregator mockV3AggregatorInstance = new MockV3Aggregator(8, 2000e8);
    vm.stopBroadcast();

    console.log("MockERC20 deployed at:", address(mockERC20Instance));
    console.log("MockAavePool deployed at:", address(mockAavePoolInstance));
    console.log("MockV3Aggregator deployed at:", address(mockV3AggregatorInstance));

    return (address(mockERC20Instance), address(mockAavePoolInstance), address(mockV3AggregatorInstance));
  }
}
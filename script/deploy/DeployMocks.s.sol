// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Script, console} from "forge-std/Script.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {MockERC20} from "../../test/mocks/MockERC20.sol";
import {MockAavePool} from "../../test/mocks/MockAavePool.sol";

contract DeployMocks is Script {
  function run() external returns (address mockERC20, address mockAavePool) {
    HelperConfig config = new HelperConfig();
    HelperConfig.NetworkConfig memory networkConfig = config.getActiveNetworkConfig();

    uint256 deployerPrivateKey = networkConfig.deployerPrivateKey;

    vm.startBroadcast(deployerPrivateKey);
      MockERC20 mockERC20Instance = new MockERC20();
      MockAavePool mockAavePoolInstance = new MockAavePool();
    vm.stopBroadcast();

    console.log("MockERC20 deployed at:", address(mockERC20Instance));
    console.log("MockAavePool deployed at:", address(mockAavePoolInstance));

    return (address(mockERC20Instance), address(mockAavePoolInstance));
  }
}
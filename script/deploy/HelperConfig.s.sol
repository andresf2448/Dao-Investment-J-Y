// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDC} from "../../test/mocks/MockUSDC.sol";
import {MockAavePool} from "../../test/mocks/MockAavePool.sol";

contract HelperConfig is Script {
  struct NetworkConfig {
    address[] allowedGenesisTokens;
    uint256 deployerPrivateKey;
    address aavePool;
    string networkName;
  }

  uint256 public constant DEFAULT_ANVIL_PRIVATE_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

  NetworkConfig private activeNetworkConfig;

  constructor() {
    if(block.chainid == 11155111) {
      activeNetworkConfig = getSepoliaConfig();
    } else {
      activeNetworkConfig = getOrCreateAnvilConfig();
    }
  }

  function getSepoliaConfig() public view returns(NetworkConfig memory sepoliaNetworkConfig) {
    address[] memory allowedGenesisTokens = new address[](1);
    allowedGenesisTokens[0] = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;

    sepoliaNetworkConfig = NetworkConfig({
      allowedGenesisTokens: allowedGenesisTokens,
      deployerPrivateKey: vm.envUint("SEPOLIA_PRIVATE_KEY"),
      aavePool: 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2,
      networkName: "sepolia"
    });
  }

  function getOrCreateAnvilConfig() public returns(NetworkConfig memory anvilNetworkConfig) {
    if(activeNetworkConfig.allowedGenesisTokens.length > 0) return activeNetworkConfig;

    address[] memory allowedGenesisTokens = new address[](1);
    allowedGenesisTokens[0] = address(new MockUSDC());

    anvilNetworkConfig = NetworkConfig({
      allowedGenesisTokens: allowedGenesisTokens,
      deployerPrivateKey: DEFAULT_ANVIL_PRIVATE_KEY,
      aavePool: address(new MockAavePool()),
      networkName: "anvil"
    });
  }

  function getActiveNetworkConfig() external view returns(NetworkConfig memory) {
    return activeNetworkConfig;
  }
}
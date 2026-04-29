// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Script, console} from "forge-std/Script.sol";
import {MockERC20} from "../../test/mocks/MockERC20.sol";
import {MockAavePool} from "../../test/mocks/MockAavePool.sol";

contract HelperConfig is Script {
  struct NetworkConfig {
    address[] allowedGenesisTokens;
    uint256 deployerPrivateKey;
    address aavePool;
    string networkName;
    address allowedVaultToken;
    address mockV3Aggregator;
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
      allowedVaultToken: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238,
      deployerPrivateKey: vm.envUint("SEPOLIA_PRIVATE_KEY"),
      aavePool: 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2,
      mockV3Aggregator: 0x694AA1769357215DE4FAC081bf1f309aDC325306,
      networkName: "sepolia"
    });
  }

  function getOrCreateAnvilConfig() public view returns(NetworkConfig memory anvilNetworkConfig) {
    if(activeNetworkConfig.allowedGenesisTokens.length > 0) return activeNetworkConfig;

    // Los mocks se desplegarán en cada script individual dentro de vm.startBroadcast
    address[] memory allowedGenesisTokens = new address[](1);
    allowedGenesisTokens[0] = address(0); // Placeholder, se reemplazará en cada deploy

    anvilNetworkConfig = NetworkConfig({
      allowedGenesisTokens: allowedGenesisTokens,
      allowedVaultToken: address(0), // Placeholder, se reemplazará en cada deploy
      deployerPrivateKey: DEFAULT_ANVIL_PRIVATE_KEY,
      aavePool: address(0), // Placeholder, se reemplazará en cada deploy
      mockV3Aggregator: address(0), // Placeholder, se reemplazará en cada deploy
      networkName: "anvil"
    });

    return anvilNetworkConfig;
  }

  function getActiveNetworkConfig() external view returns(NetworkConfig memory) {
    return activeNetworkConfig;
  }
}
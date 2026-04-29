// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IStrategyAdapter} from "../interfaces/adapters/IStrategyAdapter.sol";
import {IRiskManager} from "../interfaces/execution/IRiskManager.sol";
import {IStrategyRouter} from "../interfaces/execution/IStrategyRouter.sol";
import {IVaultRegistry} from "../interfaces/vaults/IVaultRegistry.sol";
import {CommonErrors} from "../libraries/errors/CommonErrors.sol";

contract StrategyRouter is
  Initializable,
  AccessControlUpgradeable,
  UUPSUpgradeable,
  IStrategyRouter
{
  using EnumerableSet for EnumerableSet.AddressSet;

  bytes32 public constant ADAPTER_MANAGER_ROLE = keccak256("ADAPTER_MANAGER_ROLE");
  IVaultRegistry public vaultRegistry;

  EnumerableSet.AddressSet private _allowedAdapters;
  address public riskManager;

  event AdapterAllowedSet(address indexed adapter, bool allowed);
  event RiskManagerUpdated(address indexed oldRiskManager, address indexed newRiskManager);
  event StrategyExecuted(
    address indexed vault,
    address[] adapters,
    address indexed asset,
    uint256[] percentages
  );

  error StrategyRouter__AdapterNotAllowed();
  error StrategyRouter__VaultNotActive();
  error StrategyRouter__InvalidAllocation();

  constructor() {
    _disableInitializers();
  }

  function initialize(
    address adminTimelock,
    address riskManager_,
    IVaultRegistry vaultRegistry_
  ) external initializer {
    if(adminTimelock == address(0) || riskManager_ == address(0))
      revert CommonErrors.ZeroAddress();
    
    if(address(vaultRegistry_) == address(0))
      revert CommonErrors.ZeroAddress();

    __AccessControl_init();

    riskManager = riskManager_;
    vaultRegistry = vaultRegistry_;
    _grantRole(DEFAULT_ADMIN_ROLE, adminTimelock);
    _grantRole(ADAPTER_MANAGER_ROLE, adminTimelock);
  }

  function setAdapterAllowed(
    address adapter,
    bool allowed
  ) external onlyRole(ADAPTER_MANAGER_ROLE) {
    if(adapter == address(0))
      revert CommonErrors.ZeroAddress();

    if (allowed) {
      _allowedAdapters.add(adapter);
    } else {
      _allowedAdapters.remove(adapter);
    }
    
    emit AdapterAllowedSet(adapter, allowed);
  }

  function isAdapterAllowed(address adapter) public view returns (bool) {
    return _allowedAdapters.contains(adapter);
  }

  function allowedAdapters(address adapter) external view returns (bool) {
    return isAdapterAllowed(adapter);
  }

  function getAllowedAdapters() external view returns (address[] memory) {
    return _allowedAdapters.values();
  }

  function setRiskManager(
    address newRiskManager
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    if(newRiskManager == address(0))
      revert CommonErrors.ZeroAddress();

    address oldRiskManager = riskManager;
    riskManager = newRiskManager;

    emit RiskManagerUpdated(oldRiskManager, newRiskManager);
  }

  function execute(
    address adapter,
    address vault,
    address asset,
    bytes calldata data
  ) external override {
    if(vault != msg.sender)
      revert CommonErrors.Unauthorized();

    if(!vaultRegistry.isActiveVault(vault))
      revert StrategyRouter__VaultNotActive();

    if(!isAdapterAllowed(adapter))
      revert StrategyRouter__AdapterNotAllowed();

    if(riskManager == address(0))
      revert CommonErrors.ZeroAddress();

    IRiskManager(riskManager).validateExecution(vault, asset, adapter, data);
    IStrategyAdapter(adapter).execute(vault, data);

    address[] memory adapters = new address[](1);
    adapters[0] = adapter;
    uint256[] memory percentages = new uint256[](1);
    percentages[0] = 100;

    emit StrategyExecuted(vault, adapters, asset, percentages);
  }

  function executeMultiple(
    address vault,
    address asset,
    address[] calldata adapters,
    uint256[] calldata percentages
  ) external override {
    if(adapters.length != percentages.length)
      revert StrategyRouter__InvalidAllocation();

    if(vault == address(0))
      revert CommonErrors.ZeroAddress();

    if(!vaultRegistry.isActiveVault(vault))
      revert StrategyRouter__VaultNotActive();

    if(riskManager == address(0))
      revert CommonErrors.ZeroAddress();

    uint256 totalPercentage = 0;
    for(uint256 i = 0; i < adapters.length; i++) {
      if(adapters[i] == address(0))
        revert CommonErrors.ZeroAddress();

      if(!isAdapterAllowed(adapters[i]))
        revert StrategyRouter__AdapterNotAllowed();

      for(uint256 j = 0; j < i; j++) {
        if(adapters[j] == adapters[i])
          revert StrategyRouter__InvalidAllocation();
      }

      totalPercentage += percentages[i];
    }

    if(totalPercentage != 100)
      revert StrategyRouter__InvalidAllocation();

    // Encode data with adapter percentages for risk manager validation
    bytes memory allocationData = abi.encode(adapters, percentages);
    IRiskManager(riskManager).validateExecution(vault, asset, adapters[0], allocationData);

    // Execute each adapter with their respective percentage
    for(uint256 i = 0; i < adapters.length; i++) {
      bytes memory adapterData = abi.encode(percentages[i]);
      IStrategyAdapter(adapters[i]).execute(vault, adapterData);
    }

    emit StrategyExecuted(vault, adapters, asset, percentages);
  }

  function _authorizeUpgrade(
    address newImplementation
  ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}

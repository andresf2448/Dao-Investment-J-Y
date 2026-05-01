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
  uint8 public constant DIVEST_ACTION = 1;

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
  event DivestStrategy(
    address indexed vault,
    address[] adapters,
    uint256[] amountsToDivest
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
    uint256 amountToInvest,
    uint8 action
  ) external override {
    if(vault != msg.sender)
      revert CommonErrors.Unauthorized();

    if(!vaultRegistry.isActiveVault(vault))
      revert StrategyRouter__VaultNotActive();

    if(!isAdapterAllowed(adapter))
      revert StrategyRouter__AdapterNotAllowed();

    if(riskManager == address(0))
      revert CommonErrors.ZeroAddress();

    IRiskManager(riskManager).validateExecution(asset);
    IStrategyAdapter(adapter).execute(vault, action, amountToInvest);

    address[] memory adapters = new address[](1);
    adapters[0] = adapter;
    uint256[] memory percentages = new uint256[](1);
    percentages[0] = 100;

    emit StrategyExecuted(vault, adapters, asset, percentages);
  }

  function divestMultiple(
    address vault,
    address[] calldata adapters,
    uint256[] calldata amountsToDivest
  ) external override {
    if(vault != msg.sender)
      revert CommonErrors.Unauthorized();

    uint256 adaptersLength = adapters.length;

    for(uint256 i = 0; i < adaptersLength; i++) {
      if(adapters[i] == address(0))
        revert CommonErrors.ZeroAddress();

      IStrategyAdapter(adapters[i]).execute(vault, DIVEST_ACTION, amountsToDivest[i]);
    }

    emit DivestStrategy(vault, adapters, amountsToDivest);
  }

  function executeMultiple(
    address vault,
    address asset,
    address[] calldata adapters,
    uint256[] calldata amountsToInvest,
    uint8 action
  ) external override {
    if(vault != msg.sender)
      revert CommonErrors.Unauthorized();

    if(adapters.length != amountsToInvest.length)
      revert StrategyRouter__InvalidAllocation();

    if(vault == address(0))
      revert CommonErrors.ZeroAddress();

    if(!vaultRegistry.isActiveVault(vault))
      revert StrategyRouter__VaultNotActive();

    if(riskManager == address(0))
      revert CommonErrors.ZeroAddress();

    for(uint256 i = 0; i < adapters.length; i++) {
      if(adapters[i] == address(0))
        revert CommonErrors.ZeroAddress();

      if(!isAdapterAllowed(adapters[i]))
        revert StrategyRouter__AdapterNotAllowed();

      for(uint256 j = 0; j < i; j++) {
        if(adapters[j] == adapters[i])
          revert StrategyRouter__InvalidAllocation();
      }
    }

    IRiskManager(riskManager).validateExecution(asset);

    for(uint256 i = 0; i < adapters.length; i++) {
      IStrategyAdapter(adapters[i]).execute(vault, action, amountsToInvest[i]);
    }

    emit StrategyExecuted(vault, adapters, asset, amountsToInvest);
  }

  function _authorizeUpgrade(
    address newImplementation
  ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC4626Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
// import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";
import {IProtocolCore} from "../../interfaces/core/IProtocolCore.sol";
import {IStrategyRouter} from "../../interfaces/execution/IStrategyRouter.sol";
import {IVaultStrategyExecutor} from "../../interfaces/vaults/IVaultStrategyExecutor.sol";
import {CommonErrors} from "../../libraries/errors/CommonErrors.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract VaultImplementation is
  Initializable,
  ERC20Upgradeable,
  ERC4626Upgradeable,
  AccessControlUpgradeable,
  PausableUpgradeable,
  ReentrancyGuardTransient,
  IVaultStrategyExecutor
{
  using SafeERC20 for IERC20;
  using EnumerableSet for EnumerableSet.AddressSet;

  enum AdapterStatus {
    None,
    Active,
    Retired
  }

  struct AdapterAllocation {
    uint256 percentage;
    AdapterStatus status;
  }

  bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
  bytes32 public constant STRATEGY_EXECUTOR_ROLE = keccak256("STRATEGY_EXECUTOR_ROLE");

  address public guardian;
  address public factory;
  address public router;
  address public core;

  EnumerableSet.AddressSet private _vaultActiveAdapters;
  mapping(address adapter => AdapterAllocation) public listAdapters;

  event VaultInitialized(
    address indexed asset,
    address indexed guardian,
    address indexed admin,
    address factory,
    address router,
    address core
  );
  event RouterUpdated(address indexed oldRouter, address indexed newRouter);
  event CoreUpdated(address indexed oldCore, address indexed newCore);
  event StrategyExecutionRequest(
    address indexed guardian,
    address[] adapters,
    uint256[] percentages
  );
  event RouterCallExecuted(
    address indexed target,
    uint256 value,
    bytes data,
    bytes result
  );
  event RouterTokenApprovalSet(
    address indexed token,
    address indexed spender,
    uint256 amount
  );

  error VaultImplementation__NotFactory();
  error VaultImplementation__DepositsPaused();
  error VaultImplementation__NotRouter();
  error VaultImplementation__ExternalCallFailed();
  error VaultImplementation__InvalidStrategyAllocation();
  error VaultImplementation__duplicatedAdapter();
  error VaultImplementation__InvalidPercentage();

  constructor() {
    _disableInitializers();
  }

  function initialize(
    address asset_,
    string memory name_,
    string memory symbol_,
    address guardian_,
    address admin_,
    address factory_,
    address router_,
    address core_
  ) external initializer {
    if(
      asset_ == address(0) ||
      guardian_ == address(0) ||
      admin_ == address(0) ||
      factory_ == address(0) ||
      router_ == address(0) ||
      core_ == address(0)
    ) {
      revert CommonErrors.ZeroAddress();
    }

    if(msg.sender != factory_) revert VaultImplementation__NotFactory();

    __ERC20_init(name_, symbol_);
    __ERC4626_init(IERC20(asset_));
    __AccessControl_init();
    __Pausable_init();

    guardian = guardian_;
    factory = factory_;
    router = router_;
    core = core_;

    _grantRole(DEFAULT_ADMIN_ROLE, admin_);
    _grantRole(GUARDIAN_ROLE, guardian_);
    _grantRole(STRATEGY_EXECUTOR_ROLE, router_);

    emit VaultInitialized(
      asset_,
      guardian_,
      admin_,
      factory_,
      router_,
      core_
    );
  }

  function setRouter(address newRouter) external onlyRole(DEFAULT_ADMIN_ROLE) {
    if(newRouter == address(0)) revert CommonErrors.ZeroAddress();

    address oldRouter = router;
    _revokeRole(STRATEGY_EXECUTOR_ROLE, oldRouter);
    router = newRouter;
    _grantRole(STRATEGY_EXECUTOR_ROLE, newRouter);

    emit RouterUpdated(oldRouter, newRouter);
  }

  function setCore(address newCore) external onlyRole(DEFAULT_ADMIN_ROLE) {
    if(newCore == address(0)) revert CommonErrors.ZeroAddress();

    address oldCore = core;
    core = newCore;

    emit CoreUpdated(oldCore, newCore);
  }

  function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    _pause();
  }

  function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    _unpause();
  }

  function deposit(uint256 assets, address receiver)
    public
    override
    whenNotPaused
    nonReentrant
    returns(uint256 shares)
  {
    if(IProtocolCore(core).isVaultDepositsPaused())
      revert VaultImplementation__DepositsPaused();

    return super.deposit(assets, receiver);
  }

  function mint(uint256 shares, address receiver)
    public
    override
    whenNotPaused
    nonReentrant
    returns(uint256 assets)
  {
    if (IProtocolCore(core).isVaultDepositsPaused())
      revert VaultImplementation__DepositsPaused();

    return super.mint(shares, receiver);
  }

  function withdraw(
    uint256 assets,
    address receiver,
    address owner
  )
    public
    override
    whenNotPaused
    nonReentrant
    returns(uint256 shares)
  {
    return super.withdraw(assets, receiver, owner);
  }

  function redeem(
    uint256 shares,
    address receiver,
    address owner
  )
    public
    override
    whenNotPaused
    nonReentrant
    returns(uint256 assets)
  {
    return super.redeem(shares, receiver, owner);
  }

  function divestStrategy() external onlyRole(GUARDIAN_ROLE) whenNotPaused {
    if (_vaultActiveAdapters.length() == 0)
      revert VaultImplementation__InvalidStrategyAllocation();

    IStrategyRouter(router).divestMultiple(
      address(this),
      asset(),
      _vaultActiveAdapters.values()
    );
  }

  function executeStrategy(
    address[] calldata newAdapters,
    uint256[] calldata newPercentages,
    uint8 action
  ) external onlyRole(GUARDIAN_ROLE) whenNotPaused {
    uint256 adaptersLength = newAdapters.length;

    if(adaptersLength == 0 || adaptersLength != newPercentages.length)
      revert VaultImplementation__InvalidStrategyAllocation();

    uint256 vaultActiveAdaptersLength = _vaultActiveAdapters.length();

    if(vaultActiveAdaptersLength > 0) {

      for(uint256 i = 0; i < vaultActiveAdaptersLength; i++) {
        address activeAdapter = _vaultActiveAdapters.at(i);
        listAdapters[activeAdapter].status = AdapterStatus.Retired;

        _vaultActiveAdapters.remove(activeAdapter);
      }
    }

    uint256 totalPercentage = 0;

    for(uint256 i = 0; i < adaptersLength; i++) {
      address adapter = newAdapters[i];
      uint256 percentage = newPercentages[i];

      if(adapter == address(0) || percentage == 0)
        revert VaultImplementation__InvalidStrategyAllocation();

      listAdapters[adapter] = AdapterAllocation({
        percentage: percentage,
        status: AdapterStatus.Active
      });

      if(_vaultActiveAdapters.contains(adapter))
        revert VaultImplementation__duplicatedAdapter();

      _vaultActiveAdapters.add(adapter);
      _giveAdapterRole(adapter);

      totalPercentage += newPercentages[i];
    }

    if(totalPercentage != 100)
      revert VaultImplementation__InvalidPercentage();

    emit StrategyExecutionRequest(msg.sender, newAdapters, newPercentages);

    uint256 totalAssets = totalAssets();
    uint256[] memory amountsToInvest = new uint256[](adaptersLength);

    for(uint256 i = 0; i < adaptersLength; i++) {
      amountsToInvest[i] = (totalAssets * newPercentages[i]) / 100;
    }

    IStrategyRouter(router).executeMultiple(
      address(this),
      asset(),
      newAdapters,
      amountsToInvest,
      action
    );
  }

  function executeFromRouter(
    address target,
    uint256 value,
    bytes calldata data
  )
    external
    override
    onlyRole(STRATEGY_EXECUTOR_ROLE)
    returns(bytes memory result)
  {
    if(target == address(0))
      revert CommonErrors.ZeroAddress();

    (bool success, bytes memory returndata) = target.call{value: value}(data);
    if(!success) revert VaultImplementation__ExternalCallFailed();

    emit RouterCallExecuted(target, value, data, returndata);
    return returndata;
  }

  function approveTokenFromRouter(
    address token,
    address spender,
    uint256 amount
  ) external override onlyRole(STRATEGY_EXECUTOR_ROLE) {
    if(token == address(0) || spender == address(0))
      revert CommonErrors.ZeroAddress();

    IERC20(token).forceApprove(spender, amount);
    emit RouterTokenApprovalSet(token, spender, amount);
  }

  function decimals()
    public
    view
    override(ERC20Upgradeable, ERC4626Upgradeable)
    returns(uint8)
  {
    return ERC20Upgradeable.decimals();
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(AccessControlUpgradeable)
    returns(bool)
  {
    return super.supportsInterface(interfaceId);
  }

  function _giveAdapterRole(address adapter) internal {
    if(adapter == address(0))
      revert CommonErrors.ZeroAddress();

    _grantRole(STRATEGY_EXECUTOR_ROLE, adapter);
  }
}

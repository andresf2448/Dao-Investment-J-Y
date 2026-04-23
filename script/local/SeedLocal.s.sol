// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Script, console} from "forge-std/Script.sol";
import {HelperConfig} from "../deploy/HelperConfig.s.sol";
import {TimeLock} from "../../contracts/governance/TimeLock.sol";
import {IERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {MockERC20} from "../../test/mocks/MockERC20.sol";
import {GenesisBonding} from "../../contracts/bootstrap/GenesisBonding.sol";
import {GuardianAdministrator} from "../../contracts/guardians/GuardianAdministrator.sol";
import {GuardianBondEscrow} from "../../contracts/guardians/GuardianBondEscrow.sol";
import {VaultFactory} from "../../contracts/vaults/factory/VaultFactory.sol";

contract SeedLocal is Script {
  uint256 constant GAS_BUFFER = 1 ether;
  uint256 constant GUARDIAN_BOND = 100e18;
  uint256 constant INVESTOR1_GVT_BUY = 50e18;
  uint256 constant INVESTOR2_GVT_BUY = 30e18;
  uint256 constant INVESTOR1_DEPOSIT = 10e18;
  uint256 constant INVESTOR2_DEPOSIT = 5e18;
  bytes32 constant DEFAULT_ADMIN_ROLE = 0x00;
  bytes32 constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
  bytes32 constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
  bytes32 constant CANCELLER_ROLE = keccak256("CANCELLER_ROLE");
  bytes32 constant MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 constant SWEEP_ROLE = keccak256("SWEEP_ROLE");
  bytes32 constant SWEEP_NOT_ASSET_DAO_ROLE = keccak256("SWEEP_NOT_ASSET_DAO_ROLE");
  bytes32 constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
  bytes32 constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
  bytes32 constant GUARDIAN_ADMINISTRATOR_ROLE = keccak256("GUARDIAN_ADMINISTRATOR_ROLE");
  bytes32 constant FACTORY_ROLE = keccak256("FACTORY_ROLE");
  bytes32 constant ADAPTER_MANAGER_ROLE = keccak256("ADAPTER_MANAGER_ROLE");
  bytes32 constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
  bytes32 constant STRATEGY_EXECUTOR_ROLE = keccak256("STRATEGY_EXECUTOR_ROLE");

  struct Participant {
    address addr;
    uint256 privateKey;
    string label;
  }

  function run() external {
    require(block.chainid == 31337, "SeedLocal only supports Anvil");

    HelperConfig config = new HelperConfig();
    HelperConfig.NetworkConfig memory networkConfig = config.getActiveNetworkConfig();
    string memory json = vm.readFile("deployments/anvil.json");

    address timeLock = abi.decode(vm.parseJson(json, ".timeLock"), (address));
    address guardianAdministrator = abi.decode(vm.parseJson(json, ".guardianAdministrator"), (address));
    address guardianBondEscrow = abi.decode(vm.parseJson(json, ".guardianBondEscrow"), (address));
    address genesisBonding = abi.decode(vm.parseJson(json, ".genesisBonding"), (address));
    address vaultFactory = abi.decode(vm.parseJson(json, ".vaultFactory"), (address));
    address governanceToken = abi.decode(vm.parseJson(json, ".governanceToken"), (address));
    address treasury = abi.decode(vm.parseJson(json, ".treasury"), (address));
    address protocolCore = abi.decode(vm.parseJson(json, ".protocolCore"), (address));
    address riskManager = abi.decode(vm.parseJson(json, ".riskManager"), (address));
    address vaultRegistry = abi.decode(vm.parseJson(json, ".vaultRegistry"), (address));
    address strategyRouter = abi.decode(vm.parseJson(json, ".strategyRouter"), (address));
    address mockUsdc = address(GuardianBondEscrow(guardianBondEscrow).guardianApplicationToken());
    uint256 adminWalletPrivateKey = vm.envUint("ADMIN_WALLET_ANVIL_PRIVATE_KEY");
    address adminWallet = vm.addr(adminWalletPrivateKey);

    (address guardianAddr, uint256 guardianPk) = makeAddrAndKey("seed-guardian");
    (address investor1Addr, uint256 investor1Pk) = makeAddrAndKey("seed-investor-1");
    (address investor2Addr, uint256 investor2Pk) = makeAddrAndKey("seed-investor-2");

    Participant memory guardian = Participant(guardianAddr, guardianPk, "guardian");
    Participant memory investor1 = Participant(investor1Addr, investor1Pk, "investor1");
    Participant memory investor2 = Participant(investor2Addr, investor2Pk, "investor2");

    console.log("========================================");
    console.log("Running Local Seed");
    console.log("========================================");

    _fundAccount(networkConfig.deployerPrivateKey, adminWallet, GAS_BUFFER);
    _fundAccount(networkConfig.deployerPrivateKey, guardian.addr, GAS_BUFFER);
    _fundAccount(networkConfig.deployerPrivateKey, investor1.addr, GAS_BUFFER);
    _fundAccount(networkConfig.deployerPrivateKey, investor2.addr, GAS_BUFFER);

    _grantAdminWalletFullAccess(
      networkConfig.deployerPrivateKey,
      adminWallet,
      timeLock,
      governanceToken,
      treasury,
      protocolCore,
      riskManager,
      guardianAdministrator,
      guardianBondEscrow,
      vaultRegistry,
      strategyRouter,
      genesisBonding,
      vaultFactory
    );

    _mintUsdc(networkConfig.deployerPrivateKey, mockUsdc, guardian.addr, GUARDIAN_BOND);
    _mintUsdc(networkConfig.deployerPrivateKey, mockUsdc, investor1.addr, INVESTOR1_GVT_BUY + INVESTOR1_DEPOSIT);
    _mintUsdc(networkConfig.deployerPrivateKey, mockUsdc, investor2.addr, INVESTOR2_GVT_BUY + INVESTOR2_DEPOSIT);

    _activateGuardian(
      networkConfig.deployerPrivateKey,
      guardian,
      mockUsdc,
      guardianBondEscrow,
      guardianAdministrator,
      timeLock
    );

    address vault = _createVault(guardian.privateKey, vaultFactory, mockUsdc);
    _grantVaultRolesToAdmin(networkConfig.deployerPrivateKey, timeLock, vault, adminWallet);
    _buyGovernanceForInvestor(investor1, mockUsdc, genesisBonding, INVESTOR1_GVT_BUY);
    _buyGovernanceForInvestor(investor2, mockUsdc, genesisBonding, INVESTOR2_GVT_BUY);
    _depositToVault(investor1, mockUsdc, vault, INVESTOR1_DEPOSIT);
    _depositToVault(investor2, mockUsdc, vault, INVESTOR2_DEPOSIT);

    console.log("========================================");
    console.log("Local Seed Complete");
    console.log("========================================");
    console.log("Admin wallet:", adminWallet);
    console.log("Guardian:", guardian.addr);
    console.log("Investor1:", investor1.addr);
    console.log("Investor2:", investor2.addr);
    console.log("Vault:", vault);
  }

  function _fundAccount(uint256 deployerPrivateKey, address target, uint256 amount) internal {
    vm.startBroadcast(deployerPrivateKey);
    (bool ok,) = payable(target).call{value: amount}("");
    vm.stopBroadcast();
    require(ok, "Failed to fund account");
  }

  function _mintUsdc(uint256 deployerPrivateKey, address mockUsdc, address to, uint256 amount) internal {
    vm.startBroadcast(deployerPrivateKey);
    MockERC20(mockUsdc).mint(to, amount);
    vm.stopBroadcast();
  }

  function _activateGuardian(
    uint256 deployerPrivateKey,
    Participant memory guardian,
    address mockUsdc,
    address guardianBondEscrow,
    address guardianAdministrator,
    address timeLock
  ) internal {
    // Governor checks past votes, so we advance one block before proposing.
    vm.rpc("evm_mine", "[]");
    vm.roll(block.number + 1);

    vm.startBroadcast(guardian.privateKey);
    MockERC20(mockUsdc).approve(guardianBondEscrow, GUARDIAN_BOND);
    GuardianAdministrator(guardianAdministrator).applyGuardian();
    vm.stopBroadcast();

    bytes32 salt = keccak256(abi.encodePacked("seed-local-guardian-approve", guardian.addr));
    bytes memory data = abi.encodeCall(GuardianAdministrator.guardianApprove, (guardian.addr));
    bytes32 predecessor = bytes32(0);

    vm.startBroadcast(deployerPrivateKey);
    TimeLock(payable(timeLock)).schedule(
      guardianAdministrator,
      0,
      data,
      predecessor,
      salt,
      TimeLock(payable(timeLock)).getMinDelay()
    );
    TimeLock(payable(timeLock)).execute(guardianAdministrator, 0, data, predecessor, salt);
    vm.stopBroadcast();
  }

  function _createVault(uint256 guardianPrivateKey, address vaultFactory, address mockUsdc) internal returns (address vault) {
    vm.startBroadcast(guardianPrivateKey);
    (vault,) = VaultFactory(vaultFactory).createVault(mockUsdc, "Seed Vault", "sVAULT");
    vm.stopBroadcast();
  }

  function _grantAdminWalletFullAccess(
    uint256 deployerPrivateKey,
    address adminWallet,
    address timeLock,
    address governanceToken,
    address treasury,
    address protocolCore,
    address riskManager,
    address guardianAdministrator,
    address guardianBondEscrow,
    address vaultRegistry,
    address strategyRouter,
    address genesisBonding,
    address vaultFactory
  ) internal {
    _grantRoleViaTimelock(deployerPrivateKey, timeLock, timeLock, DEFAULT_ADMIN_ROLE, adminWallet, "timelock-default-admin");
    _grantRoleViaTimelock(deployerPrivateKey, timeLock, timeLock, PROPOSER_ROLE, adminWallet, "timelock-proposer");
    _grantRoleViaTimelock(deployerPrivateKey, timeLock, timeLock, EXECUTOR_ROLE, adminWallet, "timelock-executor");
    _grantRoleViaTimelock(deployerPrivateKey, timeLock, timeLock, CANCELLER_ROLE, adminWallet, "timelock-canceller");

    _grantRoleViaTimelock(deployerPrivateKey, timeLock, governanceToken, DEFAULT_ADMIN_ROLE, adminWallet, "governance-token-default-admin");
    _grantRoleViaTimelock(deployerPrivateKey, timeLock, governanceToken, MINTER_ROLE, adminWallet, "governance-token-minter");

    _grantRoleViaTimelock(deployerPrivateKey, timeLock, treasury, DEFAULT_ADMIN_ROLE, adminWallet, "treasury-default-admin");
    _grantRoleViaTimelock(deployerPrivateKey, timeLock, treasury, SWEEP_NOT_ASSET_DAO_ROLE, adminWallet, "treasury-sweep-not-asset-dao");

    _grantRoleViaTimelock(deployerPrivateKey, timeLock, protocolCore, DEFAULT_ADMIN_ROLE, adminWallet, "protocol-core-default-admin");
    _grantRoleViaTimelock(deployerPrivateKey, timeLock, protocolCore, MANAGER_ROLE, adminWallet, "protocol-core-manager");
    _grantRoleViaTimelock(deployerPrivateKey, timeLock, protocolCore, EMERGENCY_ROLE, adminWallet, "protocol-core-emergency");

    _grantRoleViaTimelock(deployerPrivateKey, timeLock, riskManager, DEFAULT_ADMIN_ROLE, adminWallet, "risk-manager-default-admin");
    _grantRoleViaTimelock(deployerPrivateKey, timeLock, riskManager, MANAGER_ROLE, adminWallet, "risk-manager-manager");
    _grantRoleViaTimelock(deployerPrivateKey, timeLock, riskManager, EMERGENCY_ROLE, adminWallet, "risk-manager-emergency");

    _grantRoleViaTimelock(deployerPrivateKey, timeLock, guardianBondEscrow, DEFAULT_ADMIN_ROLE, adminWallet, "guardian-bond-escrow-default-admin");
    _grantRoleViaTimelock(
      deployerPrivateKey,
      timeLock,
      guardianBondEscrow,
      GUARDIAN_ADMINISTRATOR_ROLE,
      adminWallet,
      "guardian-bond-escrow-guardian-admin"
    );

    _grantRoleViaTimelock(deployerPrivateKey, timeLock, vaultRegistry, DEFAULT_ADMIN_ROLE, adminWallet, "vault-registry-default-admin");
    _grantRoleViaTimelock(deployerPrivateKey, timeLock, vaultRegistry, FACTORY_ROLE, adminWallet, "vault-registry-factory");

    _grantRoleViaTimelock(deployerPrivateKey, timeLock, strategyRouter, DEFAULT_ADMIN_ROLE, adminWallet, "strategy-router-default-admin");
    _grantRoleViaTimelock(
      deployerPrivateKey,
      timeLock,
      strategyRouter,
      ADAPTER_MANAGER_ROLE,
      adminWallet,
      "strategy-router-adapter-manager"
    );

    _grantRoleViaTimelock(deployerPrivateKey, timeLock, genesisBonding, DEFAULT_ADMIN_ROLE, adminWallet, "genesis-bonding-default-admin");
    _grantRoleViaTimelock(deployerPrivateKey, timeLock, genesisBonding, SWEEP_ROLE, adminWallet, "genesis-bonding-sweep");

    _grantRoleViaTimelock(deployerPrivateKey, timeLock, vaultFactory, DEFAULT_ADMIN_ROLE, adminWallet, "vault-factory-default-admin");

    // GuardianAdministrator uses timelock-gated functions instead of AccessControl,
    // so granting timelock roles is enough for the admin wallet to operate it.
    _checkAdminWalletCoverage(timeLock, guardianAdministrator, adminWallet);
  }

  function _grantVaultRolesToAdmin(
    uint256 deployerPrivateKey,
    address timeLock,
    address vault,
    address adminWallet
  ) internal {
    _grantRoleViaTimelock(deployerPrivateKey, timeLock, vault, DEFAULT_ADMIN_ROLE, adminWallet, "vault-default-admin");
    _grantRoleViaTimelock(deployerPrivateKey, timeLock, vault, GUARDIAN_ROLE, adminWallet, "vault-guardian");
    _grantRoleViaTimelock(
      deployerPrivateKey,
      timeLock,
      vault,
      STRATEGY_EXECUTOR_ROLE,
      adminWallet,
      "vault-strategy-executor"
    );
  }

  function _grantRoleViaTimelock(
    uint256 deployerPrivateKey,
    address timeLock,
    address target,
    bytes32 role,
    address account,
    string memory saltLabel
  ) internal {
    if (_hasRole(target, role, account)) {
      return;
    }

    bytes memory data = abi.encodeWithSignature("grantRole(bytes32,address)", role, account);
    _scheduleAndExecuteTimelockCall(
      deployerPrivateKey,
      timeLock,
      target,
      data,
      keccak256(abi.encodePacked("seed-local-role", saltLabel, target, role, account))
    );
  }

  function _scheduleAndExecuteTimelockCall(
    uint256 deployerPrivateKey,
    address timeLock,
    address target,
    bytes memory data,
    bytes32 salt
  ) internal {
    bytes32 predecessor = bytes32(0);
    uint256 minDelay = TimeLock(payable(timeLock)).getMinDelay();

    vm.startBroadcast(deployerPrivateKey);
    TimeLock(payable(timeLock)).schedule(target, 0, data, predecessor, salt, minDelay);
    TimeLock(payable(timeLock)).execute(target, 0, data, predecessor, salt);
    vm.stopBroadcast();
  }

  function _hasRole(address target, bytes32 role, address account) internal view returns (bool hasRole_) {
    (bool ok, bytes memory data) = target.staticcall(
      abi.encodeWithSignature("hasRole(bytes32,address)", role, account)
    );

    if (!ok || data.length < 32) {
      return false;
    }

    hasRole_ = abi.decode(data, (bool));
  }

  function _checkAdminWalletCoverage(address timeLock, address guardianAdministrator, address adminWallet) internal view {
    require(_hasRole(timeLock, DEFAULT_ADMIN_ROLE, adminWallet), "Admin wallet missing timelock default admin role");
    require(_hasRole(timeLock, PROPOSER_ROLE, adminWallet), "Admin wallet missing timelock proposer role");
    require(_hasRole(timeLock, EXECUTOR_ROLE, adminWallet), "Admin wallet missing timelock executor role");
    require(_hasRole(timeLock, CANCELLER_ROLE, adminWallet), "Admin wallet missing timelock canceller role");
    require(GuardianAdministrator(guardianAdministrator).timelock() == timeLock, "GuardianAdministrator timelock mismatch");
  }

  function _buyGovernanceForInvestor(
    Participant memory investor,
    address mockUsdc,
    address genesisBonding,
    uint256 amount
  ) internal {
    vm.startBroadcast(investor.privateKey);
    MockERC20(mockUsdc).approve(genesisBonding, amount);
    GenesisBonding(genesisBonding).buy(mockUsdc, amount);
    vm.stopBroadcast();
  }

  function _depositToVault(Participant memory investor, address mockUsdc, address vault, uint256 amount) internal {
    vm.startBroadcast(investor.privateKey);
    MockERC20(mockUsdc).approve(vault, amount);
    IERC4626(vault).deposit(amount, investor.addr);
    vm.stopBroadcast();
  }
}

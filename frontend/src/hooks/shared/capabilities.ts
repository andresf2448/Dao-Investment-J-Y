import type {
  ProtocolCapabilities,
  ProtocolCapabilityContext,
} from "@/types/capabilities";

export function deriveCapabilities(
  context: ProtocolCapabilityContext,
): ProtocolCapabilities {
  const isGuardianActive = context.guardianStatus === "active";
  const canApplyAsGuardian =
    context.isWalletConnected && context.guardianStatus === "inactive";

  return {
    canBuyGovernanceTokens: context.isWalletConnected,
    canOpenProposalComposer: context.isWalletConnected,

    canCreateProposal:
      context.isWalletConnected && context.hasProposalThreshold,

    canApplyAsGuardian,

    canAccessGuardianOperations: context.isWalletConnected && isGuardianActive,

    canCreateVault:
      context.isWalletConnected &&
      isGuardianActive &&
      !context.isVaultCreationPaused,

    canExecuteStrategy:
      context.isWalletConnected &&
      isGuardianActive &&
      !context.isExecutionPaused,

    canOpenTreasuryOperations:
      context.isWalletConnected &&
      (context.isTreasuryOperator || context.isAdminOperator),

    canPauseVaultCreation:
      context.isWalletConnected && context.isEmergencyOperator,

    canResumeVaultCreation:
      context.isWalletConnected && context.isManagerOperator,

    canPauseVaultDeposits:
      context.isWalletConnected && context.isEmergencyOperator,

    canResumeVaultDeposits:
      context.isWalletConnected && context.isManagerOperator,

    canPauseRiskExecution:
      context.isWalletConnected && context.isEmergencyOperator,

    canResumeRiskExecution:
      context.isWalletConnected && context.isManagerOperator,

    canAccessAdminConsole:
      context.isWalletConnected &&
      (context.isAdminOperator ||
        context.isManagerOperator ||
        context.isEmergencyOperator),
    canSweepBondingTokens:
      context.isWalletConnected && context.hasBondingSweepRole,
    canWithdrawNonDaoAssets:
      context.isWalletConnected && context.hasTreasurySweepRole,
  };
}

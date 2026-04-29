import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Check,
  Copy,
  Plus,
  ShieldCheck,
  Trash2,
  Vault,
  WalletCards,
  Zap,
} from "lucide-react";
import { useVaultDetailModel } from "@/hooks/useVaultDetailModel";
import { HeroMetric, MetricCard } from "@/components/shared";
import { SummaryStat, MetaRow, ActionField, CopyableAddressCard } from "../";
import { formatAddress } from "@/utils";

type StrategyAllocationRow = {
  id: string;
  adapter: string;
  percentage: string;
};

const createStrategyAllocationRow = (): StrategyAllocationRow => ({
  id:
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  adapter: "",
  percentage: "",
});

export default function VaultDetailPage() {
  const { vaultAddress } = useParams();
  const [depositAmount, setDepositAmount] = useState("");
  const [mintSharesAmount, setMintSharesAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [redeemSharesAmount, setRedeemSharesAmount] = useState("");
  const [copiedAdapter, setCopiedAdapter] = useState<string | null>(null);
  const [strategyAllocations, setStrategyAllocations] = useState<StrategyAllocationRow[]>([
    createStrategyAllocationRow(),
  ]);
  const {
    vault,
    position,
    controls,
    capabilities,
    isSubmitting,
    strategyRouterAdapters,
    strategyAllocationStatuses,
    strategyExecutionMessage,
    strategyExecutionReady,
    depositAssetBalance,
    hasDepositAssetBalance,
    canShowGuardianOperations,
    deposit,
    mint,
    withdraw,
    redeem,
    executeStrategy,
  } = useVaultDetailModel(vaultAddress, strategyAllocations);

  const depositsStatusLabel = controls.depositsEnabled ? "Enabled" : "Paused";
  const strategyExecutionLabel = controls.strategyExecutionEnabled
    ? "Enabled"
    : "Restricted";
  const depositControlsDescription = controls.depositsEnabled
    ? "Deposits and minting are available while protocol and vault controls remain enabled."
    : "Deposits and minting are currently blocked by protocol pause or inactive vault status.";
  const strategyExecutionDescription = controls.strategyExecutionEnabled
    ? "Execution is available at vault level while risk controls remain enabled."
    : "Execution is blocked by risk controls or inactive vault status.";
  const isPositiveNumber = (value: string) =>
    value.trim() !== "" &&
    Number.isFinite(Number(value)) &&
    Number(value) > 0;
  const canDeposit =
    controls.depositsEnabled &&
    isPositiveNumber(depositAmount) &&
    hasDepositAssetBalance;
  const canMint = controls.depositsEnabled && isPositiveNumber(mintSharesAmount);
  const canWithdraw = isPositiveNumber(withdrawAmount);
  const canRedeem = isPositiveNumber(redeemSharesAmount);
  const depositAmountError =
    depositAmount.trim() !== "" && !isPositiveNumber(depositAmount)
      ? `Enter a valid ${vault.asset} amount greater than 0.`
      : depositAmount.trim() !== "" && !hasDepositAssetBalance
      ? `You have no ${vault.asset} balance to deposit.`
      : undefined;
  const mintSharesAmountError =
    mintSharesAmount.trim() !== "" && !isPositiveNumber(mintSharesAmount)
      ? "Enter a valid share amount greater than 0."
      : undefined;
  const withdrawAmountError =
    withdrawAmount.trim() !== "" && !isPositiveNumber(withdrawAmount)
      ? `Enter a valid ${vault.asset} amount greater than 0.`
      : undefined;
  const redeemSharesAmountError =
    redeemSharesAmount.trim() !== "" && !isPositiveNumber(redeemSharesAmount)
      ? "Enter a valid share amount greater than 0."
      : undefined;
  const strategyAllocationTotal = useMemo(
    () =>
      strategyAllocations.reduce((total, row) => {
        const value = Number(row.percentage);
        return Number.isFinite(value) && value > 0 ? total + value : total;
      }, 0),
    [strategyAllocations],
  );

  const canExecuteStrategy =
    capabilities.canExecuteStrategy &&
    controls.strategyExecutionEnabled &&
    strategyExecutionReady &&
    !isSubmitting;

  const handleAddStrategyRow = () => {
    setStrategyAllocations((rows) => [
      ...rows,
      createStrategyAllocationRow(),
    ]);
  };

  const handleUpdateStrategyRow = (
    index: number,
    field: keyof StrategyAllocationRow,
    value: string,
  ) => {
    setStrategyAllocations((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleRemoveStrategyRow = (index: number) => {
    setStrategyAllocations((rows) =>
      rows.length === 1
        ? rows
        : rows.filter((_, rowIndex) => rowIndex !== index),
    );
  };

  const handleCopyAdapter = async (adapter: string) => {
    try {
      await navigator.clipboard.writeText(adapter);
      setCopiedAdapter(adapter);
      window.setTimeout(() => {
        setCopiedAdapter((current) => (current === adapter ? null : current));
      }, 2000);
    } catch {
      setCopiedAdapter(null);
    }
  };

  const handleDeposit = async () => {
    if (await deposit(depositAmount)) {
      setDepositAmount("");
    }
  };

  const handleMint = async () => {
    if (await mint(mintSharesAmount)) {
      setMintSharesAmount("");
    }
  };

  const handleWithdraw = async () => {
    if (await withdraw(withdrawAmount)) {
      setWithdrawAmount("");
    }
  };

  const handleRedeem = async () => {
    if (await redeem(redeemSharesAmount)) {
      setRedeemSharesAmount("");
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-primary to-primary-light px-8 py-10 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
          Vault Details
        </p>

        <h1 className="mt-4 text-3xl font-semibold leading-tight lg:text-4xl">
          Review vault state, user position and asset-level operations.
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-50 lg:text-base">
          Vault activity is tied to guardian-linked infrastructure, protocol
          controls and strategy execution safety checks.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CopyableAddressCard label="Vault Address" value={vault.address} />
          <HeroMetric label="Asset" value={vault.asset} />
          <CopyableAddressCard label="Guardian" value={vault.guardian} />
          <HeroMetric label="Status" value={vault.status} />
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Registered At"
          value={vault.registeredAt}
          subtitle="Vault registration reference date"
          icon={<Vault className="h-5 w-5" />}
        />
        <MetricCard
          title="Decimals"
          value={String(vault.decimals)}
          subtitle="Underlying asset precision"
          icon={<WalletCards className="h-5 w-5" />}
        />
        <MetricCard
          title="Deposits"
          value={depositsStatusLabel}
          subtitle={depositControlsDescription}
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <MetricCard
          title="Strategy Execution"
          value={strategyExecutionLabel}
          subtitle={strategyExecutionDescription}
          icon={<Zap className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <div className="card">
          <div className="card-header">Vault Summary</div>

          <div className="card-content grid gap-4 sm:grid-cols-2">
            <SummaryStat
              label="Vault Total Assets"
              value={vault.totalAssets}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-header">My Position</div>

          <div className="card-content grid gap-4 sm:grid-cols-2">
            <SummaryStat
              label="My Deposited Assets"
              value={position.depositedAssets}
            />
            <SummaryStat label="Minted Shares" value={position.mintedShares} />
            <SummaryStat
              label="Withdrawable Assets"
              value={position.withdrawableAssets}
            />
            <SummaryStat
              label="Redeemable Shares"
              value={position.redeemableShares}
            />
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">Vault Metadata</div>

        <div className="card-content space-y-4">
          <MetaRow
            label="Vault Address"
            value={formatAddress(vault.address)}
            copyValue={vault.address}
          />
          <MetaRow label="Underlying Asset" value={vault.asset} />
          <MetaRow
            label="Guardian"
            value={formatAddress(vault.guardian)}
            copyValue={vault.guardian}
          />
          <MetaRow label="Registered At" value={vault.registeredAt} />
          <MetaRow label="Status" value={vault.status} />
          <MetaRow label="Decimals" value={String(vault.decimals)} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <div className="card">
          <div className="card-header">Deposit & Mint</div>

          <div className="card-content space-y-5">
            <ActionField
              label="Deposit Assets"
              placeholder={`Enter ${vault.asset} amount`}
              value={depositAmount}
              onChange={setDepositAmount}
              error={depositAmountError}
              inputMode="decimal"
            />
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>Your balance</span>
              <span>{depositAssetBalance}</span>
            </div>
            <button
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canDeposit || isSubmitting}
              onClick={() => void handleDeposit()}
            >
              Deposit Assets
            </button>

            <ActionField
              label="Mint Shares"
              placeholder="Enter share amount"
              value={mintSharesAmount}
              onChange={setMintSharesAmount}
              error={mintSharesAmountError}
              inputMode="decimal"
            />
            <button
              className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canMint || isSubmitting}
              onClick={() => void handleMint()}
            >
              Mint Shares
            </button>
            {/* TODO: deshabilitar además por wallet/session si aplica */}
          </div>
        </div>

        <div className="card">
          <div className="card-header">Withdraw & Redeem</div>

          <div className="card-content space-y-5">
            <ActionField
              label="Withdraw Assets"
              placeholder={`Enter ${vault.asset} amount`}
              value={withdrawAmount}
              onChange={setWithdrawAmount}
              error={withdrawAmountError}
              inputMode="decimal"
            />
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>Your balance</span>
              <span>{depositAssetBalance}</span>
            </div>
            <button
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canWithdraw || isSubmitting}
              onClick={() => void handleWithdraw()}
            >
              Withdraw Assets
            </button>

            <ActionField
              label="Redeem Shares"
              placeholder="Enter share amount"
              value={redeemSharesAmount}
              onChange={setRedeemSharesAmount}
              error={redeemSharesAmountError}
              inputMode="decimal"
            />
            <button
              className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canRedeem || isSubmitting}
              onClick={() => void handleRedeem()}
            >
              Redeem Shares
            </button>
          </div>
        </div>
      </section>

      {canShowGuardianOperations ? (
        <section className="card">
          <div className="card-header">Guardian Operations</div>

          <div className="card-content space-y-4">
            <p className="text-sm leading-7 text-text-secondary">
              Guardian-linked execution remains subject to protocol controls,
              vault status and risk monitoring.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <SummaryStat
                label="Total Allocation"
                value={`${strategyAllocationTotal}%`}
              />
              <SummaryStat
                label="Configured Adapters"
                value={String(strategyRouterAdapters.length)}
              />
            </div>

            <div className="rounded-2xl border border-border bg-gray-50 px-4 py-4">
              <p className="text-sm font-medium text-text-primary">
                Adapters configured in StrategyRouter
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {strategyRouterAdapters.length > 0 ? (
                  strategyRouterAdapters.map((adapter) => (
                    <div
                      key={adapter}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-text-secondary"
                    >
                      <span>{formatAddress(adapter)}</span>
                      <button
                        type="button"
                        onClick={() => void handleCopyAdapter(adapter)}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-gray-50 px-2 py-1 text-[11px] font-medium text-text-secondary transition hover:bg-gray-100"
                        aria-label={`Copy adapter address ${adapter}`}
                      >
                        {copiedAdapter === adapter ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-secondary">
                    No adapters are currently enabled in StrategyRouter.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border">
              <div className="grid gap-3 border-b border-border bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary md:grid-cols-[minmax(0,1.6fr),minmax(0,0.7fr),auto]">
                <span>Adapter</span>
                <span>Allocation %</span>
                <span className="text-right">Action</span>
              </div>

              <div className="divide-y divide-border">
                {strategyAllocations.map((row, index) => {
                  const rowStatus = strategyAllocationStatuses[index];

                  return (
                    <div
                      key={row.id}
                      className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.6fr),minmax(0,0.7fr),auto] md:items-start"
                    >
                      <div>
                        <label className="text-sm text-text-secondary">
                          Adapter
                        </label>
                        <input
                          type="text"
                          value={row.adapter}
                          onChange={(event) =>
                            handleUpdateStrategyRow(
                              index,
                              "adapter",
                              event.target.value,
                            )
                          }
                          placeholder="Enter adapter address"
                          className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm"
                        />
                        {rowStatus?.error ? (
                          <p className="mt-2 text-sm text-danger">
                            {rowStatus.error}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <label className="text-sm text-text-secondary">
                          Allocation %
                        </label>
                        <input
                          type="text"
                          value={row.percentage}
                          onChange={(event) =>
                            handleUpdateStrategyRow(
                              index,
                              "percentage",
                              event.target.value.replace(/[^0-9]/g, ""),
                            )
                          }
                          placeholder="0"
                          inputMode="numeric"
                          className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm"
                        />
                      </div>

                      <div className="flex md:justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveStrategyRow(index)}
                          disabled={strategyAllocations.length === 1}
                          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-3 text-sm font-medium text-text-secondary transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleAddStrategyRow}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-primary transition hover:bg-gray-100"
              >
                <Plus className="h-4 w-4" />
                Add adapter
              </button>

              <p className="text-sm text-text-secondary">
                Allocation total: {strategyAllocationTotal}% of 100%
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-gray-50 px-4 py-4">
              <p className="text-sm font-medium text-text-primary">
                Strategy Execution
              </p>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                {strategyExecutionMessage ??
                  "Execution is enabled at vault level, and the selected allocation will be routed across the configured adapters when you proceed."}
              </p>
            </div>

            <button
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canExecuteStrategy}
              onClick={() => void executeStrategy()}
            >
              Execute Strategy
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

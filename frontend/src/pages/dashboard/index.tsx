import { Building2, Coins, Landmark, Users } from "lucide-react";
import { useDashboardModel } from "@/hooks/useDashboardModel";
import { MetricCard, QuickAction } from "@/components/shared";
import {
  StatusRow,
  OverviewRow,
  ActivityItem,
  MiniStat,
  QuickActionButton,
} from "./components";
import { useGovernanceModel } from "@/hooks/useGovernanceModel";
import { useTreasuryModel } from "@/hooks/useTreasuryModel";
import {
  formatBondingStatus,
  formatEnabledStatus,
  formatExecutionStatus,
} from "./formatters";

export default function DashboardPage() {
  const { metrics, status, activity, capabilities } = useDashboardModel();
  const { config } = useGovernanceModel();
  const { metrics: treasuryMetrics } = useTreasuryModel();

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary-light text-white shadow-card">
        <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.4fr,0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">
              J&amp;Y Protocol
            </p>

            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight lg:text-4xl">
              Institutional DeFi infrastructure for governed treasury
              operations, guardian-led vault deployment and risk-aware
              execution.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/95 lg:text-base">
              A unified operating environment for capital formation, governance
              control, treasury visibility and vault lifecycle management.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <QuickActionButton
                label="Explore Vaults"
                disabled={false}
                to="/vaults"
              />
              <QuickActionButton
                label="Review Governance"
                disabled={false}
                to="/governance"
              />
              {capabilities.canApplyAsGuardian ? (
                <QuickActionButton
                  label="Apply as Guardian"
                  disabled={false}
                  to="/guardians"
                />
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl bg-white/12 p-6 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
              Protocol Status
            </p>

            <div className="mt-5 space-y-4">
              <StatusRow
                label="Network"
                value={status.network}
                tone="neutral"
              />
              <StatusRow
                label="Bonding"
                value={formatBondingStatus(status.bonding)}
                tone={status.bonding === "active" ? "success" : "warning"}
              />
              <StatusRow
                label="Vault Creation"
                value={formatEnabledStatus(status.vaultCreation)}
                tone={status.vaultCreation === "enabled" ? "success" : "danger"}
              />
              <StatusRow
                label="Vault Deposits"
                value={formatEnabledStatus(status.deposits)}
                tone={status.deposits === "enabled" ? "success" : "danger"}
              />
              <StatusRow
                label="Execution Engine"
                value={formatExecutionStatus(status.execution)}
                tone={status.execution === "monitoring" ? "warning" : "danger"}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Vault Count"
          value={String(metrics.totalVaults)}
          subtitle="Across active and tracked protocol vaults"
          icon={<Building2 className="h-5 w-5" />}
        />
        <MetricCard
          title="Treasury Snapshot"
          value={metrics.treasuryValue}
          subtitle="Tracked ERC20 treasury visibility"
          icon={<Landmark className="h-5 w-5" />}
        />
        <MetricCard
          title="Proposal Threshold"
          value={metrics.proposalThreshold}
          subtitle="Minimum governance threshold reference"
          icon={<Coins className="h-5 w-5" />}
        />
        <MetricCard
          title="Guardian Network"
          value={String(metrics.guardianCount)}
          subtitle="Active guardian participants"
          icon={<Users className="h-5 w-5" />}
        />
      </section>

      {/* TODO: Pending Protocol Overview:  */}
      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="card">
          <div className="card-header">Protocol Overview</div>

          <div className="card-content space-y-4">
            <OverviewRow
              title="Bonding Program"
              description="Governance token acquisition program status"
              status={formatBondingStatus(status.bonding)}
              tone={status.bonding === "active" ? "success" : "warning"}
            />
            <OverviewRow
              title="Governance Layer"
              description="Proposal threshold, timing and execution controls"
              status="Operational"
              tone="success"
            />
            <OverviewRow
              title="Vault Infrastructure"
              description="Vault registration and guardian-linked deployment"
              status={
                status.vaultCreation === "enabled" ? "Healthy" : "Restricted"
              }
              tone={status.vaultCreation === "enabled" ? "success" : "warning"}
            />
            <OverviewRow
              title="Treasury Layer"
              description="Reserve visibility and controlled withdrawals"
              status="Active"
              tone="success"
            />
            <OverviewRow
              title="Guardian Network"
              description="Bonded operator lifecycle and application flow"
              status="Monitoring"
              tone="success"
            />
            <OverviewRow
              title="Risk Monitoring"
              description="Execution safety and asset validation checks"
              status={formatExecutionStatus(status.execution)}
              tone="success"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">Recent Protocol Activity</div>

            <div className="card-content space-y-3">
              {activity.map((item) => (
                <ActivityItem
                  key={item.id}
                  title={item.title}
                  subtitle={item.description}
                />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">Quick Actions</div>

            <div className="card-content grid gap-3">
              <QuickAction
                title="Buy Governance Tokens"
                description="Open the bonding program and review supported assets."
                to="/bonding"
              />
              <QuickAction
                title="Create Proposal"
                description="Review governance thresholds and submit a new proposal."
                to="/governance/create"
              />
              <QuickAction
                title="Open Vault Explorer"
                description="Browse vault infrastructure and view asset coverage."
                to="/vaults"
              />
              <QuickAction
                title="Review Treasury"
                description="Inspect balances and treasury composition."
                to="/treasury"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">Governance Snapshot</div>
          <div className="card-content grid gap-4 sm:grid-cols-2">
            <MiniStat label="Voting Delay" value={config.votingDelay} />
            <MiniStat label="Voting Period" value={config.votingPeriod} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">Treasury Snapshot</div>
          <div className="card-content grid gap-4 sm:grid-cols-2">
            <MiniStat
              label="Tracked ERC20"
              value={String(treasuryMetrics.trackedErc20Assets)}
            />
            <MiniStat
              label="Liquidity"
              value={treasuryMetrics.operationalLiquidity}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

import { Coins, Landmark, PieChart } from "lucide-react";
import { useTreasuryModel } from "@/hooks/useTreasuryModel";
import { EmptyState, HeroMetric, MetricCard, NoteRow } from "@/components/shared";
import { CategoryBadge, VisibilityBadge, MiniSummaryCard } from "./components";

export default function TreasuryPage() {
  const { assets, metrics } = useTreasuryModel();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-primary to-primary-light px-8 py-10 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
          Treasury Layer
        </p>

        <h1 className="mt-4 text-3xl font-semibold leading-tight lg:text-4xl">
          Monitor treasury balances, protocol reserves and asset composition
          across tracked ERC20 holdings.
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-50 lg:text-base">
          Treasury visibility supports governance, operational awareness and
          controlled withdrawal flows under explicit protocol permissions.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <HeroMetric
            label="Tracked ERC20 Assets"
            value={String(metrics.trackedErc20Assets)}
          />
          <HeroMetric
            label="DAO Asset Coverage"
            value={metrics.daoAssetExposure}
          />
          <HeroMetric
            label="Native Reserve"
            value={metrics.nativeReserve}
          />
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Treasury Visibility"
          value={metrics.operationalLiquidity === "Tracked" ? "Live" : "Unavailable"}
          subtitle="Treasury balances are surfaced through overview-level reads."
          icon={<Landmark className="h-5 w-5" />}
        />
        <MetricCard
          title="ERC20 Composition"
          value={`${metrics.trackedErc20Assets} tokens`}
          subtitle="Supported bonding assets are read directly from the Treasury contract."
          icon={<Coins className="h-5 w-5" />}
        />
        <MetricCard
          title="Treasury Composition"
          value={metrics.operationalLiquidity === "Tracked" ? "Tracked" : "Empty"}
          subtitle="Asset allocation now reflects the supported genesis token set."
          icon={<PieChart className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr] xl:items-stretch">
        <div className="card flex h-[32rem] flex-col">
          <div className="card-header">Asset Allocation</div>

          <div className="flex-1 overflow-y-auto overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                    Token
                  </th>
                  <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                    Type
                  </th>
                  <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                    Balance
                  </th>
                  <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                    Category
                  </th>
                  <th className="sticky top-0 z-10 bg-gray-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                    Visibility
                  </th>
                </tr>
              </thead>

              <tbody>
                {assets.length > 0 ? (
                  assets.map((asset) => (
                    <tr
                      key={`${asset.token}-${asset.type}`}
                      className="border-b border-border"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-text-primary">
                        {asset.token}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {asset.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {asset.balance}
                      </td>
                      <td className="px-6 py-4">
                        <CategoryBadge category={asset.category} />
                      </td>
                      <td className="px-6 py-4">
                        <VisibilityBadge value={asset.visibility} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10">
                      <EmptyState
                        title="No treasury assets available"
                        description="Treasury does not expose any tracked ERC20 balances for the current network configuration."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="h-[32rem]">
          <div className="card flex h-full flex-col">
            <div className="card-header">Treasury Notes</div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <NoteRow
                title="DAO Asset Controls"
                description="DAO-classified assets use withdrawDaoERC20(...) and require the treasury admin role."
              />
              <NoteRow
                title="Live Asset Source"
                description="The treasury view now reflects protocol-supported assets instead of a static mock list."
              />
              <NoteRow
                title="Native Treasury Balance"
                description="Native balance is surfaced via nativeBalance() and exposed in the treasury summary cards."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <MiniSummaryCard
          title="Tracked ERC20 Assets"
          value={`${metrics.trackedErc20Assets} Assets`}
          subtitle="Protocol-supported balances are classified and surfaced"
        />
        <MiniSummaryCard
          title="Native Reserve"
          value={metrics.nativeReserve}
          subtitle="Treasury native balance is read directly from the contract"
        />
        <MiniSummaryCard
          title="Asset Category Model"
          value={metrics.daoAssetExposure}
          subtitle="Classification is derived from getSupportedGenesisTokens()"
        />
      </section>
    </div>
  );
}

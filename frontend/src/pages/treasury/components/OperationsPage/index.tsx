import { AlertTriangle, Landmark } from "lucide-react";
import { useTreasuryOperationsModel } from "@/hooks/useTreasuryOperationsModel";
import { HeroMetric, InfoRow } from "@/components/shared";

export default function TreasuryOperationsPage() {
  const {
    tokens,
    tokenAddress,
    setTokenAddress,
    selectedToken,
    amount,
    setAmount,
    recipient,
    setRecipient,
    isAmountValid,
    isRecipientValid,
    canExecute,
    isSubmitting,
    capabilities,
    executeWithdrawal,
  } = useTreasuryOperationsModel();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-primary to-primary-light px-8 py-10 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
          Treasury Operations
        </p>

        <h1 className="mt-4 text-3xl font-semibold leading-tight lg:text-4xl">
          Execute restricted treasury withdrawals through controlled operational flows.
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-50 lg:text-base">
          Treasury withdrawals must remain separated by asset category and governed
          by explicit protocol permissions and treasury classification rules.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <HeroMetric label="Access" value={capabilities.canOpenTreasuryOperations ? "Enabled" : "Restricted"} />
          <HeroMetric label="Selected Token" value={selectedToken?.symbol ?? "—"} />
          <HeroMetric label="Token Category" value={selectedToken?.category ?? "—"} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,0.9fr]">
        <div className="card">
          <div className="card-header">Withdrawal Form</div>

          <div className="card-content space-y-5">
            <div>
              <label className="text-sm text-text-secondary">Token Address</label>
              <input
                type="text"
                list="treasury-token-options"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="0x..."
                className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm"
              />
              <datalist id="treasury-token-options">
                {tokens.map((token) => (
                  <option
                    key={token.address}
                    value={token.address}
                    label={`${token.symbol} — ${token.category}`}
                  >
                    {token.symbol} — {token.category}
                  </option>
                ))}
              </datalist>
              <p className="mt-2 text-xs leading-6 text-text-secondary">
                You can paste any ERC20 address. Known treasury assets are suggested
                below, and the category is resolved from protocol support rules.
              </p>
            </div>

            <div>
              <label className="text-sm text-text-secondary">Amount</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter withdrawal amount"
                className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm"
              />
              {!isAmountValid && amount.trim() !== "" ? (
                <p className="mt-2 text-sm text-danger">
                  Enter a numeric amount greater than 0.
                </p>
              ) : null}
            </div>

            <div>
              <label className="text-sm text-text-secondary">Recipient</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm"
              />
              {!isRecipientValid && recipient.trim() !== "" ? (
                <p className="mt-2 text-sm text-danger">
                  Enter a valid recipient address.
                </p>
              ) : null}
            </div>

            <button
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canExecute}
              onClick={executeWithdrawal}
            >
              {isSubmitting ? "Processing Withdrawal..." : "Execute Withdrawal"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">Operation Summary</div>

            <div className="card-content space-y-4">
              <InfoRow label="Token Address" value={tokenAddress || "—"} />
              <InfoRow label="Selected Token" value={selectedToken?.symbol ?? "—"} />
              <InfoRow label="Category" value={selectedToken?.category ?? "—"} />
              <InfoRow label="Amount" value={amount || "—"} />
              <InfoRow label="Recipient" value={recipient || "—"} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">Operational Notes</div>

            <div className="card-content space-y-4">
              <div className="rounded-2xl border border-border bg-yellow-50 px-4 py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-700" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      DAO Asset Withdrawals
                    </p>
                    <p className="mt-1 text-sm leading-6 text-yellow-700">
                      You can paste any ERC20 address, but direct execution is
                      only enabled for DAO-classified assets in this MVP.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-gray-50 px-4 py-4">
                <div className="flex items-start gap-3">
                  <Landmark className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Permission Model
                    </p>
                    <p className="mt-1 text-sm leading-6 text-text-secondary">
                      Treasury operations must remain controlled by derived capabilities,
                      not by UI-level hardcoded role assumptions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

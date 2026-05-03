import { Vote } from "lucide-react";
import { useProposalComposerModel } from "@/hooks/useProposalComposerModel";

export default function DelegateVotingPowerCard() {
  const {
    delegateAddress,
    setDelegateAddress,
    delegateAddressError,
    delegateStatusMessage,
    canDelegateVotes,
    isDelegatingVotes,
    delegateVotes,
  } = useProposalComposerModel();

  return (
    <div className="card">
      <div className="card-header">Delegate Voting Power</div>

      <div className="card-content space-y-4">
        <div>
          <label className="text-sm text-text-secondary">
            Delegate Address
          </label>
          <input
            type="text"
            value={delegateAddress}
            onChange={(event) => setDelegateAddress(event.target.value)}
            placeholder="0x..."
            disabled={isDelegatingVotes}
            className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm"
          />
          {delegateAddressError ? (
            <p className="mt-2 text-sm text-danger">{delegateAddressError}</p>
          ) : null}
          {delegateStatusMessage ? (
            <div className="mt-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm font-medium text-green-800">
                {delegateStatusMessage}
              </p>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="btn-secondary inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canDelegateVotes}
          onClick={delegateVotes}
        >
          <Vote className="h-4 w-4" />
          {isDelegatingVotes ? "Delegating..." : "Delegate Votes"}
        </button>
      </div>
    </div>
  );
}

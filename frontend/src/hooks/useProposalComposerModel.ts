import { useState } from "react";
import { useConnection } from "wagmi";
import type { Address } from "viem";
import Swal from "sweetalert2";
import type {
  ProposalComposerModel,
} from "@/types/models/proposalComposer";
import { useProtocolCapabilities } from "./useProtocolCapabilities";
import { getTransactionError, isValidAddress } from "@/utils";
import useWriteContracts from "./useWriteContracts";
import {
  createEmptyProposalAction,
  isValidProposalCalldata,
  isValidProposalExecutionValue,
} from "./shared/proposalComposer";

export function useProposalComposerModel(): ProposalComposerModel {
  const capabilities = useProtocolCapabilities();
  const connection = useConnection();
  const { executeWrite } = useWriteContracts();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actions, setActions] = useState([createEmptyProposalAction()]);
  const [delegateAddress, setDelegateAddress] = useState("");

  const [isSubmitting] = useState(false);
  const [isDelegatingVotes, setIsDelegatingVotes] = useState(false);

  const votingPower = "0 GOV";
  const proposalThreshold = "4%";
  const meetsThreshold = capabilities.canCreateProposal;
  const normalizedDelegateAddress = delegateAddress.trim();
  const isDelegateAddressValid =
    normalizedDelegateAddress !== "" &&
    isValidAddress(normalizedDelegateAddress);
  const delegateAddressError =
    normalizedDelegateAddress !== "" && !isDelegateAddressValid
      ? "Enter a valid delegate address."
      : undefined;
  const canDelegateVotes =
    Boolean(connection.address) &&
    isDelegateAddressValid &&
    !isDelegatingVotes;
  const isTitleValid = title.trim().length >= 5;
  const isDescriptionValid = description.trim().length >= 10;
  const areActionsValid = actions.every((action) => {
    return (
      isValidAddress(action.target.trim()) &&
      isValidProposalExecutionValue(action.value) &&
      isValidProposalCalldata(action.calldata)
    );
  });
  const canSubmitProposal =
    capabilities.canCreateProposal &&
    isTitleValid &&
    isDescriptionValid &&
    actions.length > 0 &&
    areActionsValid &&
    !isSubmitting;

  const addAction = () => {
    setActions((prev) => [...prev, createEmptyProposalAction()]);
  };

  const updateAction = (
    id: string,
    field: "target" | "value" | "calldata",
    value: string,
  ) => {
    setActions((prev) =>
      prev.map((action) =>
        action.id === id ? { ...action, [field]: value } : action
      )
    );
  };

  const removeAction = (id: string) => {
    setActions((prev) => prev.filter((action) => action.id !== id));
  };

  const delegateVotes = async () => {
    if (!canDelegateVotes) {
      return;
    }

    setIsDelegatingVotes(true);

    Swal.fire({
      title: "Delegating voting power",
      text: "Confirm the delegation transaction in your wallet.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await executeWrite({
        functionContract: "getGovernanceTokenContract",
        functionName: "delegate",
        args: [normalizedDelegateAddress as Address],
        options: {
          waitForReceipt: true,
        },
      });

      if (response?.receipt?.status !== "success") {
        throw new Error("Vote delegation failed.");
      }

      setDelegateAddress("");
      Swal.close();

      await Swal.fire({
        title: "Votes delegated",
        text: "Your governance voting power delegation was updated successfully.",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (error) {
      const transactionError = getTransactionError(error);

      Swal.hideLoading();
      Swal.update({
        title: transactionError.title,
        text: transactionError.message,
        icon: "error",
        showConfirmButton: true,
        confirmButtonText: "OK",
        allowOutsideClick: true,
        allowEscapeKey: true,
      });
    } finally {
      setIsDelegatingVotes(false);
    }
  };

  // TODO:
  // proposalThreshold -> DaoGovernor.proposalThreshold()
  // votingPower -> Governance token / IVotes.getVotes(user, blockNumber)
  // meetsThreshold -> comparación real votingPower >= proposalThreshold
  //
  // submit final:
  // targets = actions.map(a => a.target)
  // values = actions.map(a => a.value)
  // calldatas = actions.map(a => a.calldata)
  // description = texto final de propuesta
  //
  // write:
  // DaoGovernor.propose(targets, values, calldatas, description)
  //
  // agregar validaciones reales:
  // - target address válido
  // - calldata válido
  // - arrays no vacíos
  // - description obligatoria

  return {
    title,
    setTitle,
    description,
    setDescription,
    actions,
    addAction,
    updateAction,
    removeAction,
    votingPower,
    proposalThreshold,
    meetsThreshold,
    delegateAddress,
    setDelegateAddress,
    delegateAddressError,
    canDelegateVotes,
    isDelegatingVotes,
    delegateVotes,
    canSubmitProposal,
    isSubmitting,
    capabilities,
  };
}

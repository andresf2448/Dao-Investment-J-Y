import { BaseError } from "viem";

export type TransactionErrorCode =
  | "user_rejected"
  | "insufficient_funds"
  | "wrong_network"
  | "contract_revert"
  | "unknown";

export type TransactionErrorDisplay = {
  title: string;
  message: string;
  technicalDetails?: string;
  code: TransactionErrorCode;
};

const FALLBACK_TRANSACTION_ERROR: TransactionErrorDisplay = {
  title: "Transaction failed",
  message: "The transaction could not be completed. Please try again.",
  code: "unknown",
};

function getRawErrorMessages(error: unknown): string[] {
  if (error instanceof BaseError) {
    const messages = [
      error.shortMessage,
      error.details,
      error.message,
    ];

    return messages.filter(
      (message): message is string => Boolean(message && message.trim()),
    );
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return [error.message];
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return [error];
  }

  return [];
}

function normalizeMessage(message: string): string {
  return message.trim().toLowerCase();
}

function getTechnicalDetails(error: unknown, rawMessages: string[]): string | undefined {
  const primaryDetail = rawMessages.find((message) => message.trim().length > 0);

  if (primaryDetail) {
    return primaryDetail;
  }

  if (error instanceof Error && error.stack?.trim()) {
    return error.stack;
  }

  return undefined;
}

function hasAnyPattern(message: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => message.includes(pattern));
}

function matchProtocolRevert(rawMessages: string[]): TransactionErrorDisplay | undefined {
  const normalizedMessages = rawMessages.map(normalizeMessage);

  if (
    normalizedMessages.some((message) =>
      hasAnyPattern(message, [
        "genesisbonding__alreadyfinalized",
        "already finalized",
      ]),
    )
  ) {
    return {
      title: "Bonding closed",
      message: "Bonding has already been finalized and no longer accepts purchases.",
      code: "contract_revert",
    };
  }

  if (
    normalizedMessages.some((message) =>
      hasAnyPattern(message, [
        "genesisbonding__invalidtoken",
        "invalid token",
      ]),
    )
  ) {
    return {
      title: "Unsupported token",
      message: "This token is not supported for the requested bonding purchase.",
      code: "contract_revert",
    };
  }

  if (
    normalizedMessages.some((message) =>
      hasAnyPattern(message, [
        "erc20insufficientallowance",
        "insufficient allowance",
      ]),
    )
  ) {
    return {
      title: "Approval required",
      message: "The token approval is too low for this transaction. Approve the required amount and try again.",
      code: "contract_revert",
    };
  }

  if (
    normalizedMessages.some((message) =>
      hasAnyPattern(message, [
        "erc20insufficientbalance",
        "guardianbondescrow__insufficientbond",
      ]),
    )
  ) {
    return {
      title: "Insufficient funds",
      message: "Your available token balance is too low to complete this transaction.",
      code: "insufficient_funds",
    };
  }

  if (
    normalizedMessages.some((message) =>
      hasAnyPattern(message, [
        "guardianadministrator__alreadyapplied",
      ]),
    )
  ) {
    return {
      title: "Application already submitted",
      message: "You already have a guardian application in progress or an active guardian record.",
      code: "contract_revert",
    };
  }

  if (
    normalizedMessages.some((message) =>
      hasAnyPattern(message, [
        "commonerrors.zeroamount",
        "zero amount",
      ]),
    )
  ) {
    return {
      title: "Invalid amount",
      message: "Enter an amount greater than zero before submitting the transaction.",
      code: "contract_revert",
    };
  }

  if (
    normalizedMessages.some((message) =>
      hasAnyPattern(message, [
        "commonerrors.zeroaddress",
        "zero address",
      ]),
    )
  ) {
    return {
      title: "Invalid address",
      message: "The transaction could not be prepared because one of the required addresses is invalid.",
      code: "contract_revert",
    };
  }

  return undefined;
}

export function getTransactionError(error: unknown): TransactionErrorDisplay {
  const rawMessages = getRawErrorMessages(error);
  const normalizedMessages = rawMessages.map(normalizeMessage);
  const technicalDetails = getTechnicalDetails(error, rawMessages);

  if (
    normalizedMessages.some((message) =>
      hasAnyPattern(message, [
        "user rejected the request",
        "user rejected",
        "user denied transaction signature",
        "rejected the request",
        "denied transaction signature",
      ]),
    ) ||
    (typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === 4001)
  ) {
    return {
      title: "Transaction cancelled",
      message: "You cancelled the transaction in your wallet.",
      technicalDetails,
      code: "user_rejected",
    };
  }

  if (
    normalizedMessages.some((message) =>
      hasAnyPattern(message, [
        "insufficient funds",
        "insufficient balance",
        "exceeds balance",
        "exceeds the balance",
        "funds for gas",
      ]),
    )
  ) {
    return {
      title: "Insufficient funds",
      message: "You do not have enough balance to cover this transaction and its gas costs.",
      technicalDetails,
      code: "insufficient_funds",
    };
  }

  if (
    normalizedMessages.some((message) =>
      hasAnyPattern(message, [
        "chain mismatch",
        "chain changed",
        "network changed",
        "wrong network",
        "switch to chain",
        "does not match the target chain",
      ]),
    )
  ) {
    return {
      title: "Wrong network",
      message: "Your wallet is connected to the wrong network for this transaction.",
      technicalDetails,
      code: "wrong_network",
    };
  }

  const protocolRevert = matchProtocolRevert(rawMessages);
  if (protocolRevert) {
    return {
      ...protocolRevert,
      technicalDetails,
    };
  }

  if (
    normalizedMessages.some((message) =>
      hasAnyPattern(message, [
        "execution reverted",
        "reverted",
        "revert",
        "transaction failed",
      ]),
    )
  ) {
    return {
      title: "Transaction failed",
      message: "The transaction was rejected by the contract and could not be completed.",
      technicalDetails,
      code: "contract_revert",
    };
  }

  return {
    ...FALLBACK_TRANSACTION_ERROR,
    technicalDetails,
  };
}

export function getTransactionErrorMessage(error: unknown): string {
  return getTransactionError(error).message;
}

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

const ERC20_INSUFFICIENT_BALANCE_SELECTOR = "0xe450d38c";
const ERC20_INSUFFICIENT_ALLOWANCE_SELECTOR = "0xfb8f41b2";
const ERC20_INVALID_APPROVER_SELECTOR = "0xe602df05";
const ERC20_INVALID_SPENDER_SELECTOR = "0x94280d62";
const ERC20_INVALID_SENDER_SELECTOR = "0x96c6fd1e";
const ERC20_INVALID_RECEIVER_SELECTOR = "0xec442f05";

function collectErrorMessages(
  error: unknown,
  seen = new WeakSet<object>(),
): string[] {
  if (typeof error === "string") {
    return error.trim().length > 0 ? [error] : [];
  }

  if (!error || typeof error !== "object") {
    return [];
  }

  if (seen.has(error)) {
    return [];
  }

  seen.add(error);

  const messages: string[] = [];
  const cause = (error as { cause?: unknown }).cause;
  if (cause) {
    messages.push(...collectErrorMessages(cause, seen));
  }

  const candidates = [
    (error as { shortMessage?: unknown }).shortMessage,
    (error as { details?: unknown }).details,
    (error as { message?: unknown }).message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      messages.push(candidate);
    }
  }

  return messages;
}

function collectErrorNames(
  error: unknown,
  seen = new WeakSet<object>(),
): string[] {
  if (!error || typeof error !== "object") {
    return [];
  }

  if (seen.has(error)) {
    return [];
  }

  seen.add(error);

  const names = new Set<string>();
  const directName = (error as { errorName?: unknown }).errorName;

  if (typeof directName === "string" && directName.trim().length > 0) {
    names.add(directName.trim());
  }

  const directReason = (error as { reason?: unknown }).reason;
  if (typeof directReason === "string" && directReason.trim().length > 0) {
    names.add(directReason.trim());
  }

  const nestedData = (error as { data?: unknown }).data;
  if (nestedData && typeof nestedData === "object") {
    for (const name of collectErrorNames(nestedData, seen)) {
      names.add(name);
    }
  }

  const cause = (error as { cause?: unknown }).cause;
  if (cause) {
    for (const name of collectErrorNames(cause, seen)) {
      names.add(name);
    }
  }

  return [...names];
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

function isSimulationError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { phase?: unknown }).phase === "simulation"
  );
}

function hasAnyPattern(message: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => message.includes(pattern));
}

function extractCustomErrorSelectors(rawMessages: string[]): string[] {
  const selectors = new Set<string>();

  for (const message of rawMessages) {
    const matches = message.match(/0x[a-f0-9]{8}/gi);

    if (!matches) {
      continue;
    }

    for (const match of matches) {
      selectors.add(match.toLowerCase());
    }
  }

  return [...selectors];
}

function matchKnownCustomErrors(
  rawMessages: string[],
): TransactionErrorDisplay | undefined {
  const selectors = extractCustomErrorSelectors(rawMessages);

  if (selectors.includes(ERC20_INSUFFICIENT_BALANCE_SELECTOR)) {
    return {
      title: "Insufficient token balance",
      message:
        "Your wallet does not hold enough of the selected token to complete this transaction. Reduce the amount or add more tokens, then try again.",
      code: "insufficient_funds",
    };
  }

  if (selectors.includes(ERC20_INSUFFICIENT_ALLOWANCE_SELECTOR)) {
    return {
      title: "Approval required",
      message:
        "The approved allowance is too low for this transaction. Approve the required amount and try again.",
      code: "contract_revert",
    };
  }

  if (selectors.includes(ERC20_INVALID_APPROVER_SELECTOR)) {
    return {
      title: "Invalid approval address",
      message:
        "The wallet that is trying to approve the token is not valid for this contract interaction.",
      code: "contract_revert",
    };
  }

  if (selectors.includes(ERC20_INVALID_SPENDER_SELECTOR)) {
    return {
      title: "Invalid spender address",
      message:
        "The spender address used in the approval is not valid for this ERC20 token.",
      code: "contract_revert",
    };
  }

  if (selectors.includes(ERC20_INVALID_SENDER_SELECTOR)) {
    return {
      title: "Invalid sender address",
      message:
        "The sender address used in the token transfer is not valid.",
      code: "contract_revert",
    };
  }

  if (selectors.includes(ERC20_INVALID_RECEIVER_SELECTOR)) {
    return {
      title: "Invalid recipient address",
      message:
        "The recipient address used in the token transfer is not valid.",
      code: "contract_revert",
    };
  }

  return undefined;
}

function matchKnownContractErrorNames(
  errorNames: string[],
): TransactionErrorDisplay | undefined {
  const normalizedNames = errorNames.map(normalizeMessage);

  if (
    normalizedNames.some((name) =>
      hasAnyPattern(name, [
        "genesisbonding__alreadyfinalized",
        "alreadyfinalized",
      ]),
    )
  ) {
    return {
      title: "Bonding closed",
      message:
        "Bonding has already been finalized and no longer accepts purchases.",
      code: "contract_revert",
    };
  }

  if (
    normalizedNames.some((name) =>
      hasAnyPattern(name, [
        "genesisbonding__invalidtoken",
        "invalidtoken",
      ]),
    )
  ) {
    return {
      title: "Unsupported token",
      message:
        "This token is not supported for bonding on the current network.",
      code: "contract_revert",
    };
  }

  if (
    normalizedNames.some((name) =>
      hasAnyPattern(name, [
        "commonerrors.zeroamount",
        "zeroamount",
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
    normalizedNames.some((name) =>
      hasAnyPattern(name, [
        "commonerrors.zeroaddress",
        "zeroaddress",
      ]),
    )
  ) {
    return {
      title: "Invalid address",
      message:
        "One of the required addresses is invalid or missing. Check the token and contract configuration.",
      code: "contract_revert",
    };
  }

  if (
    normalizedNames.some((name) =>
      hasAnyPattern(name, [
        "erc20insufficientallowance",
        "insufficientallowance",
      ]),
    )
  ) {
    return {
      title: "Approval required",
      message:
        "The approved allowance is too low for this transaction. Approve the required amount and try again.",
      code: "contract_revert",
    };
  }

  if (
    normalizedNames.some((name) =>
      hasAnyPattern(name, [
        "erc20insufficientbalance",
        "insufficientbalance",
      ]),
    )
  ) {
    return {
      title: "Insufficient token balance",
      message:
        "Your wallet does not have enough of the selected token to complete this transaction. Reduce the amount or add more tokens, then try again.",
      code: "insufficient_funds",
    };
  }

  if (
    normalizedNames.some((name) =>
      hasAnyPattern(name, [
        "guardianbondescrow__insufficientbond",
      ]),
    )
  ) {
    return {
      title: "Insufficient bond",
      message:
        "The guardian bond is below the required amount for this operation.",
      code: "contract_revert",
    };
  }

  if (
    normalizedNames.some((name) =>
      hasAnyPattern(name, [
        "guardianadministrator__alreadyapplied",
      ]),
    )
  ) {
    return {
      title: "Application already submitted",
      message:
        "You already have a guardian application in progress or an active guardian record.",
      code: "contract_revert",
    };
  }

  return undefined;
}

function matchProtocolRevert(
  rawMessages: string[],
  errorNames: string[],
): TransactionErrorDisplay | undefined {
  const normalizedMessages = rawMessages.map(normalizeMessage);

  const decodedError = matchKnownContractErrorNames(errorNames);
  if (decodedError) {
    return decodedError;
  }

  const customError = matchKnownCustomErrors(rawMessages);
  if (customError) {
    return customError;
  }

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
      title: "Insufficient token balance",
      message:
        "Your wallet does not have enough of the selected token to complete this transaction. Reduce the amount or add more tokens, then try again.",
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
  const rawMessages = collectErrorMessages(error);
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

  const errorNames = collectErrorNames(error);
  const protocolRevert = matchProtocolRevert(rawMessages, errorNames);
  if (protocolRevert) {
    return {
      ...protocolRevert,
      technicalDetails,
    };
  }

  if (isSimulationError(error)) {
    return {
      title: "Transaction rejected",
      message:
        "The contract rejected this request. Review the token, amount, and approvals, then try again.",
      technicalDetails,
      code: "contract_revert",
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

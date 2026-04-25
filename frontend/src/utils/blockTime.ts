const AVERAGE_BLOCK_TIME_SECONDS_BY_CHAIN_ID: Record<number, number> = {
  1: 12,
  11155111: 12,
  31337: 2,
};

const blockDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function getAverageBlockTimeSeconds(chainId: number): number {
  return AVERAGE_BLOCK_TIME_SECONDS_BY_CHAIN_ID[chainId] ?? 12;
}

export function formatEstimatedBlockDate({
  targetBlock,
  currentBlock,
  chainId,
}: {
  targetBlock?: bigint;
  currentBlock?: bigint;
  chainId: number;
}): string {
  if (targetBlock == null) {
    return "Pending block";
  }

  if (currentBlock == null) {
    return `Block ${targetBlock.toString()}`;
  }

  const remainingBlocks = Number(targetBlock - currentBlock);
  const estimatedTimestamp =
    Date.now() + remainingBlocks * getAverageBlockTimeSeconds(chainId) * 1000;
  const estimatedDate = blockDateFormatter.format(new Date(estimatedTimestamp));

  return `${estimatedDate} · Block ${targetBlock.toString()}`;
}

export function truncateMiddle(
  value: string,
  startChars: number = 6,
  endChars: number = 4,
): string {
  if (!value) {
    return "—";
  }

  if (value.length <= startChars + endChars + 3) {
    return value;
  }

  return `${value.slice(0, startChars)}...${value.slice(-endChars)}`;
}

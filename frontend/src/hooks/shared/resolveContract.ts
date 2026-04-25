export function resolveOptionalContract<T>(
  chainId: number,
  getter: (chainId: number) => T,
): T | null {
  try {
    return getter(chainId);
  } catch {
    return null;
  }
}

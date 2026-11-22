export function movieReturnPath(value: string | null): string {
  if (!value || !/^\/movies(?:[/?#]|$)/.test(value)) return '/profile';
  const origin = 'https://streamfin.invalid';
  try {
    const result = new URL(value, origin);
    if (result.origin === origin && /^\/movies(?:\/|$)/.test(result.pathname)) {
      return result.pathname + result.search + result.hash;
    }
  } catch {
    /* Fall back to the profile after a malformed return URL. */
  }
  return '/profile';
}

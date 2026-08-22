export function generateRandomId(
  prefix: string,
  suffixLength: number,
  uppercase: boolean = false,
  timestamp: number = Date.now()
): string {
  const suffix = Math.random().toString(36).substring(2, 2 + suffixLength);
  const normalizedSuffix = uppercase ? suffix.toUpperCase() : suffix;
  return `${prefix}_${timestamp}_${normalizedSuffix}`;
}

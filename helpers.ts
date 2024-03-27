export function ensureNumber(value: unknown): number {
    if (typeof value === "number") {
      return value;
    } else if (typeof value === "string") {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    throw new TypeError("The provided value cannot be converted to a number.");
  }
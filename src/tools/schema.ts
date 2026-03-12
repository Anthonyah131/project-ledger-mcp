function emptyToUndefined(value: unknown): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

export function coerceOptionalString(value: unknown): unknown {
  const normalized = emptyToUndefined(value);
  if (typeof normalized === "string") {
    return normalized.trim();
  }

  return normalized;
}

export function coerceOptionalLowercaseString(value: unknown): unknown {
  const normalized = coerceOptionalString(value);
  if (typeof normalized === "string") {
    return normalized.toLowerCase();
  }

  return normalized;
}

export function coerceOptionalNumber(value: unknown): unknown {
  const normalized = emptyToUndefined(value);
  if (normalized === undefined) {
    return undefined;
  }

  if (typeof normalized === "string") {
    const parsed = Number(normalized.trim());
    return Number.isFinite(parsed) ? parsed : normalized;
  }

  return normalized;
}

export function coerceOptionalBoolean(value: unknown): unknown {
  const normalized = emptyToUndefined(value);
  if (normalized === undefined) {
    return undefined;
  }

  if (typeof normalized === "boolean") {
    return normalized;
  }

  if (typeof normalized === "number") {
    if (normalized === 1) {
      return true;
    }

    if (normalized === 0) {
      return false;
    }
  }

  if (typeof normalized === "string") {
    const lower = normalized.trim().toLowerCase();
    if (["true", "1", "yes", "y", "si", "sí"].includes(lower)) {
      return true;
    }

    if (["false", "0", "no", "n"].includes(lower)) {
      return false;
    }
  }

  return normalized;
}

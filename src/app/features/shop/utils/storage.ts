
export function loadStoredArray<T>(
  key: string,
  validate: (value: unknown) => value is T
): T[] | null {
  try {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem(key);

    if (raw === null) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return null;
    }

    if (!parsed.every(validate)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredArray<T>(
  key: string,
  values: T[]
): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(values));
    }
  } catch {
    // Storage can be unavailable or full.
  }
}

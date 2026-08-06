export type ApiId = string | number;

export const parseRouteApiId = (value: unknown): ApiId | undefined => {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (typeof candidate === "string") {
    const id = candidate.trim();
    return /^\d+$/.test(id) ? id : undefined;
  }

  return typeof candidate === "number" && Number.isSafeInteger(candidate)
    ? candidate
    : undefined;
};

// The generated schema declares Java Long as number, while JSON carries it as a string.
export const toGeneratedApiId = (id: ApiId): number => id as number;

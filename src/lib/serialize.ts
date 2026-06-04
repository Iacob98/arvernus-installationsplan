import { Prisma } from "@prisma/client";

export function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

type Serialized<T> = T extends Prisma.Decimal
  ? number
  : T extends Date | null | undefined | string | number | boolean
    ? T
    : T extends (infer U)[]
      ? Serialized<U>[]
      : T extends object
        ? { [K in keyof T]: Serialized<T[K]> }
        : T;

export function serializeDecimals<T>(value: T): Serialized<T> {
  if (value === null || value === undefined) return value as Serialized<T>;
  if (Array.isArray(value)) {
    return value.map((v) => serializeDecimals(v)) as Serialized<T>;
  }
  if (value instanceof Date) return value as Serialized<T>;
  if (typeof value === "object") {
    if (value instanceof Prisma.Decimal) {
      return Number(value.toString()) as Serialized<T>;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeDecimals(v);
    }
    return out as Serialized<T>;
  }
  return value as Serialized<T>;
}

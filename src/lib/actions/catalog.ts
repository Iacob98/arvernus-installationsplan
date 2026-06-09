"use server";

import { db } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth-utils";
import {
  catalogItemSchema,
  CatalogItemFormData,
} from "@/lib/validations/catalog";
import { deleteFile, getFileUrl } from "@/lib/storage";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

const catalogItemInclude = {
  variants: { orderBy: { order: "asc" as const } },
} satisfies Prisma.CatalogItemInclude;

export type CatalogItemWithVariants = Prisma.CatalogItemGetPayload<{
  include: typeof catalogItemInclude;
}>;

export type CatalogItemForClient = Omit<CatalogItemWithVariants, "variants"> & {
  variants: (Omit<CatalogItemWithVariants["variants"][number], "price"> & {
    price: number;
  })[];
};

export async function listCatalogItems(): Promise<CatalogItemWithVariants[]> {
  await requireAuth();
  return db.catalogItem.findMany({
    orderBy: [{ type: "asc" }, { order: "asc" }, { name: "asc" }],
    include: catalogItemInclude,
  });
}

export async function listActiveCatalogItems(): Promise<CatalogItemWithVariants[]> {
  await requireAuth();
  return db.catalogItem.findMany({
    where: {
      active: true,
      variants: { some: { active: true } },
    },
    orderBy: [{ type: "asc" }, { order: "asc" }, { name: "asc" }],
    include: {
      variants: {
        where: { active: true },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function getCatalogItem(id: string) {
  await requireAuth();
  return db.catalogItem.findUnique({
    where: { id },
    include: catalogItemInclude,
  });
}

export async function createCatalogItem(data: CatalogItemFormData) {
  await requireAdmin();
  const validated = catalogItemSchema.parse(data);

  await db.catalogItem.create({
    data: {
      name: validated.name,
      description: validated.description ?? null,
      type: validated.type,
      manufacturer: validated.manufacturer ?? null,
      active: validated.active,
      order: validated.order,
      variants: {
        create: validated.variants.map((v, idx) => ({
          name: v.name,
          description: v.description ?? null,
          photoStoragePath: v.photoStoragePath ?? null,
          price: v.price,
          technicalData: v.technicalData,
          nennleistungKw: v.nennleistungKw ?? null,
          active: v.active,
          order: v.order || idx,
        })),
      },
    },
  });

  revalidatePath("/settings/catalog");
}

export async function updateCatalogItem(id: string, data: CatalogItemFormData) {
  await requireAdmin();
  const validated = catalogItemSchema.parse(data);

  const existing = await db.catalogItem.findUnique({
    where: { id },
    include: { variants: true },
  });
  if (!existing) throw new Error("Position nicht gefunden");

  const incomingIds = validated.variants
    .map((v) => v.id)
    .filter((vId): vId is string => Boolean(vId));
  const toDelete = existing.variants.filter((v) => !incomingIds.includes(v.id));

  await db.$transaction(async (tx) => {
    await tx.catalogItem.update({
      where: { id },
      data: {
        name: validated.name,
        description: validated.description ?? null,
        type: validated.type,
        manufacturer: validated.manufacturer ?? null,
        active: validated.active,
        order: validated.order,
      },
    });

    if (toDelete.length > 0) {
      await tx.catalogItemVariant.deleteMany({
        where: { id: { in: toDelete.map((v) => v.id) } },
      });
    }

    for (let idx = 0; idx < validated.variants.length; idx++) {
      const v = validated.variants[idx];
      if (v.id) {
        await tx.catalogItemVariant.update({
          where: { id: v.id },
          data: {
            name: v.name,
            description: v.description ?? null,
            photoStoragePath: v.photoStoragePath ?? null,
            price: v.price,
            technicalData: v.technicalData,
            active: v.active,
            order: v.order || idx,
          },
        });
      } else {
        await tx.catalogItemVariant.create({
          data: {
            catalogItemId: id,
            name: v.name,
            description: v.description ?? null,
            photoStoragePath: v.photoStoragePath ?? null,
            price: v.price,
            technicalData: v.technicalData,
            active: v.active,
            order: v.order || idx,
          },
        });
      }
    }
  });

  for (const variant of toDelete) {
    if (variant.photoStoragePath) {
      try {
        await deleteFile(variant.photoStoragePath);
      } catch {
        // ignore — orphan storage is acceptable
      }
    }
  }

  revalidatePath("/settings/catalog");
}

export async function deleteCatalogItem(id: string) {
  await requireAdmin();

  const item = await db.catalogItem.findUnique({
    where: { id },
    include: { variants: true },
  });
  if (!item) throw new Error("Position nicht gefunden");

  await db.catalogItem.delete({ where: { id } });

  for (const v of item.variants) {
    if (v.photoStoragePath) {
      try {
        await deleteFile(v.photoStoragePath);
      } catch {
        // ignore
      }
    }
  }

  revalidatePath("/settings/catalog");
}

export async function getVariantPhotoUrl(path: string): Promise<string> {
  await requireAuth();
  return getFileUrl(path);
}

"use server";

import { db } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth-utils";
import {
  offerTemplateSchema,
  OfferTemplateFormData,
} from "@/lib/validations/offer-template";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

const templateInclude = {
  components: { orderBy: { order: "asc" as const } },
} satisfies Prisma.OfferTemplateInclude;

export type OfferTemplateWithComponents = Prisma.OfferTemplateGetPayload<{
  include: typeof templateInclude;
}>;

export async function listOfferTemplates(): Promise<OfferTemplateWithComponents[]> {
  await requireAuth();
  return db.offerTemplate.findMany({
    orderBy: [{ active: "desc" }, { order: "asc" }, { name: "asc" }],
    include: templateInclude,
  });
}

export async function listActiveOfferTemplates(): Promise<
  OfferTemplateWithComponents[]
> {
  await requireAuth();
  return db.offerTemplate.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: templateInclude,
  });
}

export async function createOfferTemplate(data: OfferTemplateFormData) {
  await requireAdmin();
  const validated = offerTemplateSchema.parse(data);

  await db.offerTemplate.create({
    data: {
      name: validated.name,
      description: validated.description ?? null,
      order: validated.order,
      active: validated.active,
      nennleistungKw: validated.nennleistungKw ?? null,
      warmwasserSpeicherLiter: validated.warmwasserSpeicherLiter ?? null,
      heizkreiseAnzahl: validated.heizkreiseAnzahl ?? null,
      mitSolar: validated.mitSolar ?? false,
      components: {
        create: validated.components.map((c, idx) => ({
          type: c.type,
          keyword: c.keyword ?? "",
          quantity: c.quantity,
          label: c.label,
          order: c.order || idx,
          catalogItemId: c.catalogItemId ?? null,
          catalogItemVariantId: c.catalogItemVariantId ?? null,
        })),
      },
    },
  });

  revalidatePath("/settings/templates");
  revalidatePath("/clients");
}

export async function updateOfferTemplate(id: string, data: OfferTemplateFormData) {
  await requireAdmin();
  const validated = offerTemplateSchema.parse(data);

  const existing = await db.offerTemplate.findUnique({
    where: { id },
    include: { components: true },
  });
  if (!existing) throw new Error("Vorlage nicht gefunden");

  const incomingIds = validated.components
    .map((c) => c.id)
    .filter((cid): cid is string => Boolean(cid));
  const toDelete = existing.components.filter((c) => !incomingIds.includes(c.id));

  await db.$transaction(async (tx) => {
    await tx.offerTemplate.update({
      where: { id },
      data: {
        name: validated.name,
        description: validated.description ?? null,
        order: validated.order,
        active: validated.active,
        nennleistungKw: validated.nennleistungKw ?? null,
        warmwasserSpeicherLiter: validated.warmwasserSpeicherLiter ?? null,
        heizkreiseAnzahl: validated.heizkreiseAnzahl ?? null,
        mitSolar: validated.mitSolar ?? false,
      },
    });

    if (toDelete.length > 0) {
      await tx.offerTemplateComponent.deleteMany({
        where: { id: { in: toDelete.map((c) => c.id) } },
      });
    }

    for (let idx = 0; idx < validated.components.length; idx++) {
      const c = validated.components[idx];
      if (c.id) {
        await tx.offerTemplateComponent.update({
          where: { id: c.id },
          data: {
            type: c.type,
            keyword: c.keyword ?? "",
            quantity: c.quantity,
            label: c.label,
            order: c.order || idx,
            catalogItemId: c.catalogItemId ?? null,
            catalogItemVariantId: c.catalogItemVariantId ?? null,
          },
        });
      } else {
        await tx.offerTemplateComponent.create({
          data: {
            templateId: id,
            type: c.type,
            keyword: c.keyword ?? "",
            quantity: c.quantity,
            label: c.label,
            order: c.order || idx,
            catalogItemId: c.catalogItemId ?? null,
            catalogItemVariantId: c.catalogItemVariantId ?? null,
          },
        });
      }
    }
  });

  revalidatePath("/settings/templates");
  revalidatePath("/clients");
}

export async function deleteOfferTemplate(id: string) {
  await requireAdmin();
  await db.offerTemplate.delete({ where: { id } });
  revalidatePath("/settings/templates");
  revalidatePath("/clients");
}

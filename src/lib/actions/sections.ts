"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getSection(projectId: string, sectionType: string) {
  return db.projectSection.findUnique({
    where: {
      projectId_type: {
        projectId,
        type: sectionType as never,
      },
    },
    include: {
      photos: { orderBy: { order: "asc" } },
    },
  });
}

export async function updateSection(
  projectId: string,
  sectionType: string,
  data: Record<string, unknown>
) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const section = await db.projectSection.update({
    where: {
      projectId_type: {
        projectId,
        type: sectionType as never,
      },
    },
    data: { data: data as object },
  });

  revalidatePath(`/projects/${projectId}`);
  return section;
}

export async function completeSection(projectId: string, sectionType: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const section = await db.projectSection.update({
    where: {
      projectId_type: {
        projectId,
        type: sectionType as never,
      },
    },
    data: { completed: true },
  });

  revalidatePath(`/projects/${projectId}`);
  return section;
}

export async function uncompleteSection(projectId: string, sectionType: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const section = await db.projectSection.update({
    where: {
      projectId_type: {
        projectId,
        type: sectionType as never,
      },
    },
    data: { completed: false },
  });

  revalidatePath(`/projects/${projectId}`);
  return section;
}

"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { projectSchema, ProjectFormData } from "@/lib/validations/project";
import { SECTION_ORDER } from "@/lib/validations/sections";
import { revalidatePath } from "next/cache";

export async function getProjects(search?: string) {
  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { projectNumber: { contains: search, mode: "insensitive" as const } },
          { city: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  return db.project.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      client: { select: { firstName: true, lastName: true, customerNumber: true } },
      createdBy: { select: { name: true } },
      _count: { select: { sections: { where: { completed: true } }, documents: true } },
    },
  });
}

export async function getProject(id: string) {
  return db.project.findUnique({
    where: { id },
    include: {
      client: true,
      createdBy: { select: { name: true, email: true } },
      sections: { orderBy: { order: "asc" }, include: { _count: { select: { photos: true } } } },
      documents: { orderBy: { createdAt: "desc" } },
      heatingCircuits: { orderBy: { number: "asc" }, include: { photos: true } },
    },
  });
}

export async function createProject(data: ProjectFormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nicht authentifiziert");

  const validated = projectSchema.parse(data);

  const project = await db.project.create({
    data: {
      ...validated,
      installationDate: validated.installationDate
        ? new Date(validated.installationDate)
        : null,
      createdById: session.user.id,
      sections: {
        create: SECTION_ORDER.map((type, index) => ({
          type,
          order: index + 1,
          data: {},
        })),
      },
    },
  });

  revalidatePath("/projects");
  return project;
}

export async function updateProject(id: string, data: Partial<ProjectFormData>) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const project = await db.project.update({
    where: { id },
    data: {
      ...data,
      installationDate: data.installationDate
        ? new Date(data.installationDate)
        : undefined,
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return project;
}

export async function deleteProject(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  await db.project.delete({ where: { id } });
  revalidatePath("/projects");
}

export async function updateProjectStatus(
  id: string,
  status: "DRAFT" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ARCHIVED"
) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const project = await db.project.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return project;
}

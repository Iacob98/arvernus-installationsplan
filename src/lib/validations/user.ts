import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  role: z.enum(["ADMIN", "MANAGER", "TECHNICIAN", "VIEWER"]),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich").optional(),
  email: z.string().email("Ungültige E-Mail-Adresse").optional(),
  role: z.enum(["ADMIN", "MANAGER", "TECHNICIAN", "VIEWER"]).optional(),
  active: z.boolean().optional(),
});

export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;

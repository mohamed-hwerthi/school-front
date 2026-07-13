import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z
    .string()
    .min(8, "Mot de passe min 8 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[a-z]/, "Au moins une minuscule")
    .regex(/\d/, "Au moins un chiffre"),
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  role: z.string().min(1, "Rôle requis"),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

// Edit: password optional
export const editUserSchema = createUserSchema.partial({ password: true });

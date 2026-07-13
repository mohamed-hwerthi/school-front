import type { ZodSchema, ZodIssue } from "zod";

export type FormErrors = Record<string, string>;

export function validate<T>(schema: ZodSchema<T>, data: unknown): { ok: true; data: T } | { ok: false; errors: FormErrors } {
  const res = schema.safeParse(data);
  if (res.success) return { ok: true, data: res.data };
  const errors: FormErrors = {};
  res.error.issues.forEach((issue: ZodIssue) => {
    const key = issue.path.join(".") || "_root";
    if (!errors[key]) errors[key] = issue.message;
  });
  return { ok: false, errors };
}

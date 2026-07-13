import { describe, it, expect } from "vitest";
import {
  loginSchema,
  resetPasswordSchema,
} from "@/lib/auth-schema";
import { studentSchema } from "@/lib/student-schema";

describe("loginSchema", () => {
  it("accepts valid email + password", () => {
    const result = loginSchema.safeParse({
      email: "admin@school.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("admin@school.com");
      expect(result.data.password).toBe("secret123");
    }
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-valid",
      password: "pass123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => /email/i.test(m))).toBe(true);
    }
  });

  it("rejects empty fields", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      // Should have at least 2 issues (email required + password required)
      expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("resetPasswordSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "StrongPass1",
      confirmPassword: "DifferentPass2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(
        messages.some((m) => /ne correspondent pas/i.test(m))
      ).toBe(true);
    }
  });

  it("accepts matching valid passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "StrongPass1",
      confirmPassword: "StrongPass1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects password without uppercase letter", () => {
    const result = resetPasswordSchema.safeParse({
      password: "nouppercase1",
      confirmPassword: "nouppercase1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => /majuscule/i.test(m))).toBe(true);
    }
  });

  it("rejects password without digit", () => {
    const result = resetPasswordSchema.safeParse({
      password: "NoDigitHere",
      confirmPassword: "NoDigitHere",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => /chiffre/i.test(m))).toBe(true);
    }
  });

  it("rejects password shorter than 8 characters", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Ab1",
      confirmPassword: "Ab1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => /8 caracteres/i.test(m))).toBe(true);
    }
  });
});

describe("studentSchema", () => {
  it("rejects missing required fields", () => {
    const result = studentSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      // Required fields: nom, prenom, sexe, dateNaissance, niveau, classe
      expect(paths).toContain("nom");
      expect(paths).toContain("prenom");
      expect(paths).toContain("sexe");
      expect(paths).toContain("dateNaissance");
      expect(paths).toContain("niveau");
      expect(paths).toContain("classe");
    }
  });

  it("accepts valid student data", () => {
    const result = studentSchema.safeParse({
      nom: "Dupont",
      prenom: "Jean",
      sexe: "M",
      dateNaissance: "2015-06-15",
      niveau: "CE1",
      classe: "CE1-A",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nom).toBe("Dupont");
      expect(result.data.prenom).toBe("Jean");
      expect(result.data.sexe).toBe("M");
      // Optional fields should have defaults
      expect(result.data.statut).toBe("Actif");
      expect(result.data.estBloque).toBe(false);
      expect(result.data.adresse).toBe("");
    }
  });

  it("rejects invalid sexe enum value", () => {
    const result = studentSchema.safeParse({
      nom: "Test",
      prenom: "User",
      sexe: "X", // invalid
      dateNaissance: "2015-01-01",
      niveau: "CE1",
      classe: "CE1-A",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid parent email format", () => {
    const result = studentSchema.safeParse({
      nom: "Test",
      prenom: "User",
      sexe: "M",
      dateNaissance: "2015-01-01",
      niveau: "CE1",
      classe: "CE1-A",
      emailParent: "invalid-email",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty string for optional emailParent", () => {
    const result = studentSchema.safeParse({
      nom: "Test",
      prenom: "User",
      sexe: "F",
      dateNaissance: "2015-01-01",
      niveau: "CP",
      classe: "CP-B",
      emailParent: "",
    });
    expect(result.success).toBe(true);
  });
});

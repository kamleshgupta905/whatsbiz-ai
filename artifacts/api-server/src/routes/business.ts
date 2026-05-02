import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateBusinessProfileBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

router.get("/business/profile", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    businessName: user.businessName,
    businessType: user.businessType,
    businessSize: user.businessSize,
    language: user.language,
    onboardingStep: user.onboardingStep,
    onboardingComplete: user.onboardingComplete,
  });
});

router.put("/business/profile", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const parsed = UpdateBusinessProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const [updated] = await db.update(usersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
    businessName: updated.businessName,
    businessType: updated.businessType,
    businessSize: updated.businessSize,
    language: updated.language,
    onboardingStep: updated.onboardingStep,
    onboardingComplete: updated.onboardingComplete,
  });
});

router.post("/business/onboarding", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const { step, data } = req.body;

  const nextStep = (step || 1) + 1;
  const isComplete = nextStep > 5;

  const updateData: Record<string, unknown> = { onboardingStep: nextStep, updatedAt: new Date() };
  if (isComplete) updateData.onboardingComplete = true;
  if (data?.businessType) updateData.businessType = data.businessType;
  if (data?.businessSize) updateData.businessSize = data.businessSize;
  if (data?.language) updateData.language = data.language;
  if (data?.businessName) updateData.businessName = data.businessName;

  await db.update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, user.id));

  res.json({ nextStep, complete: isComplete });
});

export default router;

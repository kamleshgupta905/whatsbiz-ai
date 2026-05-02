import { Router } from "express";
import { db, subscriptionsTable, paymentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { InitiatePaymentBody, VerifyPaymentBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

const PLANS = [
  {
    id: "STARTER" as const,
    name: "Starter",
    price: 499,
    messagesLimit: 500,
    whatsappAccounts: 1,
    features: ["500 AI replies/month", "1 WhatsApp number", "Basic analytics", "Knowledge base", "Email support"],
    popular: false,
  },
  {
    id: "PRO" as const,
    name: "Pro",
    price: 1499,
    messagesLimit: 3000,
    whatsappAccounts: 2,
    features: ["3000 AI replies/month", "2 WhatsApp numbers", "Advanced analytics", "CRM & contacts", "Broadcasting", "Priority support"],
    popular: true,
  },
  {
    id: "BUSINESS" as const,
    name: "Business",
    price: 3999,
    messagesLimit: 10000,
    whatsappAccounts: 5,
    features: ["10,000 AI replies/month", "5 WhatsApp numbers", "Team collaboration", "Custom AI training", "White-label", "Dedicated support"],
    popular: false,
  },
];

router.get("/billing/plans", async (_req, res) => {
  res.json({ plans: PLANS });
});

router.get("/billing/subscription", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, user.id));

  if (!sub) {
    res.status(404).json({ error: "No subscription found" });
    return;
  }

  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  res.json({
    id: sub.id,
    plan: sub.plan,
    status: sub.status,
    startDate: sub.startDate,
    endDate: sub.endDate,
    trialEndDate: sub.trialEndDate,
    messagesLimit: sub.messagesLimit,
    messagesUsed: sub.messagesUsed,
    daysRemaining,
    autoRenew: sub.autoRenew,
  });
});

router.post("/billing/initiate-payment", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const parsed = InitiatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const plan = PLANS.find((p) => p.id === parsed.data.plan);
  if (!plan) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }

  const txnNote = `WHATSBIZ-${user.id.slice(0, 8)}-${Date.now()}`;
  const upiId = "9315515700-2@ibl";

  const [payment] = await db.insert(paymentsTable).values({
    userId: user.id,
    amount: plan.price,
    plan: parsed.data.plan,
    status: "PENDING",
    upiId,
    txnNote,
    duration: 30,
  }).returning();

  const encodedUpiId = encodeURIComponent(upiId);
  const encodedNote = encodeURIComponent(txnNote);
  const baseUpiUrl = `upi://pay?pa=${encodedUpiId}&pn=WhatsBizAI&am=${plan.price}&cu=INR&tn=${encodedNote}`;

  res.json({
    paymentId: payment.id,
    amount: plan.price,
    upiId,
    txnNote,
    qrCodeUrl: null,
    upiDeepLinks: {
      gpay: `gpay://upi/pay?pa=${encodedUpiId}&pn=WhatsBizAI&am=${plan.price}&cu=INR&tn=${encodedNote}`,
      phonepe: `phonepe://${baseUpiUrl}`,
      paytm: `paytmmp://${baseUpiUrl}`,
    },
  });
});

router.post("/billing/verify-payment", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const parsed = VerifyPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const [payment] = await db.update(paymentsTable)
    .set({ utr: parsed.data.utr, status: "AWAITING_VERIFICATION", updatedAt: new Date() })
    .where(eq(paymentsTable.id, parsed.data.paymentId))
    .returning();

  res.json({
    id: payment.id,
    amount: payment.amount,
    plan: payment.plan,
    status: payment.status,
    utr: payment.utr,
    txnNote: payment.txnNote!,
    paidAt: payment.paidAt,
    invoiceNumber: payment.invoiceNumber,
    createdAt: payment.createdAt,
  });
});

router.get("/billing/payments", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.userId, user.id));

  res.json({
    payments: payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      plan: p.plan,
      status: p.status,
      utr: p.utr,
      txnNote: p.txnNote!,
      paidAt: p.paidAt,
      invoiceNumber: p.invoiceNumber,
      createdAt: p.createdAt,
    })),
    total: payments.length,
  });
});

export default router;

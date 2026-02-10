/**
 * Single source of truth for subscription plans and prices.
 * Used by: home page, dashboard subscription page, doctor onboarding, payment gateway.
 */
export const PLAN_AMOUNTS: Record<string, number> = {
  BASIC: 1499,
  PROFESSIONAL: 2999,
  ENTERPRISE: 4999,
}

export const PLAN_FEATURES: Record<string, string[]> = {
  BASIC: ["Up to 3 Doctors", "Basic Scheduling", "Patient Records", "Email Support", "Mobile App Access"],
  PROFESSIONAL: ["Unlimited Appointments", "Up to 10 Doctors", "Advanced Scheduling", "Analytics Dashboard", "Priority Support", "Custom Branding"],
  ENTERPRISE: ["Everything in Professional", "Unlimited Doctors", "Custom Integrations"],
}

export const PLAN_ORDER = ["BASIC", "PROFESSIONAL", "ENTERPRISE"] as const

export type PlanId = typeof PLAN_ORDER[number]

export const PLANS = PLAN_ORDER.map((id) => ({
  id,
  name: id.charAt(0) + id.slice(1).toLowerCase(),
  amount: PLAN_AMOUNTS[id],
  price: `₹${PLAN_AMOUNTS[id].toLocaleString("en-IN")}`,
  limit: id === "BASIC" ? "Up to 3 Doctors" : id === "PROFESSIONAL" ? "Up to 10 Doctors" : "Unlimited Doctors",
  description: id === "BASIC" ? "For small practices." : id === "PROFESSIONAL" ? "Ideal for growing clinics with multiple staff." : "For large hospitals and multi-location chains.",
  features: PLAN_FEATURES[id],
  recommended: id === "PROFESSIONAL",
}))

export const SUBSCRIPTION_DURATIONS = [
  { value: 1, label: "Monthly", discount: 0 },
  { value: 3, label: "3 Months", discount: 0 },
  { value: 6, label: "6 Months", discount: 0 },
  { value: 12, label: "Yearly", discount: 16 }, // ~16% off (2 months free)
] as const

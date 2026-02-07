/**
 * Single source of truth for subscription plans and prices.
 * Used by: home page, dashboard subscription page, doctor onboarding, payment gateway.
 */
export const PLAN_AMOUNTS: Record<string, number> = {
  STARTER: 999,
  BASIC: 1499,
  PROFESSIONAL: 2999,
  ENTERPRISE: 4999,
}

export const PLAN_FEATURES: Record<string, string[]> = {
  STARTER: ["Up to 3 Doctors", "1,000 Appointments/month", "Basic Prescriptions", "Medical Records", "Custom Branding", "Email Support", "Mobile App Access"],
  BASIC: ["Up to 5 Doctors", "2,000 Appointments/month", "Full Prescriptions", "Medical Records", "Basic Analytics", "Email Support", "Mobile App Access"],
  PROFESSIONAL: ["Up to 10 Doctors", "Unlimited Appointments", "Receptionist Access", "Queue Management", "Full Prescriptions", "Medical Records", "Full Analytics", "Custom Branding", "Email Support", "Mobile App Access"],
  ENTERPRISE: ["Unlimited Doctors", "Unlimited Appointments", "Receptionist Access", "Queue Management", "Full Prescriptions", "Medical Records", "Export Analytics", "Custom Branding", "Email Support", "Mobile App Access"],
}

export const PLAN_ORDER = ["STARTER", "BASIC", "PROFESSIONAL", "ENTERPRISE"] as const

export type PlanId = typeof PLAN_ORDER[number]

export const PLANS = PLAN_ORDER.map((id) => ({
  id,
  name: id.charAt(0) + id.slice(1).toLowerCase(),
  amount: PLAN_AMOUNTS[id],
  price: `₹${PLAN_AMOUNTS[id].toLocaleString("en-IN")}`,
  limit: id === "STARTER" ? "Up to 3 Doctors" : id === "BASIC" ? "Up to 5 Doctors" : id === "PROFESSIONAL" ? "Up to 10 Doctors" : "Unlimited Doctors",
  description: id === "STARTER" ? "Perfect for individual practitioners starting out." : id === "BASIC" ? "For small practices." : id === "PROFESSIONAL" ? "Ideal for growing clinics with multiple staff." : "For large hospitals and multi-location chains.",
  features: PLAN_FEATURES[id],
  recommended: id === "PROFESSIONAL",
}))

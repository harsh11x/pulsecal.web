import type { User } from "@/types"

/**
 * Map backend /auth/profile payload into the Redux User shape.
 * Must include clinicId + canManageSubscription so doctor sidebar
 * (Staff / Subscription) stays consistent across all login entry points.
 */
export function mapAuthProfileToUser(
  userProfile: any,
  overrides: Partial<User> = {}
): User {
  const roleRaw = userProfile?.role || "PATIENT"
  const role = String(roleRaw).toLowerCase() as User["role"]

  return {
    id: userProfile.id,
    email: userProfile.email,
    firstName: userProfile.firstName,
    lastName: userProfile.lastName,
    phone: userProfile.phone,
    dateOfBirth: userProfile.dateOfBirth,
    role,
    isActive: userProfile.isActive !== false,
    isEmailVerified: userProfile.isEmailVerified || false,
    profileImage: userProfile.profileImage,
    onboardingCompleted: userProfile.onboardingCompleted || false,
    clinicId: userProfile.clinicId,
    ...(userProfile.doctorProfile && { doctorProfile: userProfile.doctorProfile }),
    canManageSubscription:
      userProfile.canManageSubscription ??
      (String(roleRaw).toUpperCase() === "ADMIN"),
    ...overrides,
  }
}

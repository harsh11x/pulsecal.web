/**
 * Format clinic location for patient-facing doctor lists.
 * Prefers full address; falls back to city; never invents placeholders.
 */
export function formatDoctorLocation(input: {
  clinicAddress?: string | null
  clinicCity?: string | null
  city?: string | null
  address?: string | null
}): { addressLine: string | null; cityLine: string | null; display: string | null } {
  const address = (input.clinicAddress || input.address || "").trim() || null
  const city = (input.clinicCity || input.city || "").trim() || null

  // If address already contains the city, don't duplicate it
  const cityAlreadyInAddress =
    !!address && !!city && address.toLowerCase().includes(city.toLowerCase())

  let display: string | null = null
  if (address && city && !cityAlreadyInAddress) {
    display = `${address}, ${city}`
  } else if (address) {
    display = address
  } else if (city) {
    display = city
  }

  return {
    addressLine: address,
    cityLine: city,
    display,
  }
}

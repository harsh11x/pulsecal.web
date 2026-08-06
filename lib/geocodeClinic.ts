export type GeocodeResult = {
  lat: number
  lng: number
  displayName?: string
  approximate?: boolean
}

const INDIA_CENTER: GeocodeResult = {
  lat: 20.5937,
  lng: 78.9629,
  displayName: "India",
  approximate: true,
}

function buildQueries(parts: {
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}): string[] {
  const address = (parts.address || "").trim()
  const city = (parts.city || "").trim()
  const state = (parts.state || "").trim()
  const zipCode = (parts.zipCode || "").trim()
  const country = (parts.country || "India").trim() || "India"

  const queries: string[] = []
  const push = (q: string) => {
    const cleaned = q.replace(/\s+/g, " ").trim()
    if (cleaned && !queries.includes(cleaned)) queries.push(cleaned)
  }

  push([address, city, state, zipCode, country].filter(Boolean).join(", "))
  push([address, city, state, country].filter(Boolean).join(", "))
  push([address, city, country].filter(Boolean).join(", "))
  push([city, state, zipCode, country].filter(Boolean).join(", "))
  push([city, state, country].filter(Boolean).join(", "))
  push([city, country].filter(Boolean).join(", "))

  return queries
}

async function geocodeViaApi(query: string): Promise<GeocodeResult | null> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
    headers: { Accept: "application/json" },
  })
  if (!res.ok) return null
  const data = await res.json()
  const lat = Number(data?.lat)
  const lng = Number(data?.lng ?? data?.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return {
    lat,
    lng,
    displayName: typeof data?.displayName === "string" ? data.displayName : undefined,
    approximate: Boolean(data?.approximate),
  }
}

/**
 * Geocode a clinic address for map pinning.
 * Tries progressively broader queries, then browser location, then India center
 * so the map always opens and the doctor can drag the pin.
 */
export async function geocodeClinicLocation(parts: {
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}): Promise<GeocodeResult> {
  const queries = buildQueries(parts)

  for (const query of queries) {
    try {
      const hit = await geocodeViaApi(query)
      if (hit) {
        // City-only matches are approximate so the UI can nudge the user to drag
        const isCityOnly =
          !parts.address?.trim() ||
          query.toLowerCase() ===
            [parts.city, parts.state, parts.country || "India"]
              .filter(Boolean)
              .join(", ")
              .toLowerCase() ||
          query.toLowerCase() ===
            [parts.city, parts.country || "India"].filter(Boolean).join(", ").toLowerCase()
        return { ...hit, approximate: hit.approximate || isCityOnly }
      }
    } catch (err) {
      console.warn("Geocode query failed:", query, err)
    }
  }

  // Browser GPS fallback
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        })
      })
      return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        displayName: "Current device location",
        approximate: true,
      }
    } catch {
      // ignore and fall through
    }
  }

  return INDIA_CENTER
}

export async function getCurrentDeviceLocation(): Promise<GeocodeResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocation is not available on this device")
  }
  const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    })
  })
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    displayName: "Current device location",
  }
}

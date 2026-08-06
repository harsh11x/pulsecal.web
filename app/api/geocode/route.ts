import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Server-side Nominatim geocode proxy.
 * Avoids exposing Google Maps keys and sets a proper User-Agent for OSM policy.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ message: "Query q is required" }, { status: 400 })
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search")
    url.searchParams.set("format", "json")
    url.searchParams.set("limit", "1")
    url.searchParams.set("countrycodes", "in")
    url.searchParams.set("addressdetails", "0")
    url.searchParams.set("q", q)

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "PulseCal-Healthcare/1.0 (clinic-location; https://www.pulsecal.com)",
      },
      // Nominatim asks for caching; Next can cache briefly
      next: { revalidate: 86400 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { message: `Geocoder error (${res.status})` },
        { status: 502 }
      )
    }

    const results = (await res.json()) as Array<{
      lat?: string
      lon?: string
      display_name?: string
    }>

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ message: "No results" }, { status: 404 })
    }

    const hit = results[0]
    const lat = Number(hit.lat)
    const lng = Number(hit.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ message: "Invalid geocode result" }, { status: 502 })
    }

    return NextResponse.json({
      lat,
      lng,
      displayName: hit.display_name || q,
    })
  } catch (err: any) {
    console.error("Geocode proxy failed:", err)
    return NextResponse.json(
      { message: err?.message || "Geocode failed" },
      { status: 500 }
    )
  }
}

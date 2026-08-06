"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface LocationPickerMapProps {
  latitude: number
  longitude: number
  onLocationChange: (lat: number, lng: number) => void
  height?: number
  zoom?: number
}

function createClinicIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative; width:34px; height:44px;">
        <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-80%) rotate(-45deg); width:34px; height:34px; border-radius:50% 50% 50% 0; background:#2563eb; border:3px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center;">
          <div style="width:12px; height:12px; border-radius:50%; background:#fff; transform:rotate(45deg);"></div>
        </div>
      </div>`,
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
  })
}

/**
 * Imperative Leaflet map — avoids react-leaflet Strict Mode
 * "Map container is already initialized" crashes.
 */
export default function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
  height = 320,
  zoom = 16,
}: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onLocationChange)

  useEffect(() => {
    onChangeRef.current = onLocationChange
  }, [onLocationChange])

  // Create map once per mount
  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    delete (el as HTMLElement & { _leaflet_id?: number })._leaflet_id
    el.innerHTML = ""

    const map = L.map(el, {
      center: [latitude, longitude],
      zoom,
      scrollWheelZoom: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    const marker = L.marker([latitude, longitude], {
      icon: createClinicIcon(),
      draggable: true,
    }).addTo(map)

    marker.bindPopup(
      `<div style="font-size:13px"><strong>Clinic location</strong><br/><span style="color:#64748b;font-size:12px">Drag or tap to fine-tune the exact spot</span></div>`
    )

    marker.on("dragend", () => {
      const pos = marker.getLatLng()
      onChangeRef.current(pos.lat, pos.lng)
    })

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      onChangeRef.current(e.latlng.lat, e.latlng.lng)
    })

    mapRef.current = map
    markerRef.current = marker
    requestAnimationFrame(() => map.invalidateSize())

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
      delete (el as HTMLElement & { _leaflet_id?: number })._leaflet_id
      el.innerHTML = ""
    }
    // Intentionally init once; coordinate sync is in the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync pin when parent geocodes / updates coords
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return

    const current = marker.getLatLng()
    const moved =
      Math.abs(current.lat - latitude) > 1e-7 || Math.abs(current.lng - longitude) > 1e-7
    if (!moved) return

    marker.setLatLng([latitude, longitude])
    map.setView([latitude, longitude], map.getZoom(), { animate: true })
  }, [latitude, longitude])

  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-border shadow-sm relative z-0"
      style={{ height }}
    >
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  )
}

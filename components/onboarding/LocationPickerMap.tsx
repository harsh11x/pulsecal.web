"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapPin } from "lucide-react"

// Custom clinic pin so it stands out from the default Leaflet marker
const ClinicIcon = L.divIcon({
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

interface LocationPickerMapProps {
  latitude: number
  longitude: number
  onLocationChange: (lat: number, lng: number) => void
  height?: number
  zoom?: number
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
  height = 320,
  zoom = 16,
}: LocationPickerMapProps) {
  const position: [number, number] = [latitude, longitude]

  // Keep the map centered on the pin after the user drags/taps a new spot
  function MapCentering({ pos }: { pos: [number, number] }) {
    const map = useMap()
    const isFirstRender = useRef(true)
    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false
        return
      }
      map.setView(pos, map.getZoom(), { animate: true })
    }, [pos[0], pos[1]])
    return null
  }

  function DraggableMarker() {
    useMapEvents({
      click(e) {
        onLocationChange(e.latlng.lat, e.latlng.lng)
      },
    })
    return (
      <Marker
        position={position}
        icon={ClinicIcon}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target as L.Marker
            const pos = marker.getLatLng()
            onLocationChange(pos.lat, pos.lng)
          },
        }}
      >
        <Popup>
          <div className="text-sm">
            <div className="font-semibold flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Clinic location
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Drag or tap to fine-tune the exact spot</p>
          </div>
        </Popup>
      </Marker>
    )
  }

  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-border shadow-sm relative z-0"
      style={{ height }}
    >
      <MapContainer
        center={position}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCentering pos={position} />
        <DraggableMarker />
      </MapContainer>
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"

// Fix for Leaflet default icon
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png"
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
})

const UserIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

interface Doctor {
  id: string
  firstName: string
  lastName: string
  specialization: string
  clinicName?: string
  clinicLatitude?: number
  clinicLongitude?: number
}

interface LeafletMapProps {
  center: [number, number]
  zoom: number
  userLocation: { lat: number; lng: number } | null
  doctors: Doctor[]
  onSelectDoctor: (doctor: Doctor) => void
}

export default function LeafletMap({ center, zoom, userLocation, doctors, onSelectDoctor }: LeafletMapProps) {
  return (
    <div className="w-full h-full relative z-0">
        <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
          <MapUpdater center={center} zoom={zoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={UserIcon}>
              <Popup>Your Location</Popup>
            </Marker>
          )}

          {doctors.map((doctor) => (
            doctor.clinicLatitude && doctor.clinicLongitude ? (
              <Marker
                key={doctor.id}
                position={[doctor.clinicLatitude, doctor.clinicLongitude]}
                icon={DefaultIcon}
                eventHandlers={{
                  click: () => onSelectDoctor(doctor),
                }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <h3 className="font-bold text-sm">{doctor.firstName} {doctor.lastName}</h3>
                    <p className="text-xs text-gray-600">{doctor.specialization}</p>
                    <p className="text-xs font-medium">{doctor.clinicName}</p>
                    <div className="mt-2">
                      <Button
                        size="sm"
                        className="w-full h-7 text-xs"
                        onClick={() => onSelectDoctor(doctor)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ) : null
          ))}
        </MapContainer>
    </div>
  )
}

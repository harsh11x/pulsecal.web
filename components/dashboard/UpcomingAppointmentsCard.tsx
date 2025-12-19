import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock } from "lucide-react"
import { format } from "date-fns"
import type { Appointment } from "@/types"
import Link from "next/link"

interface UpcomingAppointmentsCardProps {
  appointments?: Appointment[]
}

export function UpcomingAppointmentsCard({ appointments = [] }: UpcomingAppointmentsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Upcoming Appointments</h3>
        <Link href="/appointments/list">
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </Link>
      </div>
      <div className="space-y-4">
        {!appointments || appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No upcoming appointments</p>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center gap-4 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium">{appointment.patientName || appointment.doctorName}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(appointment.date), "MMM dd, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {appointment.time}
                  </span>
                </div>
              </div>
              <Link href={`/appointments/${appointment.id}`}>
                <Button size="sm">View</Button>
              </Link>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

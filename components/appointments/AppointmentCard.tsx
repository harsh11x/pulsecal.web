import { format, parseISO } from "date-fns"
import { Calendar, Clock, User, MapPin } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getStatusColor } from "@/utils/helpers"
import type { Appointment } from "@/services/appointment.service"

interface AppointmentCardProps {
  appointment: Appointment
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{appointment.doctorName}</h3>
            <p className="text-sm text-muted-foreground">{appointment.reason}</p>
          </div>
          <Badge className={getStatusColor(appointment.status)} variant="secondary">
            {appointment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(parseISO(appointment.date), "PPP")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{appointment.time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{appointment.patientName}</span>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button asChild variant="default" className="flex-1">
          <Link href={`/appointments/${appointment.id}`}>View Details</Link>
        </Button>
        <Button asChild variant="outline" size="icon">
          <Link href={`/appointments/${appointment.id}/directions`}>
            <MapPin className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

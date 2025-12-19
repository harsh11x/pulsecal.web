import { format, parseISO } from "date-fns"
import { Pill, Calendar, User } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Prescription } from "@/services/prescription.service"

interface PrescriptionCardProps {
  prescription: Prescription
}

export function PrescriptionCard({ prescription }: PrescriptionCardProps) {
  const statusColors = {
    active: "bg-success/10 text-success",
    expired: "bg-destructive/10 text-destructive",
    refill_requested: "bg-warning/10 text-warning",
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{prescription.medication}</h3>
            <p className="text-sm text-muted-foreground">{prescription.doctor}</p>
          </div>
          <Badge className={statusColors[prescription.status]} variant="secondary">
            {prescription.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Pill className="h-4 w-4 text-muted-foreground" />
          <span>
            {prescription.dosage} - {prescription.frequency}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(parseISO(prescription.date), "PPP")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>
            Refills: {prescription.refillsRemaining} / {prescription.refills}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button asChild variant="default" className="flex-1">
          <Link href={`/health/prescriptions/${prescription.id}`}>View Details</Link>
        </Button>
        {prescription.status === "active" && prescription.refillsRemaining > 0 && (
          <Button asChild variant="outline" className="flex-1 bg-transparent">
            <Link href={`/health/prescriptions/${prescription.id}/refill`}>Request Refill</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

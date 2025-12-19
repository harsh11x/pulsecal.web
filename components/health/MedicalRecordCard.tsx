import { format, parseISO } from "date-fns"
import { FileText, User, Calendar } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { MedicalRecord } from "@/services/medicalRecord.service"

interface MedicalRecordCardProps {
  record: MedicalRecord
}

export function MedicalRecordCard({ record }: MedicalRecordCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{record.diagnosis}</h3>
            <p className="text-sm text-muted-foreground">{record.doctor}</p>
          </div>
          <FileText className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(parseISO(record.date), "PPP")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{record.patientName}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{record.treatment}</p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="default" className="w-full">
          <Link href={`/health/medical-records/${record.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

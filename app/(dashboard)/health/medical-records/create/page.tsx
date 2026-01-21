"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, Save, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { medicalRecordService } from "@/services/medicalRecord.service"

export default function CreateMedicalRecordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [formData, setFormData] = useState({
    patientId: "1", // Hardcoded for simplified demo, in real app select from list
    diagnosis: "",
    symptoms: "",
    treatment: "",
    medications: "",
    notes: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await medicalRecordService.createMedicalRecord({
        ...formData,
        followUpDate: date
      })
      toast.success("Medical record created successfully")
      router.push("/dashboard") // Or separate records list
    } catch (error) {
      toast.error("Failed to create medical record")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 container py-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">New Medical Record</h1>
          <p className="text-muted-foreground">Create a new patient record</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record Details</CardTitle>
          <CardDescription>Enter diagnosis and treatment information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Input
                placeholder="Primary diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Symptoms</Label>
              <Textarea
                placeholder="Patient symptoms..."
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Treatment Plan</Label>
                <Input
                  placeholder="Prescribed treatment"
                  value={formData.treatment}
                  onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Medications</Label>
                <Input
                  placeholder="Medications prescribed"
                  value={formData.medications}
                  onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Follow-up Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Record...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Record
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

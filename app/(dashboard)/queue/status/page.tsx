"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiService } from "@/services/api"
import { toast } from "sonner"
import { Clock, CheckCircle, Play, XCircle, User, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function QueueStatusPage() {
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        waiting: 0,
        inProgress: 0,
        completed: 0,
        total: 0
    })

    const fetchQueue = async () => {
        try {
            setLoading(true)
            const response: any = await apiService.get("/appointments?date=today")
            const raw = Array.isArray(response) ? response : (response?.appointments ?? response?.data ?? [])
            const data = raw.map((a: any) => ({
                ...a,
                patientName: a.patient ? `${a.patient.firstName || ''} ${a.patient.lastName || ''}`.trim() : a.patientName || 'N/A',
                time: a.scheduledAt ? format(new Date(a.scheduledAt), 'h:mm a') : '',
                patientImage: a.patient?.profileImage,
            }))
            setAppointments(data)

            const statusVal = (s: string) => (a: any) => (a.status || '').toUpperCase() === (s || '').toUpperCase()
            setStats({
                waiting: data.filter((a: any) => statusVal('CONFIRMED')(a) || statusVal('SCHEDULED')(a)).length,
                inProgress: data.filter((a: any) => statusVal('IN_PROGRESS')(a)).length,
                completed: data.filter((a: any) => statusVal('COMPLETED')(a)).length,
                total: data.length
            })
        } catch (error) {
            console.error("Failed to fetch queue:", error)
            toast.error("Failed to load queue data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchQueue()
        // Poll every minute for updates
        const interval = setInterval(fetchQueue, 60000)
        return () => clearInterval(interval)
    }, [])

    const updateStatus = async (id: string, status: string) => {
        try {
            const statusMap: Record<string, string> = {
                checked_in: 'CONFIRMED',
                confirmed: 'CONFIRMED',
                in_progress: 'IN_PROGRESS',
                completed: 'COMPLETED',
            }
            const upper = statusMap[status.toLowerCase()] ?? status.toUpperCase().replace(/-/g, '_')
            await apiService.put(`/appointments/${id}`, { status: upper })
            toast.success(`Appointment marked as ${status.replace('_', ' ')}`)
            fetchQueue()
        } catch (error) {
            console.error("Failed to update status:", error)
            toast.error("Failed to update appointment status")
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-blue-100 text-blue-800'
            case 'checked_in': return 'bg-yellow-100 text-yellow-800'
            case 'in_progress': return 'bg-purple-100 text-purple-800'
            case 'completed': return 'bg-green-100 text-green-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading && appointments.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const s = (x: string) => (a: any) => (a.status || '').toUpperCase() === x.toUpperCase()
    const waitingPatients = appointments.filter(a => ['CONFIRMED', 'CHECKED_IN', 'SCHEDULED'].some(st => s(st)(a)))
    const inProgressPatients = appointments.filter(a => s('IN_PROGRESS')(a))
    const completedPatients = appointments.filter(a => s('COMPLETED')(a))

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Patient Queue</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Waiting</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.waiting}</div>
                        <p className="text-xs text-muted-foreground">Patients in queue</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Play className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.inProgress}</div>
                        <p className="text-xs text-muted-foreground">Currently consulting</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completed}</div>
                        <p className="text-xs text-muted-foreground">Finished today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Appointments today</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="queue" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="queue">Queue List</TabsTrigger>
                    <TabsTrigger value="completed">Completed History</TabsTrigger>
                </TabsList>

                <TabsContent value="queue" className="space-y-4">
                    {/* Current Patient Section */}
                    {inProgressPatients.length > 0 && (
                        <Card className="border-primary/50 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-primary">
                                    <Play className="h-5 w-5 fill-primary" />
                                    Currently Consulting
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {inProgressPatients.map(patient => (
                                    <div key={patient.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-16 w-16 border-2 border-primary">
                                                <AvatarImage src={patient.patientImage} />
                                                <AvatarFallback>{patient.patientName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="text-xl font-bold">{patient.patientName}</h3>
                                                <p className="text-muted-foreground">{patient.time} • {patient.reason || "General Consultation"}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={() => updateStatus(patient.id, 'completed')} className="bg-green-600 hover:bg-green-700">
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Complete Visit
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Waiting List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Up Next</CardTitle>
                            <CardDescription>Patients waiting for consultation</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {waitingPatients.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No patients currently waiting
                                    </div>
                                ) : (
                                    waitingPatients.map((patient) => (
                                        <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="text-center min-w-[60px]">
                                                    <div className="text-sm font-medium text-muted-foreground">Time</div>
                                                    <div className="text-lg font-bold">{patient.time}</div>
                                                </div>
                                                <Avatar>
                                                    <AvatarImage src={patient.patientImage} />
                                                    <AvatarFallback>{patient.patientName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className="font-semibold">{patient.patientName}</h4>
                                                    <Badge variant="outline" className={getStatusColor(patient.status)}>
                                                        {patient.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {(patient.status || '').toUpperCase() === 'SCHEDULED' && (
                                                    <Button size="sm" variant="outline" onClick={() => updateStatus(patient.id, 'checked_in')}>
                                                        Check In
                                                    </Button>
                                                )}
                                                <Button size="sm" onClick={() => updateStatus(patient.id, 'in_progress')}>
                                                    Start Consult
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="completed">
                    <Card>
                        <CardHeader>
                            <CardTitle>Completed Visits</CardTitle>
                            <CardDescription>Patients seen today</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {completedPatients.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No completed appointments yet
                                    </div>
                                ) : (
                                    completedPatients.map((patient) => (
                                        <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg opacity-75">
                                            <div className="flex items-center gap-4">
                                                <div className="text-sm font-medium text-muted-foreground">{patient.time}</div>
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={patient.patientImage} />
                                                    <AvatarFallback>{patient.patientName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className="font-semibold">{patient.patientName}</h4>
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        Completed
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost" asChild>
                                                <a href={`/health/medical-records?patient=${patient.patientId}`}>View Record</a>
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

"use client"

import { useEffect, useState } from "react"
import { DoctorAnalytics } from "@/components/dashboard/DoctorAnalytics"
import { apiService } from "@/services/api"
import { toast } from "sonner"
import { Loader2, Star, MessageSquare, ThumbsUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"

export default function AnalyticsPage() {
    const [stats, setStats] = useState<any>(null)
    const [reviews, setReviews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                // Fetch analytics data
                const analyticsResponse: any = await apiService.get("/doctors/analytics")
                setStats(analyticsResponse.data || null)

                // Use real reviews from analytics response
                if (analyticsResponse.data?.reviews?.recent) {
                    setReviews(analyticsResponse.data.reviews.recent.map((r: any) => ({
                        id: r.id,
                        patientName: r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : "Unknown Patient",
                        rating: r.rating,
                        comment: r.comment,
                        date: r.createdAt,
                        appointmentType: "Appointment" // You might need to fetch this if not in review object
                    })))
                } else {
                    setReviews([])
                }

            } catch (error) {
                console.error("Failed to fetch analytics:", error)
                toast.error("Failed to load analytics data")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Practice Analytics</h1>
                <p className="text-muted-foreground">Comprehensive overview of your clinic's performance</p>
            </div>

            {stats && <DoctorAnalytics data={stats} />}

            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Patient Reviews</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reviews.map((review) => (
                        <Card key={review.id}>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>{review.patientName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-base">{review.patientName}</CardTitle>
                                        <CardDescription>{format(new Date(review.date), "MMM d, yyyy h:mm a")}</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">
                                    <Star className="w-3 h-3 fill-yellow-800 mr-1" />
                                    {review.rating}.0
                                </div>
                            </CardHeader>
                            <CardContent className="mt-4 space-y-2">
                                <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                                <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                                    <span className="bg-secondary px-2 py-1 rounded">
                                        {review.appointmentType}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

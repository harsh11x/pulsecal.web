"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Check, Loader2, X } from "lucide-react"
import { apiService } from "@/services/api"
import { toast } from "sonner"

export function GoogleCalendarConnect() {
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(true)
    const [connected, setConnected] = useState(false)
    const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null)

    useEffect(() => {
        checkConnectionStatus()
    }, [])

    const checkConnectionStatus = async () => {
        try {
            setChecking(true)
            const response: any = await apiService.get("/api/v1/calendar/status")
            setConnected(response.data?.connected || false)
            if (response.data?.tokenExpiry) {
                setTokenExpiry(new Date(response.data.tokenExpiry))
            }
        } catch (error) {
            console.error("Failed to check calendar status:", error)
        } finally {
            setChecking(false)
        }
    }

    const handleConnect = async () => {
        try {
            setLoading(true)

            // Get authorization URL
            const response: any = await apiService.get("/api/v1/calendar/connect")
            const authUrl = response.data?.authUrl

            if (!authUrl) {
                throw new Error("Failed to get authorization URL")
            }

            // Open OAuth popup
            const width = 600
            const height = 700
            const left = window.screen.width / 2 - width / 2
            const top = window.screen.height / 2 - height / 2

            const popup = window.open(
                authUrl,
                "Google Calendar Authorization",
                `width=${width},height=${height},left=${left},top=${top}`
            )

            // Listen for OAuth callback
            const handleMessage = async (event: MessageEvent) => {
                if (event.data.type === "GOOGLE_CALENDAR_AUTH") {
                    const { code } = event.data

                    if (code) {
                        try {
                            // Exchange code for tokens
                            await apiService.post("/api/v1/calendar/callback", { code })
                            toast.success("Google Calendar connected successfully!")
                            setConnected(true)
                            checkConnectionStatus()
                        } catch (error: any) {
                            console.error("Failed to connect calendar:", error)
                            toast.error(error?.response?.data?.message || "Failed to connect Google Calendar")
                        }
                    }

                    popup?.close()
                    window.removeEventListener("message", handleMessage)
                }
            }

            window.addEventListener("message", handleMessage)

            // Check if popup was closed
            const checkPopupClosed = setInterval(() => {
                if (popup?.closed) {
                    clearInterval(checkPopupClosed)
                    window.removeEventListener("message", handleMessage)
                    setLoading(false)
                }
            }, 500)
        } catch (error: any) {
            console.error("Failed to initiate calendar connection:", error)
            toast.error(error?.response?.data?.message || "Failed to connect Google Calendar")
        } finally {
            setLoading(false)
        }
    }

    const handleDisconnect = async () => {
        try {
            setLoading(true)
            await apiService.post("/api/v1/calendar/disconnect")
            toast.success("Google Calendar disconnected")
            setConnected(false)
            setTokenExpiry(null)
        } catch (error: any) {
            console.error("Failed to disconnect calendar:", error)
            toast.error(error?.response?.data?.message || "Failed to disconnect Google Calendar")
        } finally {
            setLoading(false)
        }
    }

    if (checking) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Google Calendar</CardTitle>
                            <CardDescription>Sync appointments to your Google Calendar</CardDescription>
                        </div>
                    </div>
                    {connected ? (
                        <Badge variant="default" className="gap-1">
                            <Check className="h-3 w-3" />
                            Connected
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="gap-1">
                            <X className="h-3 w-3" />
                            Not Connected
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                    {connected ? (
                        <>
                            <p>Your appointments will be automatically synced to your Google Calendar.</p>
                            {tokenExpiry && (
                                <p className="mt-2 text-xs">
                                    Token expires: {tokenExpiry.toLocaleDateString()}
                                </p>
                            )}
                        </>
                    ) : (
                        <p>Connect your Google Calendar to automatically sync appointments and never miss a meeting.</p>
                    )}
                </div>

                {connected ? (
                    <Button
                        variant="outline"
                        onClick={handleDisconnect}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Disconnect Google Calendar
                    </Button>
                ) : (
                    <Button
                        onClick={handleConnect}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Connect Google Calendar
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

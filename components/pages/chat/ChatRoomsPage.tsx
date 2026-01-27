"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MessageSquare } from "lucide-react"
import { toast } from "sonner"

export default function ChatRoomsPage() {
  const handleNewChat = () => {
    toast.info("New Chat feature is coming soon!")
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Chat Rooms</h1>
        <Button onClick={handleNewChat} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
          <Badge variant="secondary" className="ml-2 text-xs">Coming Soon</Badge>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Chat Rooms</CardTitle>
          <CardDescription>View and manage your chat conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Chat Feature Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              We're working on bringing you a seamless chat experience to communicate with your patients and staff.
              Stay tuned for updates!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


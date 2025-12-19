"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function ChatRoomsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Chat Rooms</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Chat Rooms</CardTitle>
          <CardDescription>View and manage your chat conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chat rooms list will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  )
}


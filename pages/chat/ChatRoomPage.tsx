"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

interface ChatRoomPageProps {
  roomId: string
}

export function ChatRoomPage({ roomId }: ChatRoomPageProps) {
  const router = useRouter()

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Chat Room</CardTitle>
          <CardDescription>Room ID: {roomId}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-96 border rounded-lg p-4 overflow-y-auto">
              <p className="text-muted-foreground">Chat messages will be displayed here.</p>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Type a message..." />
              <Button>Send</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


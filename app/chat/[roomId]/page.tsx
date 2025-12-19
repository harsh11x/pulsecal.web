import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { ChatRoomPage } from "@/pages/chat/ChatRoomPage"

export default function ChatRoom({ params }: { params: { roomId: string } }) {
  return (
    <ProtectedRoute>
      <AppLayout>
        <ChatRoomPage roomId={params.roomId} />
      </AppLayout>
    </ProtectedRoute>
  )
}

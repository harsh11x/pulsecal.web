import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { ChatRoomsPage } from "@/pages/chat/ChatRoomsPage"

export default function ChatRooms() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <ChatRoomsPage />
      </AppLayout>
    </ProtectedRoute>
  )
}

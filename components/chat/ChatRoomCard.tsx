"use client"

import { formatRelativeTime } from "@/utils/helpers"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/utils/helpers"
import type { ChatRoom } from "@/services/chat.service"
import { Users } from "lucide-react"

interface ChatRoomCardProps {
  room: ChatRoom
  isActive: boolean
  onClick: () => void
}

export function ChatRoomCard({ room, isActive, onClick }: ChatRoomCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 text-left border-b border-border hover:bg-muted/50 transition-colors ${
        isActive ? "bg-muted" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar>
            <AvatarImage src={room.avatar || "/placeholder.svg"} />
            <AvatarFallback>{getInitials(room.name)}</AvatarFallback>
          </Avatar>
          {room.type === "group" && (
            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
              <Users className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold truncate">{room.name}</h3>
            {room.lastMessageTime && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatRelativeTime(room.lastMessageTime)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground truncate">{room.lastMessage || "No messages yet"}</p>
            {room.unreadCount > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs flex-shrink-0">
                {room.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

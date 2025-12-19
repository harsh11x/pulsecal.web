import { format, parseISO } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/utils/helpers"
import type { ChatMessage as ChatMessageType } from "@/services/chat.service"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: ChatMessageType
  isCurrentUser: boolean
}

export function ChatMessage({ message, isCurrentUser }: ChatMessageProps) {
  return (
    <div className={cn("flex gap-3 mb-4", isCurrentUser && "flex-row-reverse")}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">{getInitials(message.senderName)}</AvatarFallback>
      </Avatar>
      <div className={cn("flex flex-col max-w-[70%]", isCurrentUser && "items-end")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">{message.senderName}</span>
          <span className="text-xs text-muted-foreground">{format(parseISO(message.timestamp), "p")}</span>
        </div>
        <div
          className={cn(
            "rounded-2xl px-4 py-2",
            isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
          )}
        >
          <p className="text-sm">{message.message}</p>
        </div>
      </div>
    </div>
  )
}

export interface ChatRoom {
  id: string
  name: string
  participants: string[]
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
  type: "direct" | "group"
  avatar?: string
}

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string
  message: string
  timestamp: string
  read: boolean
}

const mockRooms: ChatRoom[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    participants: ["1", "d1"],
    lastMessage: "Your test results are ready",
    lastMessageTime: "2024-12-16T10:30:00",
    unreadCount: 2,
    type: "direct",
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    participants: ["1", "d2"],
    lastMessage: "See you at your appointment",
    lastMessageTime: "2024-12-15T14:20:00",
    unreadCount: 0,
    type: "direct",
  },
  {
    id: "3",
    name: "Care Team",
    participants: ["1", "d1", "d2"],
    lastMessage: "Prescription updated",
    lastMessageTime: "2024-12-14T09:15:00",
    unreadCount: 1,
    type: "group",
  },
]

const mockMessages: Record<string, ChatMessage[]> = {
  "1": [
    {
      id: "1",
      roomId: "1",
      senderId: "d1",
      senderName: "Dr. Sarah Johnson",
      message: "Hi! How are you feeling today?",
      timestamp: "2024-12-16T10:00:00",
      read: true,
    },
    {
      id: "2",
      roomId: "1",
      senderId: "1",
      senderName: "John Doe",
      message: "Much better, thank you!",
      timestamp: "2024-12-16T10:15:00",
      read: true,
    },
    {
      id: "3",
      roomId: "1",
      senderId: "d1",
      senderName: "Dr. Sarah Johnson",
      message: "Your test results are ready",
      timestamp: "2024-12-16T10:30:00",
      read: false,
    },
  ],
}

export const chatService = {
  async getChatRooms(): Promise<ChatRoom[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockRooms]), 500)
    })
  },

  async getChatMessages(roomId: string): Promise<ChatMessage[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockMessages[roomId] || []), 500)
    })
  },

  async sendMessage(roomId: string, message: string): Promise<ChatMessage> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          roomId,
          senderId: "1",
          senderName: "John Doe",
          message,
          timestamp: new Date().toISOString(),
          read: false,
        }
        resolve(newMessage)
      }, 500)
    })
  },

  async markAsRead(roomId: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 300)
    })
  },
}

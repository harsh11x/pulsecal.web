"use client"

import { io, type Socket } from "socket.io-client"
import { SOCKET_EVENTS } from "@/utils/constants"
import { getIdToken } from "@/lib/firebaseAuth"

class SocketService {
  private socket: Socket | null = null
  private isConnected = false

  async connect(): Promise<void> {
    if (this.isConnected) return

    // Get Firebase ID token
    const token = await getIdToken()
    if (!token) {
      console.error("[Socket] No authentication token available")
      return
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"

    this.socket = io(socketUrl, {
      auth: { token },
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log("[v0] Socket connected")
      this.isConnected = true
    })

    this.socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log("[v0] Socket disconnected")
      this.isConnected = false
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  on(event: string, callback: (...args: unknown[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  emit(event: string, data?: unknown): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data)
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

export const socketService = new SocketService()

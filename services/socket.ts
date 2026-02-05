"use client"

import { io, type Socket } from "socket.io-client"
import { SOCKET_EVENTS } from "@/utils/constants"
import { getIdToken } from "@/lib/firebaseAuth"

class SocketService {
  private socket: Socket | null = null
  private isConnected = false

  async connect(): Promise<void> {
    if (this.isConnected) return

    // Check if we're on HTTPS - if so, we need HTTPS backend or disable sockets
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL
    
    // If frontend is HTTPS but backend is HTTP, disable socket connections
    if (isHttps && backendUrl && backendUrl.startsWith('http://')) {
      console.warn("[Socket] Frontend is HTTPS but backend is HTTP. Socket connections disabled to avoid mixed content errors.")
      console.warn("[Socket] To enable sockets, configure HTTPS on your backend server.")
      return
    }

    // Get Firebase ID token
    const token = await getIdToken()
    if (!token) {
      console.error("[Socket] No authentication token available")
      return
    }

    // Use HTTPS backend URL if available, otherwise use relative path
    let finalSocketUrl: string
    if (backendUrl && backendUrl.startsWith('https://')) {
      // Use HTTPS backend directly
      finalSocketUrl = backendUrl.replace(/\/$/, '') // Remove trailing slash
      console.log(`[Socket] Connecting to HTTPS backend: ${finalSocketUrl}`)
    } else {
      // Try relative path (won't work for WebSockets but might work for polling)
      finalSocketUrl = "/api/v1"
      console.warn("[Socket] Using relative path - WebSocket connections may not work. Configure HTTPS backend for full functionality.")
    }

    // Connect to /notifications namespace - where appointment:new, notification, etc. are emitted
    const notificationsUrl = finalSocketUrl.replace(/\/$/, '') + '/notifications'
    this.socket = io(notificationsUrl, {
      auth: { token },
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnection: false, // Disable reconnection if backend is HTTP on HTTPS frontend
      reconnectionDelay: 1000,
      reconnectionAttempts: 0,
      transports: ['websocket', 'polling'],
      autoConnect: false, // Don't auto-connect if there's a mixed content issue
    })

    // Only connect if we have a valid HTTPS URL
    if (backendUrl && backendUrl.startsWith('https://')) {
      this.socket.connect()
    } else {
      console.warn("[Socket] Not connecting - backend must use HTTPS when frontend is on HTTPS")
      return
    }

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

"use client"

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { logOut } from '@/lib/firebaseAuth'
import { toast } from 'sonner'

const INACTIVITY_TIMEOUT = 15 * 60 * 1000 // 15 minutes in milliseconds

export function useAutoLogout() {
    const router = useRouter()
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const resetTimer = () => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Set new timeout
        timeoutRef.current = setTimeout(async () => {
            toast.info('Logged out due to inactivity')
            await logOut()
            router.push('/auth/login')
        }, INACTIVITY_TIMEOUT)
    }

    useEffect(() => {
        // Events that indicate user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

        // Reset timer on any user activity
        events.forEach(event => {
            document.addEventListener(event, resetTimer)
        })

        // Start the initial timer
        resetTimer()

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            events.forEach(event => {
                document.removeEventListener(event, resetTimer)
            })
        }
    }, [router])
}

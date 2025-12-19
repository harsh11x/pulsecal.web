import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "./store"
import { useEffect, useState } from "react"

// Safe wrapper to ensure hooks only run on client
const isClient = typeof window !== "undefined"

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()

// Safe selector that only runs on client
export function useAppSelector<T>(selector: (state: RootState) => T): T {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  if (!isMounted || !isClient) {
    // Return a default value during SSR
    return undefined as T
  }
  
  return useSelector(selector)
}

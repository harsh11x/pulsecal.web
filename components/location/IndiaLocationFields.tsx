"use client"

import { useMemo, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { indianStates, getIndianCities } from "@/lib/indianLocations"

type IndiaStateSelectProps = {
  value: string
  onChange: (state: string) => void
  id?: string
  label?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
}

export function IndiaStateSelect({
  value,
  onChange,
  id = "state",
  label = "State",
  required,
  disabled,
  placeholder = "Select State",
}: IndiaStateSelectProps) {
  return (
    <div className="space-y-2">
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required ? " *" : ""}
        </Label>
      ) : null}
      <Select
        value={value || undefined}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {indianStates.map((state) => (
            <SelectItem key={state} value={state}>
              {state}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

type IndiaCitySelectProps = {
  state: string
  value: string
  onChange: (city: string) => void
  id?: string
  label?: string
  required?: boolean
  disabled?: boolean
}

/**
 * City dropdown for a selected Indian state.
 * Includes an in-list search filter (needed for large states like Maharashtra / UP).
 */
export function IndiaCitySelect({
  state,
  value,
  onChange,
  id = "city",
  label = "City",
  required,
  disabled,
}: IndiaCitySelectProps) {
  const [query, setQuery] = useState("")
  const cities = useMemo(() => getIndianCities(state), [state])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cities
    return cities.filter((c) => c.toLowerCase().includes(q))
  }, [cities, query])

  return (
    <div className="space-y-2">
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required ? " *" : ""}
        </Label>
      ) : null}
      <Select
        value={value || undefined}
        onValueChange={(v) => {
          onChange(v)
          setQuery("")
        }}
        disabled={disabled || !state}
        onOpenChange={(open) => {
          if (!open) setQuery("")
        }}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={state ? "Select City" : "Select State First"} />
        </SelectTrigger>
        <SelectContent className="max-h-[320px]">
          {state ? (
            <div className="sticky top-0 z-10 bg-popover p-2 border-b">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${cities.length} cities…`}
                className="h-8"
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          ) : null}
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No cities found</div>
          ) : (
            filtered.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

/** Native <select> variants for pages that already use native selects (e.g. profile). */
export function IndiaStateNativeSelect({
  value,
  onChange,
  id = "state",
  className,
  disabled,
}: {
  value: string
  onChange: (state: string) => void
  id?: string
  className?: string
  disabled?: boolean
}) {
  return (
    <select
      id={id}
      className={className}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select State</option>
      {indianStates.map((state) => (
        <option key={state} value={state}>
          {state}
        </option>
      ))}
    </select>
  )
}

export function IndiaCityNativeSelect({
  state,
  value,
  onChange,
  id = "city",
  className,
  disabled,
}: {
  state: string
  value: string
  onChange: (city: string) => void
  id?: string
  className?: string
  disabled?: boolean
}) {
  const cities = useMemo(() => getIndianCities(state), [state])
  return (
    <select
      id={id}
      className={className}
      value={value}
      disabled={disabled || !state}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{state ? "Select City" : "Select State First"}</option>
      {cities.map((city) => (
        <option key={city} value={city}>
          {city}
        </option>
      ))}
    </select>
  )
}

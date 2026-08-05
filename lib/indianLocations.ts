import { State, City } from "country-state-city"

const INDIA_STATES = State.getStatesOfCountry("IN")

const stateIsoByName: Record<string, string> = Object.fromEntries(
  INDIA_STATES.map((s) => [s.name, s.isoCode])
)

/** All Indian states and union territories (sorted A–Z). */
export const indianStates: string[] = INDIA_STATES.map((s) => s.name).sort((a, b) =>
  a.localeCompare(b)
)

const cityCache = new Map<string, string[]>()

/**
 * All cities for an Indian state/UT (from country-state-city; ~4,200 nationwide).
 * Deduped and sorted alphabetically.
 */
export const getIndianCities = (state: string): string[] => {
  if (!state) return []
  const cached = cityCache.get(state)
  if (cached) return cached

  const iso = stateIsoByName[state]
  if (!iso) {
    cityCache.set(state, [])
    return []
  }

  const cities = [
    ...new Set(City.getCitiesOfState("IN", iso).map((c) => c.name).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b))

  cityCache.set(state, cities)
  return cities
}

/**
 * Backward-compatible map access: citiesByState[stateName] → string[]
 * Lazily resolves from country-state-city.
 */
export const citiesByState: Record<string, string[]> = new Proxy(
  {} as Record<string, string[]>,
  {
    get(_target, prop: string | symbol) {
      if (typeof prop !== "string") return undefined
      return getIndianCities(prop)
    },
    has(_target, prop: string | symbol) {
      return typeof prop === "string" && prop in stateIsoByName
    },
    ownKeys() {
      return indianStates
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (typeof prop !== "string" || !(prop in stateIsoByName)) return undefined
      return { enumerable: true, configurable: true, value: getIndianCities(prop) }
    },
  }
)

/** Flat unique list of every Indian city (for search filters). */
export const getAllIndianCities = (): string[] => {
  const all = new Set<string>()
  for (const state of indianStates) {
    for (const city of getIndianCities(state)) {
      all.add(city)
    }
  }
  return [...all].sort((a, b) => a.localeCompare(b))
}

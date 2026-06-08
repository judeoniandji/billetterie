import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import { getCategory } from '../utils/helpers'

const EventsContext = createContext(null)

export function EventsProvider({ children }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    try {
      const { ok, data } = await api.getEvents()
      if (ok) setEvents(data.evenements || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    const id = setInterval(fetchEvents, 30000)
    return () => clearInterval(id)
  }, [fetchEvents])

  const filterEvents = useCallback((filters) => {
    let list = [...events]
    const { search, lieu, prixMax, category } = filters
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (e) =>
          e.titre.toLowerCase().includes(q) ||
          e.lieu.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q))
      )
    }
    if (lieu) list = list.filter((e) => e.lieu === lieu)
    if (prixMax) list = list.filter((e) => e.prix <= parseInt(prixMax))
    if (category) list = list.filter((e) => getCategory(e) === category)
    return list
  }, [events])

  const getPopular = useCallback(() => {
    return [...events]
      .filter((e) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const d = new Date(e.date)
        d.setHours(0, 0, 0, 0)
        return d >= today && e.places_disponibles > 0
      })
      .sort(
        (a, b) =>
          b.capacite_totale - b.places_disponibles - (a.capacite_totale - a.places_disponibles)
      )
      .slice(0, 6)
  }, [events])

  const getLieux = useCallback(() => [...new Set(events.map((e) => e.lieu))].sort(), [events])
  const getById = useCallback((id) => events.find((e) => e._id === id), [events])

  return (
    <EventsContext.Provider value={{ events, loading, fetchEvents, filterEvents, getPopular, getLieux, getById }}>
      {children}
    </EventsContext.Provider>
  )
}

export function useEvents() {
  const ctx = useContext(EventsContext)
  if (!ctx) throw new Error('useEvents must be used within EventsProvider')
  return ctx
}

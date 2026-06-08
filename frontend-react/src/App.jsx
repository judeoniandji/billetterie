import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { EventsProvider } from './context/EventsContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Booking from './pages/Booking'
import Ticket from './pages/Ticket'
import Reservations from './pages/Reservations'
import AdminDashboard from './pages/AdminDashboard'
import AdminRoute from './components/AdminRoute'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <EventsProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="events" element={<Events />} />
                <Route path="event/:id" element={<EventDetail />} />
                <Route path="booking/:eventId" element={<Booking />} />
                <Route path="booking/:eventId/:reservationId" element={<Booking />} />
                <Route path="ticket/:id" element={<Ticket />} />
                <Route path="reservations" element={<Reservations />} />
                <Route
                  path="admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
              </Route>
            </Routes>
          </EventsProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

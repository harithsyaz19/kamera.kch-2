import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Header } from '@/components/Header';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Catalog } from '@/pages/Catalog';
import { CameraDetail } from '@/pages/CameraDetail';
import { Booking } from '@/pages/Booking';
import { Payment } from '@/pages/Payment';
import { BookingConfirmed } from '@/pages/BookingConfirmed';
import { MyBookings } from '@/pages/MyBookings';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { Terms } from '@/pages/Terms';
import { Toaster } from '@/components/ui/sonner';
import '@/App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/camera/:cameraId" element={<CameraDetail />} />
            <Route path="/terms" element={<Terms />} />
            <Route
              path="/booking/:cameraId"
              element={
                <ProtectedRoute>
                  <Booking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/:bookingId"
              element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking-confirmed/:bookingId"
              element={
                <ProtectedRoute>
                  <BookingConfirmed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

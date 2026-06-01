import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, LogOut, Calendar, LayoutDashboard, Phone } from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <div className="bg-[#6B0F1A] text-white text-xs py-2 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden sm:block">Premium Camera Rental in Kuching</span>
          <a href="tel:+60128797715" className="flex items-center gap-2 hover:text-white/80">
            <Phone size={12} />
            <span className="font-medium">+60 12-879 7715</span>
          </a>
        </div>
      </div>
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
        <div className="px-6 md:px-12 lg:px-16 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
              <span className="text-[#6B0F1A] text-2xl md:text-3xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                kamera<span className="text-neutral-900">.kch</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link
                to="/catalog"
                className="text-neutral-700 hover:text-[#6B0F1A] font-medium transition-colors"
                data-testid="nav-catalog"
              >
                Cameras
              </Link>
              <Link
                to="/terms"
                className="text-neutral-700 hover:text-[#6B0F1A] font-medium transition-colors"
                data-testid="nav-terms"
              >
                Terms
              </Link>
              {user ? (
                <>
                  {user.role === 'admin' ? (
                    <Link
                      to="/admin/dashboard"
                      className="text-neutral-700 hover:text-[#6B0F1A] font-medium transition-colors flex items-center gap-2"
                      data-testid="nav-admin"
                    >
                      <LayoutDashboard size={18} />
                      Admin
                    </Link>
                  ) : (
                    <Link
                      to="/my-bookings"
                      className="text-neutral-700 hover:text-[#6B0F1A] font-medium transition-colors flex items-center gap-2"
                      data-testid="nav-my-bookings"
                    >
                      <Calendar size={18} />
                      My Bookings
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-neutral-700 hover:text-[#6B0F1A] font-medium transition-colors flex items-center gap-2"
                    data-testid="logout-button"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-neutral-700 hover:text-[#6B0F1A] font-medium transition-colors"
                    data-testid="nav-login"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-[#6B0F1A] text-white font-semibold px-6 py-2.5 hover:bg-[#4A0A12] transition-colors"
                    data-testid="nav-register-button"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>

            <button
              className="md:hidden text-neutral-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-neutral-200 pt-4 space-y-3" data-testid="mobile-menu">
              <Link
                to="/catalog"
                className="block text-neutral-700 hover:text-[#6B0F1A] font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-catalog"
              >
                Cameras
              </Link>
              <Link
                to="/terms"
                className="block text-neutral-700 hover:text-[#6B0F1A] font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Terms
              </Link>
              {user ? (
                <>
                  {user.role === 'admin' ? (
                    <Link
                      to="/admin/dashboard"
                      className="block text-neutral-700 hover:text-[#6B0F1A] font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="mobile-admin"
                    >
                      Admin Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/my-bookings"
                      className="block text-neutral-700 hover:text-[#6B0F1A] font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="mobile-my-bookings"
                    >
                      My Bookings
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left text-neutral-700 hover:text-[#6B0F1A] font-medium py-2"
                    data-testid="mobile-logout"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block text-neutral-700 hover:text-[#6B0F1A] font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="mobile-login"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block bg-[#6B0F1A] text-white font-semibold px-6 py-3 text-center hover:bg-[#4A0A12]"
                    data-testid="mobile-register"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
};

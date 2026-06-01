import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Camera, Calendar, ShieldCheck, Truck, MapPin, Phone, ArrowRight } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const Home = () => {
  const [cameras, setCameras] = useState([]);

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/cameras`);
        setCameras(data.slice(0, 4));
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('Failed to load featured cameras:', e?.message || e);
        }
      }
    };
    fetchCameras();
  }, []);

  return (
    <div className="min-h-screen bg-white" data-testid="home-page">
      <section className="relative bg-gradient-to-br from-[#FAF7F2] to-white border-b border-neutral-200">
        <div className="px-6 md:px-12 lg:px-16 py-16 md:py-24 lg:py-32 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-[#6B0F1A]/10 text-[#6B0F1A] text-xs font-bold uppercase tracking-widest px-3 py-1.5 mb-6">
                Premium Camera Rental · Kuching
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 leading-tight" data-testid="hero-heading">
                Rent premium cameras in <span className="text-[#6B0F1A]">Kuching</span> easily
              </h1>
              <p className="text-base md:text-lg text-neutral-600 mb-8 leading-relaxed max-w-xl">
                Professional Canon and DJI cameras available for rent. Real-time availability calendar, 
                transparent pricing, and easy self-pickup or COD service.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/catalog" data-testid="hero-browse-button">
                  <button className="bg-[#6B0F1A] text-white font-semibold px-8 py-4 hover:bg-[#4A0A12] transition-colors flex items-center gap-2 w-full sm:w-auto justify-center">
                    Browse Cameras
                    <ArrowRight size={18} />
                  </button>
                </Link>
                <a href="tel:+60128797715" data-testid="hero-contact-button">
                  <button className="border border-[#6B0F1A] text-[#6B0F1A] font-semibold px-8 py-4 hover:bg-[#6B0F1A] hover:text-white transition-colors flex items-center gap-2 w-full sm:w-auto justify-center">
                    <Phone size={18} />
                    Contact Us
                  </button>
                </a>
              </div>
              <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
                <div>
                  <div className="text-3xl font-bold text-[#6B0F1A]">7+</div>
                  <div className="text-sm text-neutral-600 mt-1">Camera Models</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#6B0F1A]">RM40</div>
                  <div className="text-sm text-neutral-600 mt-1">Starting per day</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#6B0F1A]">24/7</div>
                  <div className="text-sm text-neutral-600 mt-1">Support</div>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {cameras.slice(0, 4).map((camera, idx) => (
                  <div 
                    key={camera.id} 
                    className={`bg-white border border-neutral-200 p-4 ${idx % 2 === 1 ? 'mt-8' : ''}`}
                  >
                    <div className="aspect-square bg-neutral-50 mb-3 overflow-hidden">
                      <img src={camera.image_url} alt={camera.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-xs font-semibold text-[#6B0F1A] mb-1">{camera.brand}</div>
                    <div className="text-sm font-bold text-neutral-900">{camera.name}</div>
                    <div className="text-sm text-neutral-600 mt-1">RM{camera.daily_rate}/day</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase tracking-widest text-[#6B0F1A] mb-3">Why Choose Us</div>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900">A premium rental experience</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="bg-[#FAF7F2] p-8 border border-neutral-200" data-testid="feature-availability">
            <div className="w-12 h-12 bg-[#6B0F1A] text-white flex items-center justify-center mb-4">
              <Calendar size={24} />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-3">Real-Time Availability</h3>
            <p className="text-neutral-600 leading-relaxed">
              See exactly which dates are available for each camera. No double bookings, no surprises.
            </p>
          </div>
          <div className="bg-[#FAF7F2] p-8 border border-neutral-200" data-testid="feature-equipment">
            <div className="w-12 h-12 bg-[#6B0F1A] text-white flex items-center justify-center mb-4">
              <Camera size={24} />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-3">Premium Equipment</h3>
            <p className="text-neutral-600 leading-relaxed">
              Canon and DJI cameras, professionally maintained and ready for your creative projects.
            </p>
          </div>
          <div className="bg-[#FAF7F2] p-8 border border-neutral-200" data-testid="feature-pickup">
            <div className="w-12 h-12 bg-[#6B0F1A] text-white flex items-center justify-center mb-4">
              <Truck size={24} />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-3">Flexible Pickup</h3>
            <p className="text-neutral-600 leading-relaxed">
              Free self-pickup at our locations or COD service for just RM15 extra.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#FAF7F2] py-16 md:py-24 border-y border-neutral-200">
        <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#6B0F1A] mb-3">Featured</div>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900">Popular cameras</h2>
            </div>
            <Link to="/catalog" className="hidden md:flex items-center gap-2 text-[#6B0F1A] font-semibold hover:gap-3 transition-all" data-testid="view-all-link">
              View all <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cameras.map((camera) => (
              <Link
                key={camera.id}
                to={`/camera/${camera.id}`}
                className="bg-white border border-neutral-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all"
                data-testid={`featured-camera-${camera.id}`}
              >
                <div className="aspect-square bg-neutral-50 mb-4 overflow-hidden">
                  <img src={camera.image_url} alt={camera.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-[#6B0F1A] mb-1">
                  {camera.brand}
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">{camera.name}</h3>
                <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-neutral-200">
                  <span className="text-2xl font-bold text-[#6B0F1A]">RM{camera.daily_rate}</span>
                  <span className="text-sm text-neutral-500">/ day</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10 md:hidden">
            <Link to="/catalog" data-testid="view-all-mobile-button">
              <button className="bg-[#6B0F1A] text-white font-semibold px-8 py-4 hover:bg-[#4A0A12]">
                View All Cameras
              </button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase tracking-widest text-[#6B0F1A] mb-3">How It Works</div>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900">Simple 4-step booking</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Choose Camera', desc: 'Select your preferred camera and rental dates from our calendar.' },
            { step: '02', title: 'Verification', desc: 'Provide your details and IC for security verification.' },
            { step: '03', title: 'Accept Terms', desc: 'Review and accept our rental terms and conditions.' },
            { step: '04', title: 'Pay & Pickup', desc: 'Pay 50% deposit, choose pickup or COD, upload receipt.' },
          ].map((item) => (
            <div key={item.step} className="border border-neutral-200 p-6 relative">
              <div className="text-5xl font-bold text-[#6B0F1A]/15 absolute top-4 right-4" style={{ fontFamily: "'Playfair Display', serif" }}>{item.step}</div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3 relative z-10">{item.title}</h3>
              <p className="text-neutral-600 text-sm leading-relaxed relative z-10">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#6B0F1A] text-white py-16">
        <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to start shooting?</h2>
              <p className="text-white/80 text-lg">Browse our camera fleet and book your dates today.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 md:justify-end">
              <Link to="/catalog">
                <button className="bg-white text-[#6B0F1A] font-semibold px-8 py-4 hover:bg-neutral-100 w-full sm:w-auto">
                  Browse Cameras
                </button>
              </Link>
              <a href="https://wa.me/60128797715" target="_blank" rel="noopener noreferrer">
                <button className="border border-white text-white font-semibold px-8 py-4 hover:bg-white/10 w-full sm:w-auto">
                  WhatsApp Us
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-neutral-900 text-white py-12">
        <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                kamera<span className="text-[#D4A39A]">.kch</span>
              </div>
              <p className="text-white/60 text-sm">Premium camera rental service in Kuching, Sarawak.</p>
            </div>
            <div>
              <h3 className="font-bold mb-3 text-sm uppercase tracking-widest">Contact</h3>
              <div className="space-y-2 text-sm text-white/60">
                <a href="tel:+60128797715" className="flex items-center gap-2 hover:text-white">
                  <Phone size={14} /> +60 12-879 7715
                </a>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  <div>SK Jalan Muara Tuang<br/>Federal Park Matang</div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-3 text-sm uppercase tracking-widest">Information</h3>
              <div className="space-y-2 text-sm text-white/60">
                <Link to="/catalog" className="block hover:text-white">All Cameras</Link>
                <Link to="/terms" className="block hover:text-white">Terms & Conditions</Link>
                <Link to="/login" className="block hover:text-white">Customer Login</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-sm text-white/40">
            © 2026 kamera.kch · All rights reserved
          </div>
        </div>
      </footer>
    </div>
  );
};

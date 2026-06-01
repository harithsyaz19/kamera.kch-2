import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const Catalog = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/cameras`);
        setCameras(data);
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('Failed to load cameras:', e?.message || e);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCameras();
  }, []);

  const filteredCameras = filter === 'all'
    ? cameras
    : cameras.filter((c) => c.brand.toLowerCase() === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-600">Loading cameras...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="catalog-page">
      <div className="bg-[#FAF7F2] border-b border-neutral-200 py-12 md:py-16">
        <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-[#6B0F1A] mb-3">Camera Fleet</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4" data-testid="catalog-heading">
            Browse our cameras
          </h1>
          <p className="text-base md:text-lg text-neutral-600 max-w-2xl">
            Professional Canon and DJI cameras for your creative projects. Real-time availability shown on each camera page.
          </p>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto py-8 md:py-12">
        <div className="flex flex-wrap gap-3 mb-8">
          {['all', 'canon', 'dji'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 text-sm font-semibold transition-colors ${
                filter === f
                  ? 'bg-[#6B0F1A] text-white'
                  : 'border border-neutral-300 text-neutral-700 hover:border-[#6B0F1A] hover:text-[#6B0F1A]'
              }`}
              data-testid={`filter-${f}`}
            >
              {f === 'all' ? 'All Cameras' : f.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredCameras.map((camera) => (
            <Link
              key={camera.id}
              to={`/camera/${camera.id}`}
              className="group bg-white border border-neutral-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              data-testid={`catalog-camera-${camera.id}`}
            >
              <div className="aspect-[4/3] bg-neutral-50 overflow-hidden">
                <img
                  src={camera.image_url}
                  alt={camera.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <div className="text-xs font-bold uppercase tracking-widest text-[#6B0F1A] mb-2">
                  {camera.brand} · {camera.model}
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-3">
                  {camera.name}
                </h2>
                <p className="text-sm text-neutral-600 leading-relaxed mb-5">
                  {camera.specs}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                  <div>
                    <div className="text-2xl font-bold text-[#6B0F1A]">RM{camera.daily_rate}</div>
                    <div className="text-xs text-neutral-500">per day</div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-neutral-900 group-hover:text-[#6B0F1A]">
                    Book Now
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

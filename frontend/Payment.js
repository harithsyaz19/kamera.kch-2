import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-6 py-12" data-testid="register-page">
      <div className="w-full max-w-md">
        <div className="bg-white border border-neutral-200 p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2" data-testid="register-heading">
            Create account
          </h1>
          <p className="text-neutral-600 mb-8">
            Join kamera.kch to start renting cameras
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm" data-testid="register-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-neutral-900 mb-2 block">Full Name</label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-neutral-300 focus:border-[#6B0F1A] text-neutral-900"
                data-testid="register-name-input"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-900 mb-2 block">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-neutral-300 focus:border-[#6B0F1A] text-neutral-900"
                data-testid="register-email-input"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-900 mb-2 block">Password</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-neutral-300 focus:border-[#6B0F1A] text-neutral-900"
                data-testid="register-password-input"
              />
              <p className="text-xs text-neutral-500 mt-1">Minimum 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6B0F1A] text-white font-semibold px-8 py-4 hover:bg-[#4A0A12] disabled:opacity-50"
              data-testid="register-submit-button"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-600">
            Already have an account?{' '}
            <Link to="/login" className="text-[#6B0F1A] hover:underline font-semibold" data-testid="register-login-link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate(from);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-6 py-12" data-testid="login-page">
      <div className="w-full max-w-md">
        <div className="bg-white border border-neutral-200 p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2" data-testid="login-heading">
            Welcome back
          </h1>
          <p className="text-neutral-600 mb-8">
            Log in to your kamera.kch account
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm" data-testid="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-neutral-900 mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-300 focus:border-[#6B0F1A] text-neutral-900"
                data-testid="login-email-input"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-900 mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-300 focus:border-[#6B0F1A] text-neutral-900"
                data-testid="login-password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6B0F1A] text-white font-semibold px-8 py-4 hover:bg-[#4A0A12] disabled:opacity-50"
              data-testid="login-submit-button"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#6B0F1A] hover:underline font-semibold" data-testid="login-register-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

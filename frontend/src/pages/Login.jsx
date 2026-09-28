import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import BrandLogo from '../components/BrandLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path or default to appropriate dashboard
  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const response = await login(email, password);
      // Navigate to the dashboard or original destination
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate('/app');
      }
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError("Unable to connect to backend API (http://localhost:3000). Please make sure the backend server is running.");
      } else if (err.response?.status === 403) {
        setError("Your account is not active. It may be waiting for approval, or it may have been deactivated. Contact the administrator.");
      } else {
        setError(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card auth-card-login">
      <div className="auth-card-header">
        <BrandLogo className="mb-6" />
        <h1 className="auth-card-title">Welcome back</h1>
        <p className="auth-card-subtitle">Sign in to your official account</p>
      </div>

      {error && (
        <div className="alert alert-info" style={{ backgroundColor: 'var(--color-status-red-bg)', borderColor: 'var(--color-status-red)', color: '#b91c1c' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {location.state?.message && !error && (
        <div className="alert alert-info">
          <ShieldCheck size={20} />
          <span>{location.state.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <Input
          label="Email Address"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="officer@propertynexus.gov"
          required
          autoFocus
          autoComplete="email"
          disabled={loading}
        />
        
        <Input
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          required
          autoComplete="current-password"
          disabled={loading}
        />

        <div style={{ marginTop: 'var(--space-6)' }}>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !email || !password}
            icon={<ArrowRight size={18} />}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted">
          Need an account? <Link to="/signup" className="btn-link">Request access</Link>
        </p>
      </div>
    </div>
  );
}

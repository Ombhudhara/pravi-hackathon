import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Shield, Wrench, Building } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import BrandLogo from '../components/BrandLogo';
import { signup, handleApiError } from '../services/auth';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: '',
    requestedRole: 'OFFICER',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const setRole = (role) => {
    setFormData(prev => ({ ...prev, requestedRole: role }));
    if (fieldErrors.requestedRole) {
      setFieldErrors(prev => ({ ...prev, requestedRole: null }));
    }
  };

  const validateLocal = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.department.trim()) errors.department = 'Department is required';
    if (!formData.password) errors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (!formData.acceptTerms) errors.acceptTerms = 'You must accept the terms';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateLocal()) return;

    setLoading(true);
    try {
      const response = await signup(formData);
      // Navigate to login with success message
      navigate('/login', { 
        state: { 
          message: response.message || 'Your request has been received. An administrator must approve your account.' 
        } 
      });
    } catch (err) {
      const parsed = handleApiError(err);
      if (parsed.fieldErrors) {
        const fErrors = {};
        parsed.fieldErrors.forEach(e => { fErrors[e.field] = e.message; });
        setFieldErrors(fErrors);
      }
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  // Password requirement checks
  const pwd = formData.password;
  const reqs = [
    { label: '10+ chars', met: pwd.length >= 10 },
    { label: 'Uppercase', met: /[A-Z]/.test(pwd) },
    { label: 'Lowercase', met: /[a-z]/.test(pwd) },
    { label: 'Number', met: /[0-9]/.test(pwd) },
    { label: 'Symbol', met: /[^A-Za-z0-9]/.test(pwd) }
  ];

  return (
    <div className="auth-card auth-card-signup">
      <div className="auth-card-header">
        <BrandLogo className="mb-4" />
        <h1 className="auth-card-title">Request Access</h1>
        <p className="auth-card-subtitle">Create your official account</p>
      </div>

      {error && (
        <div className="alert alert-info" style={{ backgroundColor: 'var(--color-status-red-bg)', borderColor: 'var(--color-status-red)', color: '#b91c1c' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <Input
            label="Full Name"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            error={fieldErrors.fullName}
            placeholder="John Doe"
            disabled={loading}
          />
          <Input
            label="Department"
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            error={fieldErrors.department}
            placeholder="e.g. Revenue Dept"
            disabled={loading}
          />
        </div>

        <Input
          label="Official Email Address"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={fieldErrors.email}
          placeholder="name@propertynexus.gov"
          disabled={loading}
        />

        <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
          <label className="form-label">Role Requested</label>
          <div className="auth-radio-group">
            <div 
              className={`auth-radio-option ${formData.requestedRole === 'OFFICER' ? 'selected' : ''}`}
              onClick={() => !loading && setRole('OFFICER')}
            >
              <input 
                type="radio" 
                name="role" 
                checked={formData.requestedRole === 'OFFICER'} 
                readOnly
                disabled={loading}
              />
              <div className="auth-radio-content">
                <span className="auth-radio-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Shield size={16} /> Data Officer
                </span>
                <span className="auth-radio-desc">Can register and update properties, view all records.</span>
              </div>
            </div>
            
            <div 
              className={`auth-radio-option ${formData.requestedRole === 'MAINTENANCE' ? 'selected' : ''}`}
              onClick={() => !loading && setRole('MAINTENANCE')}
            >
              <input 
                type="radio" 
                name="role" 
                checked={formData.requestedRole === 'MAINTENANCE'} 
                readOnly
                disabled={loading}
              />
              <div className="auth-radio-content">
                <span className="auth-radio-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Wrench size={16} /> Maintenance Staff
                </span>
                <span className="auth-radio-desc">Can view assigned properties and report maintenance issues.</span>
              </div>
            </div>
          </div>
          {fieldErrors.requestedRole && <span className="form-error-text">{fieldErrors.requestedRole}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={fieldErrors.password}
              disabled={loading}
            />
            {pwd.length > 0 && (
              <ul className="pwd-req-list">
                {reqs.map((req, i) => (
                  <li key={i} className={`pwd-req-item ${req.met ? 'met' : 'unmet'}`}>
                    {req.met ? <Check size={12} /> : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid currentColor' }} />}
                    {req.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Input
            label="Confirm Password"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={fieldErrors.confirmPassword}
            disabled={loading}
          />
        </div>

        <div className="auth-checkbox-group">
          <input 
            type="checkbox" 
            id="acceptTerms" 
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleChange}
            disabled={loading}
          />
          <label htmlFor="acceptTerms" className="auth-checkbox-label">
            I agree to the <Link to="/terms" className="btn-link">Terms and Conditions</Link> and <Link to="/privacy" className="btn-link">Privacy Policy</Link>. I understand this system is for official government use only.
          </label>
        </div>
        {fieldErrors.acceptTerms && <div className="form-error-text" style={{ marginTop: '-1rem', marginBottom: '1rem' }}>{fieldErrors.acceptTerms}</div>}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading || !formData.acceptTerms}
        >
          {loading ? 'Submitting Request...' : 'Submit Request'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted">
          Already have an account? <Link to="/login" className="btn-link">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}

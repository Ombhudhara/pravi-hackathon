import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchApi } from '../services/api';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { Save } from 'lucide-react';

export default function ChangePassword() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validatePassword = (pass) => {
    if (pass.length < 10) return false;
    if (!/[a-zA-Z]/.test(pass)) return false;
    if (!/[0-9]/.test(pass)) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (!validatePassword(newPassword)) {
      setError('Password must be at least 10 characters and contain at least one letter and one number.');
      return;
    }

    setLoading(true);
    try {
      await fetchApi('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      setSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err.data && err.data.errors) {
        setError(err.data.errors[0].message);
      } else {
        setError(err.message || 'Failed to update password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Change Password" />
      <Card style={{ maxWidth: '500px' }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger" style={{ backgroundColor: 'var(--color-status-red-bg)', color: 'var(--color-status-red)', borderColor: 'var(--color-status-red)' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success" style={{ backgroundColor: 'var(--color-status-green-bg)', color: 'var(--color-status-green)', borderColor: 'var(--color-status-green)' }}>
              {success}
            </div>
          )}
          
          <Input 
            id="currentPassword"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input 
            id="newPassword"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Minimum 10 characters, at least 1 letter and 1 number."
            required
          />
          <Input 
            id="confirmPassword"
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <div style={{ marginTop: '1.5rem' }}>
            <Button type="submit" disabled={loading} icon={<Save size={16} />}>
              {loading ? 'Saving...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

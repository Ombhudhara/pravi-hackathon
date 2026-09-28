import React from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div style={{ paddingTop: '4rem' }}>
      <EmptyState
        title="Unauthorized Access"
        description="You do not have permission to view this page."
        icon={<ShieldAlert size={48} color="var(--color-status-red)" />}
        action={
          <Button variant="primary" onClick={() => navigate('/app')}>
            Return to Dashboard
          </Button>
        }
      />
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ paddingTop: '4rem' }}>
      <EmptyState
        title="Page Not Found"
        description="The page you are looking for does not exist or has been moved."
        icon={<FileQuestion size={48} />}
        action={
          <Button variant="primary" onClick={() => navigate('/')}>
            Return to Homepage
          </Button>
        }
      />
    </div>
  );
}

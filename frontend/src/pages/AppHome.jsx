import React from 'react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';

export default function AppHome() {
  const { user } = useAuth();
  
  return (
    <div>
      <PageHeader 
        title={`Welcome, ${user?.full_name}`} 
        description="This is the application placeholder." 
      />
      <Card>
        <p>Your role is: <strong>{user?.role}</strong></p>
        <p>Department: {user?.department || 'N/A'}</p>
        <p style={{ marginTop: '1rem' }}>
          <em>The full app shell (sidebar, navigation, dashboard) will be added in Module 3.</em>
        </p>
      </Card>
    </div>
  );
}

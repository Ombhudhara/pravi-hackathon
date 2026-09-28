import React from 'react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { Wrench } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Maintenance() {
  useDocumentTitle();

  return (
    <div>
      <PageHeader 
        title="Maintenance" 
        description="Tracking and management of asset maintenance tickets. Available in a later release."
      />
      <EmptyState 
        title="Maintenance Not Available"
        description="The maintenance module has not been built yet. Please check back in a future update."
        icon={<Wrench size={48} />}
      />
    </div>
  );
}

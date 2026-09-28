import React from 'react';
import { FileQuestion } from 'lucide-react';

// Props: title, description, icon (lucide component), action (button element)
export default function EmptyState({ title, description, icon, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon || <FileQuestion size={48} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

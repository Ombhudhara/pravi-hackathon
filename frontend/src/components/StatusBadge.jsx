import React from 'react';
import Badge from './Badge';
import { getStatusLabel } from '../config/labels';

export default function StatusBadge({ status }) {
  let variant = 'neutral';
  
  if (['ACTIVE'].includes(status)) variant = 'green';
  else if (['VACANT'].includes(status)) variant = 'amber';
  else if (['UNDER_MAINTENANCE'].includes(status)) variant = 'red';
  else if (['RETIRED', 'TRANSFERRED', 'DISPOSED', 'AVAILABLE'].includes(status)) variant = 'neutral';

  return <Badge variant={variant}>{getStatusLabel(status)}</Badge>;
}

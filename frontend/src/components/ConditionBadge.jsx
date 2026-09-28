import React from 'react';
import Badge from './Badge';
import { getConditionLabel } from '../config/labels';

export default function ConditionBadge({ condition }) {
  let variant = 'neutral';
  
  if (condition === 'GOOD') variant = 'green';
  else if (condition === 'NEEDS_ATTENTION') variant = 'amber';
  else if (condition === 'CRITICAL') variant = 'red';
  
  return <Badge variant={variant}>{getConditionLabel(condition)}</Badge>;
}

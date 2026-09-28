import React from 'react';
import { getTypeLabel } from '../config/labels';

export default function TypeLabel({ type }) {
  return <span>{getTypeLabel(type)}</span>;
}

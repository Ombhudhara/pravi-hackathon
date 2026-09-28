import React from 'react';
import ConditionBadge from './ConditionBadge';

export default function ConditionBreakdown({ inspection }) {
  if (!inspection) {
    return <p className="condition-breakdown-empty">No inspection recorded</p>;
  }

  const items = [
    { label: 'Building', val: inspection.buildingCondition },
    { label: 'Electricity', val: inspection.electricity },
    { label: 'Water', val: inspection.water },
    { label: 'Plumbing', val: inspection.plumbing },
    { label: 'Fire Safety', val: inspection.fireSafety },
  ];

  return (
    <div className="condition-breakdown">
      <div className="condition-breakdown-overall">
        <span>Overall condition</span>
        <ConditionBadge condition={inspection.overallCondition} />
      </div>
      <table className="condition-breakdown-table" aria-label="Latest inspection condition components">
        <tbody>
          {items.map((item) => (
            <tr key={item.label}>
              <th scope="row">{item.label}</th>
              <td><ConditionBadge condition={item.val} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

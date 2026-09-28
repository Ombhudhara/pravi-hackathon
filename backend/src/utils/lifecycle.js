/**
 * Lifecycle rules mapping
 */

export function determineLifecycleStages(assetStatus, events) {
  const stages = [
    { key: 'ACQUIRED', label: 'Acquired', reached: false, reachedAt: null },
    { key: 'REGISTERED', label: 'Registered', reached: false, reachedAt: null },
    { key: 'ALLOCATED', label: 'Allocated', reached: false, reachedAt: null },
    { key: 'IN_USE', label: 'In use', reached: false, reachedAt: null },
    { key: 'INSPECTED', label: 'Inspected', reached: false, reachedAt: null },
    { key: 'MAINTENANCE', label: 'Maintenance', reached: false, reachedAt: null },
    { key: 'RETIRED', label: 'Retired', reached: false, reachedAt: null }
  ];

  // Map events to find if they are reached
  for (const event of events) {
    const type = event.event_type;
    const date = event.event_date;
    const meta = typeof event.metadata === 'string' ? JSON.parse(event.metadata) : (event.metadata || {});
    
    if (type === 'ACQUIRED') updateStage(stages, 'ACQUIRED', date);
    if (type === 'REGISTERED') updateStage(stages, 'REGISTERED', date);
    if (type === 'ALLOCATED' || type === 'RE_ALLOCATED') updateStage(stages, 'ALLOCATED', date);
    if (type === 'INSPECTED') updateStage(stages, 'INSPECTED', date);
    if (type === 'MAINTENANCE_STARTED') updateStage(stages, 'MAINTENANCE', date);
    
    if (meta.toStatus === 'ACTIVE') updateStage(stages, 'IN_USE', date);
  }

  // Also IN_USE if currently ACTIVE
  if (assetStatus === 'ACTIVE') {
    updateStage(stages, 'IN_USE', new Date());
  }
  
  if (['RETIRED', 'TRANSFERRED', 'DISPOSED'].includes(assetStatus)) {
    updateStage(stages, 'RETIRED', new Date()); // Ideally we use the updated_at or status change event
  }

  // Current stage from asset status
  let currentStage = 'Unknown';
  switch(assetStatus) {
    case 'ACTIVE': currentStage = 'In use'; break;
    case 'VACANT': currentStage = 'Vacant'; break;
    case 'UNDER_MAINTENANCE': currentStage = 'Under maintenance'; break;
    case 'AVAILABLE': currentStage = 'Available'; break;
    case 'RETIRED': currentStage = 'Retired'; break;
    case 'TRANSFERRED': currentStage = 'Transferred'; break;
    case 'DISPOSED': currentStage = 'Disposed'; break;
  }

  return { currentStage, stages };
}

function updateStage(stages, key, date) {
  const stage = stages.find(s => s.key === key);
  if (stage) {
    if (!stage.reached) {
      stage.reached = true;
      stage.reachedAt = date;
    } else {
      // keep the earliest date? or the latest? API requirements usually want "reachedAt" to be earliest or latest. Let's just set if not set.
      const existing = new Date(stage.reachedAt);
      const incoming = new Date(date);
      if (incoming > existing) {
        stage.reachedAt = date;
      }
    }
  }
}

import { 
  LayoutDashboard, 
  Building, 
  Map as MapIcon, 
  ClipboardCheck, 
  Wrench, 
  History, 
  PieChart, 
  Users 
} from 'lucide-react';

export const NAVIGATION = [
  {
    label: 'Dashboard',
    path: '/app',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'OFFICER', 'MAINTENANCE']
  },
  {
    label: 'Asset Inventory',
    path: '/app/assets',
    icon: Building,
    roles: ['ADMIN', 'OFFICER']
  },
  {
    label: 'Map View',
    path: '/app/map',
    icon: MapIcon,
    roles: ['ADMIN', 'OFFICER']
  },
  {
    label: 'Inspections',
    path: '/app/inspections',
    icon: ClipboardCheck,
    roles: ['ADMIN', 'OFFICER']
  },
  {
    label: 'Maintenance',
    path: '/app/maintenance',
    icon: Wrench,
    roles: ['ADMIN', 'OFFICER', 'MAINTENANCE']
  },
  {
    label: 'Lifecycle History',
    path: '/app/lifecycle',
    icon: History,
    roles: ['ADMIN', 'OFFICER']
  },
  {
    label: 'Analytics',
    path: '/app/analytics',
    icon: PieChart,
    roles: ['ADMIN', 'OFFICER']
  },
  {
    group: 'Administration',
    label: 'Users',
    path: '/app/users',
    icon: Users,
    roles: ['ADMIN']
  }
];

export function getNavItemsForRole(role) {
  return NAVIGATION.filter(item => item.roles.includes(role));
}

export function findNavItemByPath(path) {
  if (path === '/app') {
    return NAVIGATION.find(item => item.path === '/app');
  }
  
  // Find exact match or match base path (like /app/assets/123 -> /app/assets)
  const matches = NAVIGATION.filter(item => path.startsWith(item.path) && item.path !== '/app');
  if (matches.length > 0) {
    // Return longest match
    return matches.reduce((prev, current) => prev.path.length > current.path.length ? prev : current);
  }
  
  return null;
}

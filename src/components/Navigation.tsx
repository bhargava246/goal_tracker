import React from 'react';
import { Home, Clock, BookOpen, Target, BarChart2 } from 'lucide-react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors w-full ${isActive
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Navigation({ activeView, onViewChange }: NavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { id: 'goals', label: 'Goals', icon: <Target className="h-5 w-5" /> },
    { id: 'time', label: 'Time Tracker', icon: <Clock className="h-5 w-5" /> },
    { id: 'journal', label: 'Journal', icon: <BookOpen className="h-5 w-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="h-5 w-5" /> },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <div className="space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeView === item.id}
            onClick={() => onViewChange(item.id)}
          />
        ))}
      </div>
    </nav>
  );
}
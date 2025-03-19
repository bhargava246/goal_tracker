import React from 'react';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import GoalList from './GoalList';
import TimeTracker from './TimeTracker';
import Analytics from './Analytics';
import Journal from './Journal';
import Navigation from './Navigation';
import DailyGoals from './DailyGoals';
import { Moon, Sun, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [activeView, setActiveView] = React.useState('dashboard');

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back!</h1>
          <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3">
          <Navigation activeView={activeView} onViewChange={setActiveView} />
        </div>
        <div className="lg:col-span-9">
          {activeView === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <Analytics />
                <div className="mt-8">
                  <Journal />
                </div>
              </div>
              <div className="lg:col-span-4">
                <DailyGoals />
                <div className="mt-8">
                  <TimeTracker />
                </div>
              </div>
            </div>
          )}
          {activeView === 'goals' && <GoalList />}
          {activeView === 'time' && <TimeTracker />}
          {activeView === 'journal' && <Journal />}
          {activeView === 'analytics' && <Analytics />}
        </div>
      </div>


    </div>
  );
}
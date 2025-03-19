import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { startOfWeek, eachDayOfInterval, format, addDays, subDays } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Analytics() {
  const { user } = useAuth();
  const today = new Date();
  const weekStart = startOfWeek(today);
  const lastWeek = subDays(weekStart, 7);

  const { data: timeEntries, isLoading: isLoadingEntries } = useQuery({
    queryKey: ['time_entries', 'weekly'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          goals (
            title,
            daily_target_minutes,
            category
          )
        `)
        .gte('date', lastWeek.toISOString())
        .lte('date', today.toISOString());

      if (error) throw error;
      return data;
    },
  });

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  // Daily progress chart data
  const dailyProgressData = weekDays.map(day => {
    const dayEntries = timeEntries?.filter(
      entry => entry.date === format(day, 'yyyy-MM-dd')
    ) || [];

    const actual = dayEntries.reduce(
      (sum, entry) => sum + entry.duration_minutes,
      0
    );

    const target = dayEntries[0]?.goals?.daily_target_minutes || 0;

    return {
      date: format(day, 'EEE'),
      actual,
      target,
    };
  });

  // Goal completion pie chart data
  const goalCompletionData = goals?.map(goal => {
    const totalMinutes = timeEntries?.filter(
      entry => entry.goal_id === goal.id
    ).reduce((sum, entry) => sum + entry.duration_minutes, 0) || 0;

    const targetMinutes = goal.daily_target_minutes * 7; // Weekly target
    const percentage = Math.min((totalMinutes / targetMinutes) * 100, 100);

    return {
      name: goal.title,
      value: percentage,
    };
  }) || [];

  // Category distribution data
  const categoryData = timeEntries?.reduce((acc: any[], entry) => {
    const category = entry.goals?.category || 'Uncategorized';
    const existing = acc.find(item => item.name === category);
    
    if (existing) {
      existing.value += entry.duration_minutes;
    } else {
      acc.push({ name: category, value: entry.duration_minutes });
    }
    
    return acc;
  }, []) || [];

  if (isLoadingEntries) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Daily Progress Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Daily Progress</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="actual" name="Actual Minutes" fill="#3B82F6" />
              <Bar dataKey="target" name="Target Minutes" fill="#93C5FD" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Goal Completion Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Goal Completion (%)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={goalCompletionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                >
                  {goalCompletionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Time by Category</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${Math.round(value)}m`}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
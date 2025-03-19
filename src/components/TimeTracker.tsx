import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Play, Pause, Save, Clock, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '../types/supabase';
import { format } from 'date-fns';

type TimeEntry = Database['public']['Tables']['time_entries']['Row'];
type TimeEntryInsert = Database['public']['Tables']['time_entries']['Insert'];

interface ManualTimeEntry {
  hours: number;
  minutes: number;
  goal_id: string;
  notes?: string;
}

export default function TimeTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ManualTimeEntry>();
  
  const { data: timeEntries } = useQuery({
    queryKey: ['time_entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*, goals(title)')
        .order('date', { ascending: false });
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
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  const updateTimeEntry = useMutation({
    mutationFn: async (data: { id: string } & Partial<TimeEntryInsert>) => {
      const { error } = await supabase
        .from('time_entries')
        .update(data)
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_entries'] });
      toast.success('Time entry updated successfully');
      setEditingEntry(null);
    },
    onError: () => {
      toast.error('Failed to update time entry');
    },
  });

  const createTimeEntry = useMutation({
    mutationFn: async (data: TimeEntryInsert) => {
      const { error } = await supabase
        .from('time_entries')
        .insert([{ ...data, user_id: user!.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_entries'] });
      toast.success('Time entry saved successfully');
      reset();
      setElapsedTime(0);
      setIsTracking(false);
      setStartTime(null);
      setIsManualEntry(false);
    },
    onError: () => {
      toast.error('Failed to save time entry');
    },
  });

  React.useEffect(() => {
    let interval: number;
    if (isTracking && startTime) {
      interval = window.setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(diff);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const toggleTimer = () => {
    if (!isTracking) {
      setStartTime(new Date());
      setIsTracking(true);
      setIsManualEntry(false);
    } else {
      setIsTracking(false);
    }
  };

  const onSubmit = (data: ManualTimeEntry) => {
    if (isManualEntry) {
      const totalMinutes = (Number(data.hours) * 60) + Number(data.minutes);
      if (totalMinutes <= 0) {
        toast.error('Please enter a valid time');
        return;
      }
      
      createTimeEntry.mutate({
        goal_id: data.goal_id,
        notes: data.notes,
        duration_minutes: totalMinutes,
        user_id: user!.id,
        date: format(new Date(), 'yyyy-MM-dd'),
      });
    } else if (elapsedTime > 0) {
      createTimeEntry.mutate({
        goal_id: data.goal_id,
        notes: data.notes,
        duration_minutes: Math.max(1, Math.round(elapsedTime / 60)),
        user_id: user!.id,
        date: format(new Date(), 'yyyy-MM-dd'),
      });
    } else {
      toast.error('Timer duration must be greater than 0');
      return;
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setIsManualEntry(true);
    const hours = Math.floor(entry.duration_minutes / 60);
    const minutes = entry.duration_minutes % 60;
    reset({
      goal_id: entry.goal_id,
      notes: entry.notes,
      hours,
      minutes,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Time Tracker</h2>

      <form onSubmit={handleSubmit((data) => {
        if (editingEntry) {
          updateTimeEntry.mutate({
            id: editingEntry.id,
            goal_id: data.goal_id,
            notes: data.notes,
            duration_minutes: (Number(data.hours) * 60) + Number(data.minutes),
          });
        } else {
          onSubmit(data);
        }
      })} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Goal
          </label>
          <select
            {...register('goal_id', { required: 'Please select a goal' })}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a goal...</option>
            {goals?.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
          {errors.goal_id && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.goal_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes (optional)
          </label>
          <textarea
            {...register('notes')}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between">
          {isManualEntry ? (
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hours</label>
                <input
                  type="number"
                  {...register('hours', { 
                    required: 'Hours is required',
                    min: { value: 0, message: 'Hours must be 0 or greater' }
                  })}
                  className="mt-1 block w-20 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  min="0"
                />
                {errors.hours && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.hours.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Minutes</label>
                <input
                  type="number"
                  {...register('minutes', { 
                    required: 'Minutes is required',
                    min: { value: 0, message: 'Minutes must be 0 or greater' },
                    max: { value: 59, message: 'Minutes must be less than 60' }
                  })}
                  className="mt-1 block w-20 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  min="0"
                  max="59"
                />
                {errors.minutes && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.minutes.message}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-3xl font-mono dark:text-white">
              {new Date(elapsedTime * 1000).toISOString().substr(11, 8)}
            </div>
          )}
          
          <div className="space-x-2">
            {!isManualEntry && (
              <button
                type="button"
                onClick={toggleTimer}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isTracking
                    ? 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800'
                    : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {isTracking ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsManualEntry(!isManualEntry);
                setIsTracking(false);
                setElapsedTime(0);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Clock className="h-4 w-4 mr-2" />
              {isManualEntry ? 'Use Timer' : 'Manual Entry'}
            </button>

            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
          </div>
        </div>
      </form>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Time Log</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Goal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {timeEntries?.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{entry.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{entry.goals?.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {Math.floor(entry.duration_minutes / 60)}h {entry.duration_minutes % 60}m
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{entry.notes}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-2"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
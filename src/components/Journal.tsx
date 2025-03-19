import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { format } from 'date-fns';
import { toast } from 'sonner';

type MoodType = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

interface JournalEntry {
  reflection: string;
  mood: MoodType;
}

export default function Journal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<JournalEntry>();

  const { data: todayEntry } = useQuery({
    queryKey: ['journal', format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('date', format(new Date(), 'yyyy-MM-dd'))
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async (entry: JournalEntry) => {
      const { error } = await supabase
        .from('journal_entries')
        .upsert([
          {
            user_id: user!.id,
            date: format(new Date(), 'yyyy-MM-dd'),
            ...entry,
          },
        ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      toast.success('Journal entry saved');
      reset();
    },
    onError: () => {
      toast.error('Failed to save journal entry');
    },
  });

  const onSubmit = (data: JournalEntry) => {
    createEntryMutation.mutate(data);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Daily Journal</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            How are you feeling today?
          </label>
          <select
            {...register('mood', { required: 'Please select your mood' })}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
            defaultValue={todayEntry?.mood}
          >
            <option value="great">Great! 😄</option>
            <option value="good">Good 😊</option>
            <option value="neutral">Neutral 😐</option>
            <option value="bad">Bad 😕</option>
            <option value="terrible">Terrible 😢</option>
          </select>
          {errors.mood && (
            <p className="mt-1 text-sm text-red-600">{errors.mood.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Daily Reflection
          </label>
          <textarea
            {...register('reflection', { required: 'Please write your reflection' })}
            rows={4}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
            placeholder="Write your thoughts, achievements, and areas for improvement..."
            defaultValue={todayEntry?.reflection}
          />
          {errors.reflection && (
            <p className="mt-1 text-sm text-red-600">{errors.reflection.message}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          disabled={createEntryMutation.isPending}
        >
          {createEntryMutation.isPending ? 'Saving...' : 'Save Journal Entry'}
        </button>
      </form>
    </div>
  );
}
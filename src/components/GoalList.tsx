import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import type { Database } from '../types/supabase';

type Goal = Database['public']['Tables']['goals']['Row'];
type GoalInput = Omit<Goal, 'id' | 'user_id' | 'created_at'>;

export default function GoalList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GoalInput>();

  const { data: goals, isLoading } = useQuery({
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

  const createGoalMutation = useMutation({
    mutationFn: async (newGoal: GoalInput) => {
      const { error } = await supabase
        .from('goals')
        .insert([{ ...newGoal, user_id: user!.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal created successfully');
      setIsAddingGoal(false);
      reset();
    },
    onError: () => {
      toast.error('Failed to create goal');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete goal');
    },
  });

  const onSubmit = (data: GoalInput) => {
    createGoalMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Goals</h2>
        <button
          onClick={() => setIsAddingGoal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </button>
      </div>

      {isAddingGoal && (
        <div className="mb-6 border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Add New Goal</h3>
            <button
              onClick={() => setIsAddingGoal(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                {...register('title', { required: 'Title is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Daily Target (minutes)
                </label>
                <input
                  type="number"
                  {...register('daily_target_minutes', {
                    required: 'Daily target is required',
                    min: { value: 1, message: 'Must be at least 1 minute' }
                  })}
                  defaultValue={60}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.daily_target_minutes && (
                  <p className="mt-1 text-sm text-red-600">{errors.daily_target_minutes.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  {...register('priority', { required: 'Priority is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} - {n === 1 ? 'Highest' : n === 5 ? 'Lowest' : ''}
                    </option>
                  ))}
                </select>
                {errors.priority && (
                  <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                type="text"
                {...register('category', { required: 'Category is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Work, Study, Health"
              />
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Goal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {goals?.map((goal) => (
          <div
            key={goal.id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{goal.title}</h3>
                <p className="text-sm text-gray-500">{goal.description}</p>
                <div className="mt-2 flex items-center gap-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {goal.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {goal.daily_target_minutes} minutes daily
                  </span>
                  <span className="text-sm text-gray-500">
                    Priority: {goal.priority}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  className="text-gray-400 hover:text-gray-500"
                  title="Edit goal"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  className="text-gray-400 hover:text-red-500"
                  title="Delete goal"
                  onClick={() => deleteMutation.mutate(goal.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Plus, Check, Trash2 } from 'lucide-react';

interface DailyGoal {
  title: string;
  priority: number;
}

export default function DailyGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DailyGoal>();

  const { data: todayGoals } = useQuery({
    queryKey: ['daily_goals', format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('date', format(new Date(), 'yyyy-MM-dd'))
        .order('priority', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goal: DailyGoal) => {
      const { error } = await supabase
        .from('daily_goals')
        .insert([{
          user_id: user!.id,
          date: format(new Date(), 'yyyy-MM-dd'),
          ...goal,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_goals'] });
      toast.success('Daily goal added');
      reset();
    },
    onError: () => {
      toast.error('Failed to add daily goal');
    },
  });

  const toggleGoalMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('daily_goals')
        .update({ completed })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_goals'] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_goals'] });
      toast.success('Daily goal removed');
    },
  });

  const onSubmit = (data: DailyGoal) => {
    createGoalMutation.mutate(data);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Daily Goals</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              {...register('title', { required: 'Please enter a goal' })}
              placeholder="Add a new daily goal..."
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
          <select
            {...register('priority', { required: 'Please select priority' })}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
          >
            <option value="1">High</option>
            <option value="2">Medium</option>
            <option value="3">Low</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 transition-colors"
            disabled={createGoalMutation.isPending}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {todayGoals?.map((goal) => (
          <div
            key={goal.id}
            className="flex items-center justify-between p-3 rounded-md bg-gray-50 dark:bg-gray-700"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleGoalMutation.mutate({
                  id: goal.id,
                  completed: !goal.completed,
                })}
                className={`rounded-full p-1 ${goal.completed ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}
              >
                <Check className="h-4 w-4" />
              </button>
              <span className={`${goal.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                {goal.title}
              </span>
              <span className={`text-sm px-2 py-1 rounded ${getPriorityColor(goal.priority)}`}>
                {getPriorityLabel(goal.priority)}
              </span>
            </div>
            <button
              onClick={() => deleteGoalMutation.mutate(goal.id)}
              className="text-gray-500 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function getPriorityColor(priority: number): string {
  switch (priority) {
    case 1:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 2:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 3:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1:
      return 'High';
    case 2:
      return 'Medium';
    case 3:
      return 'Low';
    default:
      return 'Unknown';
  }
}
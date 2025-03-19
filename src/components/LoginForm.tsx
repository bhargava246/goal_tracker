import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Mail, Lock } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

interface ResetPasswordData {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export default function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>();
  const { register: registerReset, handleSubmit: handleSubmitReset, formState: { errors: resetErrors } } = useForm<ResetPasswordData>();
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          toast.error('Invalid email or password. Please try again or sign up if you don\'t have an account.');
        } else {
          toast.error(error.message);
        }
      }
    } catch (error) {
      toast.error('Failed to sign in. Please check your credentials.');
    }
  };

  const handleSignUp = async (data: LoginFormData) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            email: data.email,
          },
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (signInError) {
          toast.error('Account created but failed to sign in automatically. Please sign in manually.');
        } else {
          toast.success('Account created and signed in successfully!');
        }
      }
    } catch (error) {
      toast.error('Failed to sign up. Please try again.');
    }
  };

  const handleResetPassword = async (data: ResetPasswordData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password updated successfully');
        setIsForgotPassword(false);
      }
    } catch (error) {
      toast.error('Failed to update password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Goal Time Tracker
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isForgotPassword ? 'Reset your password' : 'Sign in to manage your goals and track your time'}
          </p>
        </div>

        {isForgotPassword ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmitReset(handleResetPassword)}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerReset('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="appearance-none rounded-t-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="newPassword" className="sr-only">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerReset('newPassword', { 
                      required: 'New password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    type="password"
                    className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="New password"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerReset('confirmPassword', { 
                      required: 'Please confirm your password',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    type="password"
                    className="appearance-none rounded-b-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>

            {Object.keys(resetErrors).length > 0 && (
              <div className="text-red-500 text-sm">
                {Object.values(resetErrors).map((error) => (
                  <p key={error.message}>{error.message}</p>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reset Password
              </button>
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="appearance-none rounded-t-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    type="password"
                    className="appearance-none rounded-b-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>
            </div>

            {(errors.email || errors.password) && (
              <div className="text-red-500 text-sm">
                {errors.email?.message || errors.password?.message}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={handleSubmit(handleSignUp)}
                  disabled={isSubmitting}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  Sign up
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
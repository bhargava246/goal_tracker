export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          daily_target_minutes: number
          category: string
          priority: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          daily_target_minutes?: number
          category: string
          priority: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          daily_target_minutes?: number
          category?: string
          priority?: number
          created_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          user_id: string
          goal_id: string
          duration_minutes: number
          date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id: string
          duration_minutes: number
          date?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string
          duration_minutes?: number
          date?: string
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'member'
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          id: number
          title: string
          link: string
          content_type: string
          primary_topic: string
          skill_level: string
          tools_covered: string | null
          learning_modality: string
          time_investment: string | null
          quality_rating: number | null
          relevance_score: number | null
          status_priority: string
          use_case_tags: string | null
          your_notes: string | null
          week_suggested: string
          added_by: string | null
        }
        Insert: {
          title: string
          link: string
          content_type: string
          primary_topic: string
          skill_level: string
          tools_covered?: string | null
          learning_modality: string
          time_investment?: string | null
          quality_rating?: number | null
          relevance_score?: number | null
          status_priority: string
          use_case_tags?: string | null
          your_notes?: string | null
          week_suggested: string
          added_by?: string | null
        }
        Update: {
          id?: number
          title?: string
          link?: string
          content_type?: string
          primary_topic?: string
          skill_level?: string
          tools_covered?: string | null
          learning_modality?: string
          time_investment?: string | null
          quality_rating?: number | null
          relevance_score?: number | null
          status_priority?: string
          use_case_tags?: string | null
          your_notes?: string | null
          week_suggested?: string
          added_by?: string | null
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          id: number
          user_id: string
          action_type: string
          resource_id: number | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          user_id: string
          action_type: string
          resource_id?: number | null
          metadata?: Record<string, unknown>
        }
        Update: {
          id?: number
          user_id?: string
          action_type?: string
          resource_id?: number | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

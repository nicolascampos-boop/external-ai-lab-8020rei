export type UserRole = 'admin' | 'user'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  title: string
  description: string | null
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  category: string
  tags: string[]
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export interface Vote {
  id: string
  material_id: string
  user_id: string
  quality_score: number
  relevance_score: number
  created_at: string
  updated_at: string
}

export interface MaterialWithScores extends Material {
  avg_quality: number
  avg_relevance: number
  avg_overall: number
  vote_count: number
  uploader?: Profile
}

export const CATEGORIES = [
  'Prompt Engineering',
  'Fine-tuning',
  'RAG',
  'Evaluation',
  'Safety & Alignment',
  'General AI',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

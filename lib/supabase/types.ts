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
  categories: string[]
  guidelines: string | null
  columns: string[] | null
  headlines: string[] | null
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
  'AI Fundamentals',
  'Implementation Strategy',
  'Applied Use Cases',
  'Agent Development',
  'Workflow Automation',
  'AI-Assisted Coding',
  'Platform Deep-Dives',
  'UX Design',
  'Prompt Engineering',
  'Organizational Impact',
  'Research Methodology',
  'Conversation Design',
] as const

export type Category = (typeof CATEGORIES)[number]

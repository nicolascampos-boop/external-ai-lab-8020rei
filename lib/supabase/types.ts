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
  link: string | null
  content_type: string | null
  categories: string[]
  week: string | null
  estimated_time: string | null
  initial_score: number | null
  file_url: string | null
  file_name: string | null
  file_type: string | null
  file_size: number | null
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

export const CONTENT_TYPES = [
  'Video',
  'Documentation',
  'Course',
  'Platform',
  'Community',
  'Social Media Post',
  'Article',
  'Case Study',
] as const

export type ContentType = (typeof CONTENT_TYPES)[number]

export const WEEKS = [
  'Week 1',
  'Week 2',
  'Week 3',
  'Week 4',
  'Optional',
] as const

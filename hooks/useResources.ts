'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Resource = Database['public']['Tables']['resources']['Row']

const defaultNewItem = {
  title: '',
  link: '',
  content_type: 'Article',
  primary_topic: 'AI Fundamentals',
  skill_level: 'Beginner',
  tools_covered: '',
  learning_modality: 'Read/Watch',
  time_investment: '',
  quality_rating: null as number | null,
  relevance_score: null as number | null,
  status_priority: 'To Review',
  use_case_tags: '',
  your_notes: '',
  week_suggested: 'Week 1',
}

export type NewItemForm = typeof defaultNewItem

interface Filters {
  contentType: string
  primaryTopic: string
  skillLevel: string
  weekSuggested: string
  statusPriority: string
}

export function useResources() {
  const [data, setData] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Filters>({
    contentType: '',
    primaryTopic: '',
    skillLevel: '',
    weekSuggested: '',
    statusPriority: '',
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Resource | null>(null)
  const [newItem, setNewItem] = useState<NewItemForm>({ ...defaultNewItem })

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const { data: resources, error } = await supabase
        .from('resources')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      setData(resources || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addNewItem = async (userId?: string) => {
    try {
      setSaving(true)
      const insertData = { ...newItem, added_by: userId || null }
      const { data: newData, error } = await supabase
        .from('resources')
        .insert([insertData])
        .select()

      if (error) throw error

      setData(prev => [...prev, newData[0]])
      setNewItem({ ...defaultNewItem })
      return { success: true, data: newData[0] }
    } catch (error) {
      console.error('Error adding resource:', error)
      return { success: false, error }
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (item: Resource) => {
    setEditingId(item.id)
    setEditForm({ ...item })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const saveEdit = async () => {
    if (!editForm || !editingId) return
    try {
      setSaving(true)
      const { error } = await supabase
        .from('resources')
        .update(editForm)
        .eq('id', editingId)

      if (error) throw error

      setData(prev => prev.map(item => item.id === editingId ? editForm : item))
      setEditingId(null)
      setEditForm(null)
      return { success: true }
    } catch (error) {
      console.error('Error updating resource:', error)
      return { success: false, error }
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (id: number) => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id)

      if (error) throw error

      setData(prev => prev.filter(item => item.id !== id))
      return { success: true }
    } catch (error) {
      console.error('Error deleting resource:', error)
      return { success: false, error }
    } finally {
      setSaving(false)
    }
  }

  const bulkImport = async (items: Record<string, unknown>[]) => {
    try {
      setSaving(true)
      const { data: insertedData, error } = await supabase
        .from('resources')
        .insert(items as Database['public']['Tables']['resources']['Insert'][])
        .select()

      if (error) throw error

      setData(prev => [...prev, ...insertedData])
      return { success: true, count: insertedData.length }
    } catch (error) {
      console.error('Error importing:', error)
      return { success: false, error }
    } finally {
      setSaving(false)
    }
  }

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = !searchTerm ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.your_notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.use_case_tags?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilters =
        (!filters.contentType || item.content_type === filters.contentType) &&
        (!filters.primaryTopic || item.primary_topic === filters.primaryTopic) &&
        (!filters.skillLevel || item.skill_level === filters.skillLevel) &&
        (!filters.weekSuggested || item.week_suggested === filters.weekSuggested) &&
        (!filters.statusPriority || item.status_priority === filters.statusPriority)

      return matchesSearch && matchesFilters
    })
  }, [data, searchTerm, filters])

  const weeklyData = useMemo(() => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Ongoing', 'Optional']
    return weeks.reduce((acc, week) => {
      acc[week] = data.filter(item => item.week_suggested === week)
      return acc
    }, {} as Record<string, Resource[]>)
  }, [data])

  const stats = useMemo(() => {
    const withQuality = data.filter(d => d.quality_rating)
    const withRelevance = data.filter(d => d.relevance_score)
    return {
      total: data.length,
      core: data.filter(d => d.status_priority === 'Core').length,
      toReview: data.filter(d => d.status_priority === 'To Review').length,
      avgQuality: withQuality.length > 0
        ? (withQuality.reduce((sum, d) => sum + (d.quality_rating || 0), 0) / withQuality.length).toFixed(1)
        : 'N/A',
      avgRelevance: withRelevance.length > 0
        ? (withRelevance.reduce((sum, d) => sum + (d.relevance_score || 0), 0) / withRelevance.length).toFixed(1)
        : 'N/A',
    }
  }, [data])

  const exportToCSV = () => {
    const headers = ['title', 'link', 'content_type', 'primary_topic', 'skill_level', 'tools_covered', 'learning_modality', 'time_investment', 'quality_rating', 'relevance_score', 'status_priority', 'use_case_tags', 'your_notes', 'week_suggested']
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${(row as Record<string, unknown>)[header] || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai-training-library.csv'
    a.click()
  }

  return {
    data,
    loading,
    saving,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    editingId,
    editForm,
    setEditForm,
    newItem,
    setNewItem,
    filteredData,
    weeklyData,
    stats,
    loadData,
    addNewItem,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteItem,
    bulkImport,
    exportToCSV,
  }
}

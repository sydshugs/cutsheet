// src/services/historyService.ts
//
// Supabase schema required (run in Supabase SQL editor):
// CREATE TABLE analyses (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
//   file_name TEXT NOT NULL,
//   file_type TEXT NOT NULL,
//   mode TEXT NOT NULL,
//   platform TEXT,
//   overall_score NUMERIC,
//   scores JSONB,
//   improvements JSONB,
//   cta_rewrite TEXT,
//   budget_recommendation TEXT,
//   second_eye_review TEXT,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
// ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users see own analyses" ON analyses FOR ALL USING (auth.uid() = user_id);

import { supabase } from '../lib/supabase'

export interface AnalysisRecord {
  id?: string
  file_name: string
  file_type: 'video' | 'static'
  mode: 'paid' | 'organic'
  platform: string
  overall_score: number
  scores: Record<string, number>
  improvements: string[]
  cta_rewrite?: string
  budget_recommendation?: string
  second_eye_review?: string
  created_at?: string
}

export const saveAnalysis = async (record: Omit<AnalysisRecord, 'id' | 'created_at'>): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const payload = { ...record, user_id: user.id }
  console.info('[saveAnalysis] Payload:', JSON.stringify({ ...payload, markdown: '(truncated)' }, null, 2))
  supabase
    .from('analyses')
    .insert(payload)
    .then(({ error }) => {
      if (error) console.error('[saveAnalysis] Failed:', error.message, error.details, error.hint)
    })
}

export const getAnalysisHistory = async (limit = 20): Promise<AnalysisRecord[]> => {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch history:', error)
    return []
  }
  return data ?? []
}

export const deleteAnalysis = async (id: string): Promise<void> => {
  await supabase.from('analyses').delete().eq('id', id)
}

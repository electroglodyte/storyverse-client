// /src/hooks/useAnalysis.ts
import { useState } from 'react';
import { supabase } from '../lib/supabase';

// Define all types locally to avoid import issues
interface SentenceMetrics {
  avg_length: number;
  length_distribution: {
    short: number;
    medium: number;
    long: number;
  };
  complexity_score: number;
  question_frequency: number;
  fragment_frequency: number;
}

interface VocabularyMetrics {
  lexical_diversity: number;
  formality_score: number;
  unusual_word_frequency: number;
  part_of_speech_distribution: {
    nouns: number;
    verbs: number;
    adjectives: number;
    adverbs: number;
  };
}

interface NarrativeCharacteristics {
  pov: string;
  tense: string;
  description_density: number;
  action_to_reflection_ratio: number;
  show_vs_tell_balance: number;
}

interface StylisticDevices {
  metaphor_frequency: number;
  simile_frequency: number;
  alliteration_frequency: number;
  repetition_patterns: number;
}

interface ToneAttributes {
  emotional_tone: string[];
  formality_level: string;
  humor_level: number;
  sarcasm_level: number;
}

interface StyleAnalysis {
  id: string;
  sample_id: string;
  created_at: string;
  sentence_metrics: SentenceMetrics;
  vocabulary_metrics: VocabularyMetrics;
  narrative_characteristics: NarrativeCharacteristics;
  stylistic_devices: StylisticDevices;
  tone_attributes: ToneAttributes;
  comparable_authors: string[];
  descriptive_summary: string;
}

interface AnalysisRequest {
  text: string;
  sampleId?: string;
  saveSample: boolean;
  title?: string;
  author?: string;
  sampleType?: string;
  tags?: string[];
  projectId: string;
}

interface AnalysisResult {
  sample_id: string;
  metrics: {
    sentence_metrics: SentenceMetrics;
    vocabulary_metrics: VocabularyMetrics;
    narrative_characteristics: NarrativeCharacteristics;
    stylistic_devices: StylisticDevices;
    tone_attributes: ToneAttributes;
  };
  summary: string;
}

export const useAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSample = async (request: AnalysisRequest): Promise<AnalysisResult | null> => {
    try {
      setLoading(true);
      setError(null);

      // Call the MCP tool via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('analyze-writing-sample', {
        body: JSON.stringify(request)
      });

      if (error) throw error;
      
      return data as AnalysisResult;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error analyzing sample:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getAnalyses = async (sampleId: string): Promise<StyleAnalysis[]> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('style_analyses')
        .select('*')
        .eq('sample_id', sampleId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data as StyleAnalysis[];
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error fetching analyses:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getLatestAnalysis = async (sampleId: string): Promise<StyleAnalysis | null> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('style_analyses')
        .select('*')
        .eq('sample_id', sampleId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      
      return data as StyleAnalysis;
    } catch (error) {
      // If no analysis found, return null without error
      if (error instanceof Error && error.message.includes('No rows found')) {
        return null;
      }
      
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error fetching latest analysis:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    analyzeSample,
    getAnalyses,
    getLatestAnalysis
  };
};
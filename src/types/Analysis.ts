// /src/types/Analysis.ts
export interface SentenceMetrics {
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

export interface VocabularyMetrics {
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

export interface NarrativeCharacteristics {
  pov: string;
  tense: string;
  description_density: number;
  action_to_reflection_ratio: number;
  show_vs_tell_balance: number;
}

export interface StylisticDevices {
  metaphor_frequency: number;
  simile_frequency: number;
  alliteration_frequency: number;
  repetition_patterns: number;
}

export interface ToneAttributes {
  emotional_tone: string[];
  formality_level: string;
  humor_level: number;
  sarcasm_level: number;
}

export interface StyleAnalysis {
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

export interface AnalysisRequest {
  text: string;
  sampleId?: string;
  saveSample: boolean;
  title?: string;
  author?: string;
  sampleType?: string;
  tags?: string[];
  projectId: string;
}

export interface AnalysisResult {
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
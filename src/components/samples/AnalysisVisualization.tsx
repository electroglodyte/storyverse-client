// /src/components/samples/AnalysisVisualization.tsx
import React from 'react';

// Define StyleAnalysis interface locally
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

interface AnalysisVisualizationProps {
  analysis: StyleAnalysis;
}

export const AnalysisVisualization: React.FC<AnalysisVisualizationProps> = ({ analysis }) => {
  // Simplified visualization component
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Style Analysis</h3>
      
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <p className="text-gray-700 dark:text-gray-300 italic">{analysis.descriptive_summary}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic sentence metrics */}
        <div>
          <h4 className="font-medium mb-2">Sentence Structure</h4>
          <p>Average length: {Math.round(analysis.sentence_metrics.avg_length)} words</p>
          <p>Complexity score: {(analysis.sentence_metrics.complexity_score * 100).toFixed(0)}%</p>
        </div>
        
        {/* Vocabulary metrics */}
        <div>
          <h4 className="font-medium mb-2">Vocabulary</h4>
          <p>Lexical diversity: {(analysis.vocabulary_metrics.lexical_diversity * 100).toFixed(0)}%</p>
          <p>Formality: {analysis.vocabulary_metrics.formality_score.toFixed(2)}</p>
        </div>
        
        {/* Narrative style */}
        <div>
          <h4 className="font-medium mb-2">Narrative Style</h4>
          <p>Point of view: {analysis.narrative_characteristics.pov.replace('_', ' ')}</p>
          <p>Tense: {analysis.narrative_characteristics.tense}</p>
        </div>
        
        {/* Tone */}
        <div>
          <h4 className="font-medium mb-2">Tone</h4>
          <p>Emotional tone: {analysis.tone_attributes.emotional_tone.join(', ')}</p>
          <p>Formality level: {analysis.tone_attributes.formality_level}</p>
        </div>
      </div>
    </div>
  );
};
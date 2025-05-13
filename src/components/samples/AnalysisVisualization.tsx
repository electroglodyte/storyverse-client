// /src/components/samples/AnalysisVisualization.tsx
import React, { useState } from 'react';

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

// Meter component for visualizing percentages
const Meter: React.FC<{ value: number; label: string; className?: string }> = ({ 
  value, 
  label,
  className = '' 
}) => {
  const percentage = Math.round(value * 100);
  
  return (
    <div className={`mb-3 ${className}`}>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-sm font-medium text-blue-400">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// Donut chart for sentence distribution
const SentenceDistribution: React.FC<{ 
  distribution: { short: number; medium: number; long: number; } 
}> = ({ 
  distribution 
}) => {
  const total = distribution.short + distribution.medium + distribution.long;
  const shortAngle = Math.round(distribution.short * 360 / total);
  const mediumAngle = Math.round(distribution.medium * 360 / total);
  
  return (
    <div className="flex flex-col items-center mb-4">
      <h4 className="text-sm font-medium text-gray-300 mb-2">Sentence Length Distribution</h4>
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          {/* Background circle */}
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#374151" strokeWidth="3.8" />
          
          {/* Short sentences (green) */}
          <circle 
            cx="18" 
            cy="18" 
            r="15.9" 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="3.8" 
            strokeDasharray={`${shortAngle} ${360 - shortAngle}`}
            strokeDashoffset="0"
          />
          
          {/* Medium sentences (blue) */}
          <circle 
            cx="18" 
            cy="18" 
            r="15.9" 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="3.8" 
            strokeDasharray={`${mediumAngle} ${360 - mediumAngle}`}
            strokeDashoffset={-shortAngle}
            transform="rotate(-90 18 18)"
          />
          
          {/* Long sentences (purple) */}
          <circle 
            cx="18" 
            cy="18" 
            r="15.9" 
            fill="none" 
            stroke="#8b5cf6" 
            strokeWidth="3.8" 
            strokeDasharray={`${360 - shortAngle - mediumAngle} ${shortAngle + mediumAngle}`}
            strokeDashoffset={-(shortAngle + mediumAngle)}
            transform="rotate(-90 18 18)"
          />
        </svg>
      </div>
      <div className="flex justify-between w-full mt-2">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
          <span className="text-xs text-gray-400">Short ({Math.round(distribution.short * 100)}%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
          <span className="text-xs text-gray-400">Medium ({Math.round(distribution.medium * 100)}%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
          <span className="text-xs text-gray-400">Long ({Math.round(distribution.long * 100)}%)</span>
        </div>
      </div>
    </div>
  );
};

// Metric card component for displaying metrics
const MetricCard: React.FC<{ title: string; children: React.ReactNode }> = ({ 
  title, 
  children 
}) => {
  return (
    <div className="bg-gray-700 rounded-lg p-4 h-full">
      <h4 className="text-sm font-medium text-gray-200 mb-3 border-b border-gray-600 pb-2">{title}</h4>
      <div>{children}</div>
    </div>
  );
};

// Style device badge
const StyleDevice: React.FC<{ 
  name: string; 
  frequency: number;
  className?: string;
}> = ({ 
  name, 
  frequency,
  className = ''
}) => {
  // Color based on frequency
  const getColor = () => {
    if (frequency > 0.03) return 'bg-green-900 text-green-200';
    if (frequency > 0.01) return 'bg-blue-900 text-blue-200';
    return 'bg-gray-700 text-gray-300';
  };
  
  return (
    <div className={`px-2 py-1 rounded-lg flex items-center gap-2 ${getColor()} ${className}`}>
      <span>{name}</span>
      <span className="text-xs opacity-75">{(frequency * 100).toFixed(1)}%</span>
    </div>
  );
};

export const AnalysisVisualization: React.FC<AnalysisVisualizationProps> = ({ analysis }) => {
  const [view, setView] = useState<'overview' | 'detailed'>('overview');
  
  return (
    <div>
      {/* View toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setView('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              view === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setView('detailed')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              view === 'detailed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Detailed
          </button>
        </div>
      </div>
      
      {/* Overview summary */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <p className="text-gray-200 italic">{analysis.descriptive_summary}</p>
      </div>
      
      {view === 'overview' ? (
        // Overview visualization
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sentence metrics */}
          <MetricCard title="Sentence Structure">
            <div className="flex flex-col">
              <div className="mb-4">
                <span className="text-3xl font-bold text-blue-400">
                  {Math.round(analysis.sentence_metrics.avg_length)}
                </span>
                <span className="text-gray-400 ml-2">words per sentence</span>
              </div>
              
              <SentenceDistribution distribution={analysis.sentence_metrics.length_distribution} />
              
              <Meter 
                value={analysis.sentence_metrics.complexity_score} 
                label="Complexity" 
              />
            </div>
          </MetricCard>
          
          {/* Vocabulary metrics */}
          <MetricCard title="Vocabulary">
            <Meter 
              value={analysis.vocabulary_metrics.lexical_diversity} 
              label="Lexical Diversity" 
            />
            <Meter 
              value={analysis.vocabulary_metrics.formality_score} 
              label="Formality" 
            />
            <Meter 
              value={analysis.vocabulary_metrics.unusual_word_frequency} 
              label="Unusual Words" 
            />
            
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-300 mb-2">Word Types</h5>
              <div className="flex space-x-2">
                {Object.entries(analysis.vocabulary_metrics.part_of_speech_distribution).map(([type, value]) => (
                  <div 
                    key={type} 
                    className="text-center flex-1"
                  >
                    <div className="text-lg font-bold text-blue-400">
                      {Math.round(value * 100)}%
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </MetricCard>
          
          {/* Narrative characteristics */}
          <MetricCard title="Narrative Style">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-600 rounded-lg p-3 text-center">
                <span className="block text-sm text-gray-400">Point of View</span>
                <span className="block text-lg font-medium text-white capitalize">
                  {analysis.narrative_characteristics.pov.replace('_', ' ')}
                </span>
              </div>
              <div className="bg-gray-600 rounded-lg p-3 text-center">
                <span className="block text-sm text-gray-400">Tense</span>
                <span className="block text-lg font-medium text-white capitalize">
                  {analysis.narrative_characteristics.tense}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Description</span>
                <span className="text-gray-300">Action</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.round(analysis.narrative_characteristics.description_density * 100)}%` 
                  }}
                ></div>
              </div>
              
              <div className="flex justify-between mt-4">
                <span className="text-gray-300">Show</span>
                <span className="text-gray-300">Tell</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.round(analysis.narrative_characteristics.show_vs_tell_balance * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </MetricCard>
          
          {/* Tone attributes */}
          <MetricCard title="Tone">
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-300 mb-2">Emotional Tone</h5>
              <div className="flex flex-wrap gap-2">
                {analysis.tone_attributes.emotional_tone.map(tone => (
                  <span 
                    key={tone} 
                    className="px-2 py-1 bg-purple-900 text-purple-200 rounded-lg text-sm"
                  >
                    {tone}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-300 mb-2">Formality Level</h5>
              <span className="px-2 py-1 bg-blue-900 text-blue-200 rounded-lg text-sm capitalize">
                {analysis.tone_attributes.formality_level}
              </span>
            </div>
            
            <Meter 
              value={analysis.tone_attributes.humor_level} 
              label="Humor" 
            />
            <Meter 
              value={analysis.tone_attributes.sarcasm_level} 
              label="Sarcasm" 
            />
          </MetricCard>
          
          {/* Stylistic devices */}
          <MetricCard title="Stylistic Devices">
            <div className="flex flex-wrap gap-2">
              <StyleDevice 
                name="Metaphors" 
                frequency={analysis.stylistic_devices.metaphor_frequency} 
              />
              <StyleDevice 
                name="Similes" 
                frequency={analysis.stylistic_devices.simile_frequency} 
              />
              <StyleDevice 
                name="Alliteration" 
                frequency={analysis.stylistic_devices.alliteration_frequency} 
              />
              <StyleDevice 
                name="Repetition" 
                frequency={analysis.stylistic_devices.repetition_patterns} 
              />
            </div>
          </MetricCard>
          
          {/* Similar authors */}
          {analysis.comparable_authors && analysis.comparable_authors.length > 0 && (
            <MetricCard title="Similar Authors">
              <div className="flex flex-wrap gap-2">
                {analysis.comparable_authors.map(author => (
                  <span 
                    key={author} 
                    className="px-2 py-1 bg-gray-600 text-gray-200 rounded-lg text-sm"
                  >
                    {author}
                  </span>
                ))}
              </div>
            </MetricCard>
          )}
        </div>
      ) : (
        // Detailed visualization - add more detailed metrics and charts
        <div className="space-y-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-4">Detailed Analysis</h3>
            <p className="text-gray-300">
              The detailed analysis view will provide expanded metrics and additional visualizations 
              of the style analysis results. This feature is under development.
            </p>
            
            {/* Raw metrics for now */}
            <div className="mt-4 overflow-x-auto">
              <pre className="bg-gray-800 p-4 rounded-lg text-xs text-gray-300 whitespace-pre-wrap">
                {JSON.stringify({
                  sentence_metrics: analysis.sentence_metrics,
                  vocabulary_metrics: analysis.vocabulary_metrics,
                  narrative_characteristics: analysis.narrative_characteristics,
                  stylistic_devices: analysis.stylistic_devices,
                  tone_attributes: analysis.tone_attributes
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// /src/pages/SampleDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSamples } from '../hooks/useSamples';
import { useAnalysis } from '../hooks/useAnalysis';
import { AnalysisVisualization } from '../components/samples/AnalysisVisualization';

// Define necessary types locally
interface Sample {
  id: string;
  title: string;
  content: string;
  author?: string;
  created_at: string;
  updated_at: string;
  sample_type?: string;
  tags?: string[];
  word_count: number;
  excerpt?: string;
  project_id: string;
}

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

export const SampleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSample, deleteSample } = useSamples();
  const { getLatestAnalysis, analyzeSample, loading: analysisLoading } = useAnalysis();

  const [sample, setSample] = useState<Sample | null>(null);
  const [analysis, setAnalysis] = useState<StyleAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch the sample
        const sampleData = await getSample(id);
        if (!sampleData) {
          setError('Sample not found');
          return;
        }

        setSample(sampleData);

        // Fetch the latest analysis
        const analysisData = await getLatestAnalysis(id);
        setAnalysis(analysisData);
      } catch (error) {
        setError('Error loading sample data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleRunAnalysis = async () => {
    if (!sample || !sample.project_id) return;

    setRunningAnalysis(true);
    
    try {
      const result = await analyzeSample({
        text: sample.content,
        sampleId: sample.id,
        saveSample: false,
        projectId: sample.project_id
      });
      
      if (result) {
        // Refresh the latest analysis
        const newAnalysis = await getLatestAnalysis(sample.id);
        setAnalysis(newAnalysis);
      }
    } catch (error) {
      console.error('Error running analysis:', error);
    } finally {
      setRunningAnalysis(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    const success = await deleteSample(id);
    if (success) {
      navigate('/samples');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (error || !sample) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-red-700 dark:text-red-400">{error || 'Sample not found'}</p>
          <Link 
            to="/samples"
            className="mt-2 text-sm text-red-700 dark:text-red-400 underline"
          >
            Return to Samples
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Navigation and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <nav className="text-sm mb-2 sm:mb-0">
          <ul className="flex space-x-2">
            <li>
              <Link to="/samples" className="text-blue-600 dark:text-blue-400 hover:underline">
                Samples
              </Link>
            </li>
            <li>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-gray-700 dark:text-gray-300">{sample.title}</span>
            </li>
          </ul>
        </nav>
        
        <div className="flex space-x-3">
          <Link
            to={`/samples/${id}/edit`}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
      
      {/* Sample Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {sample.title}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
              {sample.author && (
                <div>By {sample.author}</div>
              )}
              
              <div>{sample.word_count} words</div>
              
              <div>Updated {formatDate(sample.updated_at)}</div>
              
              {sample.sample_type && (
                <div className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full">
                  {sample.sample_type}
                </div>
              )}
            </div>
            
            {sample.tags && sample.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {sample.tags.map((tag: string) => (
                  <span 
                    key={tag}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {!analysis && (
            <button
              onClick={handleRunAnalysis}
              disabled={runningAnalysis}
              className={`mt-4 md:mt-0 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors ${
                runningAnalysis ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {runningAnalysis ? 'Analyzing...' : 'Run Style Analysis'}
            </button>
          )}
        </div>
      </div>
      
      {/* Analysis Section */}
      {analysis ? (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Style Analysis</h2>
            <button
              onClick={handleRunAnalysis}
              disabled={runningAnalysis}
              className={`text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                runningAnalysis ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {runningAnalysis ? 'Analyzing...' : 'Run New Analysis'}
            </button>
          </div>
          <AnalysisVisualization analysis={analysis} />
        </div>
      ) : runningAnalysis ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6 text-center">
          <p className="text-gray-700 dark:text-gray-300">
            Running style analysis... This may take a moment.
          </p>
        </div>
      ) : null}
      
      {/* Sample Content */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Content</h2>
        <div className="prose dark:prose-invert max-w-none">
          {sample.content.split('\n').map((paragraph: string, i: number) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete "{sample.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
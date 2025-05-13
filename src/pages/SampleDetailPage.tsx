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

type TabType = 'content' | 'analysis' | 'usage';

export const SampleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSample, deleteSample } = useSamples();
  const { getLatestAnalysis, getAnalyses, analyzeSample } = useAnalysis();

  const [sample, setSample] = useState<Sample | null>(null);
  const [analysis, setAnalysis] = useState<StyleAnalysis | null>(null);
  const [analyses, setAnalyses] = useState<StyleAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('content');

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

        // Fetch all analyses
        const analysesData = await getAnalyses(id);
        setAnalyses(analysesData);
        
        // Set the latest analysis
        if (analysesData.length > 0) {
          setAnalysis(analysesData[0]);
          
          // If there's an analysis, default to that tab
          setActiveTab('analysis');
        }
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
        // Refresh all analyses
        const analysesData = await getAnalyses(sample.id);
        setAnalyses(analysesData);
        
        // Set the latest analysis (should be the new one)
        if (analysesData.length > 0) {
          setAnalysis(analysesData[0]);
          setActiveTab('analysis');
        }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
              <Link to="/samples" className="text-blue-500 hover:underline">
                Samples
              </Link>
            </li>
            <li>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-gray-300">{sample.title}</span>
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
      <div className="bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {sample.title}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
              {sample.author && (
                <div>By {sample.author}</div>
              )}
              
              <div>{sample.word_count} words</div>
              
              <div>Updated {formatDate(sample.updated_at)}</div>
              
              {sample.sample_type && (
                <div className="px-2 py-0.5 bg-blue-900 text-blue-200 rounded-full">
                  {sample.sample_type}
                </div>
              )}
            </div>
            
            {sample.tags && sample.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {sample.tags.map((tag: string) => (
                  <span 
                    key={tag}
                    className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full"
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
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-700">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button
                onClick={() => setActiveTab('content')}
                className={`inline-block py-2 px-4 text-sm font-medium ${
                  activeTab === 'content'
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Content
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab('analysis')}
                disabled={!analysis && !runningAnalysis}
                className={`inline-block py-2 px-4 text-sm font-medium ${
                  activeTab === 'analysis'
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : (!analysis && !runningAnalysis)
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Style Analysis
                {analyses.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-900 text-blue-200 rounded-full">
                    {analyses.length}
                  </span>
                )}
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab('usage')}
                className={`inline-block py-2 px-4 text-sm font-medium ${
                  activeTab === 'usage'
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Usage
              </button>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="bg-gray-800 shadow rounded-lg p-6">
        {/* Content Tab */}
        {activeTab === 'content' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Sample Content</h2>
            <div className="prose prose-invert max-w-none">
              {sample.content.split('\n').map((paragraph: string, i: number) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}
        
        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div>
            {runningAnalysis ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-300">
                  Running style analysis... This may take a moment.
                </p>
              </div>
            ) : analysis ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Style Analysis</h2>
                  <button
                    onClick={handleRunAnalysis}
                    disabled={runningAnalysis}
                    className="text-sm px-3 py-1 border border-gray-600 rounded text-gray-300 hover:bg-gray-700"
                  >
                    Run New Analysis
                  </button>
                </div>
                
                {/* Analysis date selector if multiple analyses */}
                {analyses.length > 1 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Analysis Version
                    </label>
                    <select
                      value={analysis.id}
                      onChange={(e) => {
                        const selected = analyses.find(a => a.id === e.target.value);
                        if (selected) setAnalysis(selected);
                      }}
                      className="bg-gray-700 border-gray-600 text-white rounded-md block w-full p-2.5"
                    >
                      {analyses.map((a, index) => (
                        <option key={a.id} value={a.id}>
                          {index === 0 ? 'Latest' : `Version ${analyses.length - index}`} - {formatDate(a.created_at)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <AnalysisVisualization analysis={analysis} />
              </div>
            ) : (
              <div className="bg-gray-700 rounded-lg p-6 text-center">
                <p className="text-gray-300 mb-4">No style analysis has been run yet.</p>
                <button
                  onClick={handleRunAnalysis}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Run Style Analysis
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Sample Usage</h2>
            
            {/* TODO: Add information about profiles and other usage */}
            <p className="text-gray-300">This tab will show where this sample is used in style profiles and other contexts.</p>
            
            {/* Placeholder content for now */}
            <div className="bg-gray-700 rounded-lg p-6 mt-4">
              <p className="text-gray-400 text-center">No usage information available yet.</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete "{sample.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-600 rounded text-gray-300 hover:bg-gray-700"
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

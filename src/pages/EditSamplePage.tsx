// /src/pages/EditSamplePage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SampleForm } from '../components/samples/SampleForm';
import { useSamples } from '../hooks/useSamples';

// Define Sample interface locally to avoid import issues
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

export const EditSamplePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSample, updateSample, loading } = useSamples();
  
  const [sample, setSample] = useState<Sample | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSample = async () => {
      if (!id) return;
      
      try {
        const data = await getSample(id);
        if (!data) {
          setError('Sample not found');
          return;
        }
        
        setSample(data);
      } catch (error) {
        setError('Error loading sample');
        console.error(error);
      }
    };
    
    fetchSample();
  }, [id]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-red-700 dark:text-red-400">{error}</p>
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

  if (!sample) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  const handleUpdate = async (updatedData: any) => {
    if (!id) return null;
    
    return await updateSample(id, updatedData);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Sample</h1>
        <Link
          to={`/samples/${id}`}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Back to Sample
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <SampleForm 
          sample={sample} 
          onSubmit={handleUpdate} 
          isLoading={loading} 
        />
      </div>
    </div>
  );
};
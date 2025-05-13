import React from 'react';
import { Link } from 'react-router-dom';
import { SampleForm } from '../components/samples/SampleForm';
import { useSamples } from '../hooks/useSamples';

export const NewSamplePage: React.FC = () => {
  const { createSample, loading } = useSamples();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Writing Sample</h1>
        <Link
          to="/samples"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Back to Samples
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <SampleForm onSubmit={createSample} isLoading={loading} />
      </div>
    </div>
  );
};
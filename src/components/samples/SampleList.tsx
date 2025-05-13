// /src/components/samples/SampleList.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Define types locally to avoid import issues
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

interface SampleFilter {
  projectId?: string;
  sampleType?: string;
  author?: string;
  tags?: string[];
  searchQuery?: string;
}

interface SampleListProps {
  samples: Sample[];
  loading: boolean;
  filter: SampleFilter;
  onFilterChange: (filter: SampleFilter) => void;
}

// Simplified SampleCard component
const SampleCard: React.FC<{ sample: Sample }> = ({ sample }) => {
  return (
    <Link 
      to={`/samples/${sample.id}`}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="p-5">
        <h3 className="text-lg font-bold truncate">{sample.title}</h3>
        {sample.author && <p className="text-sm">by {sample.author}</p>}
        <p className="text-sm line-clamp-3 my-2">
          {sample.excerpt || sample.content.substring(0, 150) + '...'}
        </p>
        <div className="flex justify-between text-xs">
          <span>{sample.word_count} words</span>
          <span>Updated {new Date(sample.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
};

export const SampleList: React.FC<SampleListProps> = ({ 
  samples, 
  loading, 
  filter, 
  onFilterChange 
}) => {
  const [searchQuery, setSearchQuery] = useState(filter.searchQuery || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...filter, searchQuery });
  };

  // Simplified component for now
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Writing Samples</h2>
        <Link to="/samples/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Add Sample
        </Link>
      </div>

      {/* Simple search form */}
      <form onSubmit={handleSearchSubmit} className="flex">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search samples..."
          className="flex-1 p-2 border rounded-l-lg"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-r-lg">
          Search
        </button>
      </form>

      {/* Samples grid */}
      {loading ? (
        <div className="flex justify-center py-12">Loading...</div>
      ) : samples.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="mb-4">No writing samples found.</p>
          <Link to="/samples/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Add Your First Sample
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {samples.map(sample => (
            <SampleCard key={sample.id} sample={sample} />
          ))}
        </div>
      )}
    </div>
  );
};
// /src/components/samples/SampleList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';

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
        {sample.author && <p className="text-sm text-gray-600 dark:text-gray-400">by {sample.author}</p>}
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 my-2">
          {sample.excerpt || sample.content.substring(0, 150) + '...'}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {sample.tags && sample.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-4">
          <span>{sample.word_count} words</span>
          <span>Updated {new Date(sample.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
};

// Filter panel component
const FilterPanel: React.FC<{ 
  filter: SampleFilter; 
  onChange: (filter: SampleFilter) => void;
  availableSampleTypes: string[];
  availableAuthors: string[];
  availableTags: string[];
}> = ({ 
  filter, 
  onChange, 
  availableSampleTypes,
  availableAuthors,
  availableTags
}) => {
  // Handle filter changes
  const handleSampleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filter, sampleType: e.target.value || undefined });
  };
  
  const handleAuthorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filter, author: e.target.value || undefined });
  };
  
  const handleTagClick = (tag: string) => {
    const currentTags = filter.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    onChange({ ...filter, tags: newTags.length > 0 ? newTags : undefined });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <h3 className="font-medium mb-4">Filter Samples</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Sample Type Filter */}
        <div>
          <label htmlFor="sampleType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sample Type
          </label>
          <select
            id="sampleType"
            value={filter.sampleType || ''}
            onChange={handleSampleTypeChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="">All Types</option>
            {availableSampleTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        {/* Author Filter */}
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Author
          </label>
          <select
            id="author"
            value={filter.author || ''}
            onChange={handleAuthorChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="">All Authors</option>
            {availableAuthors.map(author => (
              <option key={author} value={author}>{author}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Tags Filter */}
      {availableTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`text-xs px-2 py-1 rounded-full ${
                  filter.tags?.includes(tag)
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const SampleList: React.FC<SampleListProps> = ({ 
  samples, 
  loading, 
  filter, 
  onFilterChange 
}) => {
  const [searchQuery, setSearchQuery] = useState(filter.searchQuery || '');
  const { projects, activeProject } = useProject();
  
  // Sort options
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'wordCount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Extract available filter options from samples
  const availableSampleTypes = Array.from(new Set(
    samples.map(sample => sample.sample_type).filter(Boolean) as string[]
  ));
  
  const availableAuthors = Array.from(new Set(
    samples.map(sample => sample.author).filter(Boolean) as string[]
  ));
  
  const availableTags = Array.from(new Set(
    samples.flatMap(sample => sample.tags || [])
  ));

  // Apply sort to samples
  const sortedSamples = [...samples].sort((a, b) => {
    if (sortBy === 'date') {
      return sortDirection === 'asc' 
        ? new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    } else if (sortBy === 'title') {
      return sortDirection === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else { // wordCount
      return sortDirection === 'asc'
        ? a.word_count - b.word_count
        : b.word_count - a.word_count;
    }
  });

  // Set active project as filter when changed
  useEffect(() => {
    if (activeProject && !filter.projectId) {
      onFilterChange({ ...filter, projectId: activeProject.id });
    }
  }, [activeProject, filter.projectId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...filter, searchQuery });
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, projectId: e.target.value || undefined });
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Writing Samples</h2>
        <Link to="/samples/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Add Sample
        </Link>
      </div>

      {/* Project selection */}
      {projects.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project
          </label>
          <select
            id="project"
            value={filter.projectId || ''}
            onChange={handleProjectChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Search and sort controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search samples..."
              className="w-full pl-4 pr-12 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <button 
              type="submit" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-blue-600 text-white rounded"
            >
              Search
            </button>
          </div>
        </form>
        
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'wordCount')}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="date">Date</option>
            <option value="title">Title</option>
            <option value="wordCount">Word Count</option>
          </select>
          
          <button 
            onClick={toggleSortDirection}
            className="px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Filters panel */}
      <FilterPanel 
        filter={filter}
        onChange={onFilterChange}
        availableSampleTypes={availableSampleTypes}
        availableAuthors={availableAuthors}
        availableTags={availableTags}
      />

      {/* Applied filters display */}
      {(filter.sampleType || filter.author || (filter.tags && filter.tags.length > 0) || filter.searchQuery) && (
        <div className="flex flex-wrap items-center gap-2 bg-gray-800 p-3 rounded-lg">
          <span className="text-gray-400 text-sm">Filters:</span>
          
          {filter.searchQuery && (
            <div className="px-2 py-1 bg-blue-900 text-blue-200 rounded-full text-xs flex items-center">
              <span>Search: {filter.searchQuery}</span>
              <button 
                onClick={() => onFilterChange({ ...filter, searchQuery: undefined })}
                className="ml-2 hover:text-white"
              >
                ×
              </button>
            </div>
          )}
          
          {filter.sampleType && (
            <div className="px-2 py-1 bg-purple-900 text-purple-200 rounded-full text-xs flex items-center">
              <span>Type: {filter.sampleType}</span>
              <button 
                onClick={() => onFilterChange({ ...filter, sampleType: undefined })}
                className="ml-2 hover:text-white"
              >
                ×
              </button>
            </div>
          )}
          
          {filter.author && (
            <div className="px-2 py-1 bg-green-900 text-green-200 rounded-full text-xs flex items-center">
              <span>Author: {filter.author}</span>
              <button 
                onClick={() => onFilterChange({ ...filter, author: undefined })}
                className="ml-2 hover:text-white"
              >
                ×
              </button>
            </div>
          )}
          
          {filter.tags && filter.tags.map(tag => (
            <div 
              key={tag}
              className="px-2 py-1 bg-yellow-900 text-yellow-200 rounded-full text-xs flex items-center"
            >
              <span>Tag: {tag}</span>
              <button 
                onClick={() => onFilterChange({ 
                  ...filter, 
                  tags: filter.tags?.filter(t => t !== tag) 
                })}
                className="ml-2 hover:text-white"
              >
                ×
              </button>
            </div>
          ))}
          
          <button 
            onClick={() => onFilterChange({ projectId: filter.projectId })}
            className="px-2 py-1 bg-red-900 text-red-200 rounded-full text-xs"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Samples grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : sortedSamples.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {filter.searchQuery || filter.sampleType || filter.author || (filter.tags && filter.tags.length > 0) 
              ? 'No writing samples match your filters.' 
              : 'No writing samples found.'}
          </p>
          <Link to="/samples/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Add Your First Sample
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSamples.map(sample => (
            <SampleCard key={sample.id} sample={sample} />
          ))}
        </div>
      )}
    </div>
  );
};

// /src/components/samples/SampleForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface NewSample {
  title: string;
  content: string;
  author?: string;
  sample_type?: string;
  tags?: string[];
  project_id: string;
}

interface SampleFormProps {
  sample?: Sample;
  onSubmit: (sample: NewSample) => Promise<Sample | null>;
  isLoading?: boolean;
}

export const SampleForm: React.FC<SampleFormProps> = ({ 
  sample, 
  onSubmit,
  isLoading = false 
}) => {
  const navigate = useNavigate();
  const { activeProject } = useProject();

  const [title, setTitle] = useState(sample?.title || '');
  const [content, setContent] = useState(sample?.content || '');
  const [author, setAuthor] = useState(sample?.author || '');
  const [sampleType, setSampleType] = useState(sample?.sample_type || '');
  const [tagsInput, setTagsInput] = useState(sample?.tags ? sample.tags.join(', ') : '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Common sample types for dropdown
  const sampleTypes = ['Novel', 'Short Story', 'Essay', 'Poetry', 'Script', 'Blog Post', 'Other'];

  // Word count calculation
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required';
    } else if (content.trim().length < 100) {
      newErrors.content = 'Content must be at least 100 characters';
    }

    if (!activeProject) {
      newErrors.project = 'No active project selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const processTags = (tagsString: string): string[] => {
    return tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const sampleData: NewSample = {
      title,
      content,
      author: author || undefined,
      sample_type: sampleType || undefined,
      tags: processTags(tagsInput),
      project_id: activeProject?.id || ''
    };

    const result = await onSubmit(sampleData);
    if (result) {
      navigate(`/samples/${result.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`mt-1 block w-full rounded-md shadow-sm ${
            errors.title 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } dark:bg-gray-700 dark:text-white dark:border-gray-600`}
          placeholder="Sample title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Author (optional)
          </label>
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="Author name"
          />
        </div>

        <div>
          <label htmlFor="sampleType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Sample Type (optional)
          </label>
          <select
            id="sampleType"
            value={sampleType}
            onChange={(e) => setSampleType(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="">Select a type</option>
            {sampleTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Content
        </label>
        <div className="relative">
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className={`mt-1 block w-full rounded-md shadow-sm ${
              errors.content 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            } dark:bg-gray-700 dark:text-white dark:border-gray-600`}
            placeholder="Enter your writing sample here..."
          />
          <div className="absolute right-2 bottom-2 text-xs text-gray-500 dark:text-gray-400">
            {wordCount} words
          </div>
        </div>
        {errors.content && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content}</p>
        )}
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tags (optional, comma-separated)
        </label>
        <input
          type="text"
          id="tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          placeholder="fiction, character-study, draft"
        />
      </div>

      {errors.project && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{errors.project}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Saving...' : sample ? 'Update Sample' : 'Create Sample'}
        </button>
      </div>
    </form>
  );
};
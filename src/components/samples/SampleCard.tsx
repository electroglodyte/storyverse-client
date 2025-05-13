// /src/components/samples/SampleCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';

// Simplified Sample interface
interface Sample {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  author?: string;
  updated_at: string;
  word_count: number;
  sample_type?: string;
  tags?: string[];
}

interface SampleCardProps {
  sample: Sample;
}

export const SampleCard: React.FC<SampleCardProps> = ({ sample }) => {
  // Simple date formatter
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Link 
      to={`/samples/${sample.id}`}
      className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg"
    >
      <div className="p-5">
        <h3 className="text-lg font-bold mb-2">
          {sample.title}
        </h3>
        
        {sample.author && (
          <p className="text-sm text-gray-600 mb-2">
            by {sample.author}
          </p>
        )}
        
        <p className="text-sm text-gray-700 mb-3">
          {sample.excerpt || sample.content.substring(0, 150) + '...'}
        </p>
        
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div>
            {sample.word_count} words
          </div>
          <div>
            Updated {formatDate(sample.updated_at)}
          </div>
        </div>
      </div>
    </Link>
  );
};
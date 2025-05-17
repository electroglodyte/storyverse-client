export interface StyleMetric {
  id: string;
  name: string;
  value: number;
  confidence: number;
  description: string | null;
}

export interface StyleSample {
  id: string;
  text_content: string;
  description: string | null;
  profile_id: string;
  created_at: string;
  metrics: StyleMetric[];
}

export interface StyleProfile {
  id: string;
  name: string;
  description: string | null;
  genre: string[];
  comparable_authors: string[] | null;
  created_at: string;
  updated_at: string;
  representative_samples: StyleSample[];
  user_comments: string | null;
}

export interface WritingStyle {
  id: string;
  text: string;
  author: string | null;
  title: string | null;
  sample_type: string;
  tags: string[];
  analysis_results: {
    metrics: StyleMetric[];
    insights: string[];
  };
  created_at: string;
}

export interface StyleGuidance {
  id: string;
  profile_id: string;
  category: string;
  guidance: string;
  examples: string[];
  priority: number;
  created_at: string;
}
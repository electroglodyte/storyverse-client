export interface Sample {
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

export interface NewSample {
  title: string;
  content: string;
  author?: string;
  sample_type?: string;
  tags?: string[];
  project_id: string;
}

export interface SampleFilter {
  projectId?: string;
  sampleType?: string;
  author?: string;
  tags?: string[];
  searchQuery?: string;
}
export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  status?: string;
  cover_image_url?: string;
  genre?: string[];
  tags?: string[];
}
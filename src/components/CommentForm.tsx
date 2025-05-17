import React, { useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';

interface CommentFormProps {
  sceneId: string;
  onCommentAdded: () => void;
}

export const CommentForm: React.FC<CommentFormProps> = ({ sceneId, onCommentAdded }) => {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { supabase } = useSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('scene_comments')
        .insert([{
          scene_id: sceneId,
          content: content.trim(),
          resolved: false,
        }]);

      if (error) throw error;

      setContent('');
      toast.success('Comment added successfully');
      onCommentAdded();
    } catch (error) {
      toast.error('Failed to add comment');
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        className="min-h-[100px]"
      />
      <Button
        type="submit"
        disabled={submitting || !content.trim()}
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        {submitting ? 'Adding Comment...' : 'Add Comment'}
      </Button>
    </form>
  );
};
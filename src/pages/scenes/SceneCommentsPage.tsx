import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaArrowLeft, FaComments, FaTrash, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Scene, SceneComment } from '../../supabase-tables';

const SceneCommentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const [scene, setScene] = useState<Scene | null>(null);
  const [comments, setComments] = useState<SceneComment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [commentType, setCommentType] = useState<string>('comment');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Fetch scene and comments
  useEffect(() => {
    const fetchSceneAndComments = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch the scene
        const { data: sceneData, error: sceneError } = await supabase
          .from('scenes')
          .select('*')
          .eq('id', id)
          .single();
        
        if (sceneError) throw sceneError;
        setScene(sceneData);
        
        // Fetch all comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('scene_comments')
          .select('*')
          .eq('scene_id', id)
          .order('created_at', { ascending: false });
        
        if (commentsError) throw commentsError;
        setComments(commentsData || []);
        
      } catch (error) {
        console.error('Error fetching scene comments:', error);
        toast.error('Failed to load scene comments');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSceneAndComments();
  }, [id]);
  
  // Handle adding a new comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !id) return;
    
    try {
      setSubmitting(true);
      
      const { data, error } = await supabase
        .from('scene_comments')
        .insert({
          scene_id: id,
          content: newComment.trim(),
          type: commentType,
          resolved: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setComments([data, ...comments]);
      setNewComment('');
      toast.success('Comment added successfully');
      
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle toggling comment resolution status
  const handleToggleResolved = async (comment: SceneComment) => {
    try {
      const { error } = await supabase
        .from('scene_comments')
        .update({ resolved: !comment.resolved })
        .eq('id', comment.id);
      
      if (error) throw error;
      
      // Update local state
      setComments(comments.map(c => 
        c.id === comment.id ? { ...c, resolved: !comment.resolved } : c
      ));
      
      toast.success(`Comment marked as ${!comment.resolved ? 'resolved' : 'unresolved'}`);
      
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };
  
  // Handle deleting a comment
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('scene_comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
      
      // Update local state
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comment deleted successfully');
      
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };
  
  // Get badge color based on comment type
  const getCommentTypeBadge = (type: string) => {
    switch (type) {
      case 'revision':
        return 'badge-error';
      case 'suggestion':
        return 'badge-warning';
      case 'question':
        return 'badge-info';
      case 'comment':
      default:
        return 'badge-secondary';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link to={`/scenes/${id}`} className="btn btn-ghost mr-4">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">
            Comments: {scene?.title}
          </h1>
        </div>
      </div>
      
      {/* Add New Comment Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FaPlus className="mr-2" /> Add New Comment
        </h2>
        <form onSubmit={handleAddComment}>
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Comment Type</span>
            </label>
            <select
              value={commentType}
              onChange={(e) => setCommentType(e.target.value)}
              className="select select-bordered w-full max-w-xs"
            >
              <option value="comment">Comment</option>
              <option value="revision">Revision Needed</option>
              <option value="suggestion">Suggestion</option>
              <option value="question">Question</option>
            </select>
          </div>
          
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Comment</span>
            </label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="textarea textarea-bordered w-full"
              placeholder="Add your comment here..."
              rows={4}
              required
            />
          </div>
          
          <div className="text-right">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? 'Adding...' : 'Add Comment'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Comments List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FaComments className="mr-2" /> Comments ({comments.length})
        </h2>
        
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Add the first comment above.
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div 
                key={comment.id} 
                className={`p-4 rounded-lg border ${comment.resolved ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`badge ${getCommentTypeBadge(comment.type)} mr-2`}>
                      {comment.type === 'revision' ? 'Revision Needed' : 
                       comment.type === 'suggestion' ? 'Suggestion' :
                       comment.type === 'question' ? 'Question' : 'Comment'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                    {comment.created_by && (
                      <span className="text-sm text-gray-500 ml-2">
                        by {comment.created_by}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleToggleResolved(comment)}
                      className={`btn btn-sm ${comment.resolved ? 'btn-outline' : 'btn-success'}`}
                    >
                      {comment.resolved ? <FaTimes /> : <FaCheck />}
                    </button>
                    <button 
                      onClick={() => handleDeleteComment(comment.id)}
                      className="btn btn-sm btn-ghost text-red-600"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div className={comment.resolved ? 'text-gray-500' : ''}>
                  {comment.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SceneCommentsPage;
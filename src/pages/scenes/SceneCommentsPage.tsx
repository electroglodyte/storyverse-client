import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaArrowLeft, FaComments, FaTrash, FaPlus, FaCheck, FaTimes, FaRegComment, FaRegLightbulb, FaRegQuestionCircle, FaRegEdit, FaFilter, FaTasks, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Scene, SceneComment } from '../../supabase-tables';
import { formatDistanceToNow } from 'date-fns';

type CommentType = 'comment' | 'revision' | 'suggestion' | 'question';
type FilterState = Record<CommentType, boolean>;

const SceneCommentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const [scene, setScene] = useState<Scene | null>(null);
  const [comments, setComments] = useState<SceneComment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [commentType, setCommentType] = useState<CommentType>('comment');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showResolved, setShowResolved] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>({
    comment: true,
    revision: true,
    suggestion: true,
    question: true
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [contextSection, setContextSection] = useState<string>('');
  const [groupByType, setGroupByType] = useState<boolean>(false);
  
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
      
      const position = contextSection 
        ? { section: contextSection } 
        : null;
      
      const { data, error } = await supabase
        .from('scene_comments')
        .insert({
          scene_id: id,
          content: newComment.trim(),
          type: commentType,
          resolved: false,
          position: position,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setComments([data, ...comments]);
      setNewComment('');
      setContextSection('');
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
  
  // Handle updating the comment type
  const handleCommentTypeChange = (type: CommentType) => {
    setCommentType(type);
  };
  
  // Toggle a specific filter
  const toggleFilter = (type: CommentType) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [type]: !prevFilters[type]
    }));
  };
  
  // Reset filters to default (all on)
  const resetFilters = () => {
    setFilters({
      comment: true,
      revision: true,
      suggestion: true,
      question: true
    });
    setShowResolved(false);
  };
  
  // Get comment icon based on type
  const getCommentTypeIcon = (type: string) => {
    switch (type) {
      case 'revision':
        return <FaRegEdit className="mr-2" />;
      case 'suggestion':
        return <FaRegLightbulb className="mr-2" />;
      case 'question':
        return <FaRegQuestionCircle className="mr-2" />;
      case 'comment':
      default:
        return <FaRegComment className="mr-2" />;
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
  
  // Format the created date
  const formatCreatedDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  // Filter comments based on current filters
  const filteredComments = comments.filter(comment => {
    // Filter by resolution status
    if (!showResolved && comment.resolved) return false;
    
    // Filter by comment type
    return filters[comment.type as CommentType];
  });
  
  // Group comments by type if needed
  const groupedComments = () => {
    if (!groupByType) return { ungrouped: filteredComments };
    
    return filteredComments.reduce((groups, comment) => {
      const type = comment.type as string;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(comment);
      return groups;
    }, {} as Record<string, SceneComment[]>);
  };
  
  // Get summary counts
  const getTypeCounts = () => {
    return comments.reduce((counts, comment) => {
      const type = comment.type as CommentType;
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {} as Record<CommentType, number>);
  };
  
  const typeCounts = getTypeCounts();
  const resolvedCount = comments.filter(c => c.resolved).length;
  const groups = groupedComments();
  
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
        
        <div className="flex space-x-2">
          <div className="dropdown dropdown-end">
            <label 
              tabIndex={0} 
              className={`btn btn-sm ${isFilterOpen ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <FaFilter className="mr-2" /> Filter
              {isFilterOpen ? <FaChevronUp className="ml-1" /> : <FaChevronDown className="ml-1" />}
            </label>
            {isFilterOpen && (
              <div className="dropdown-content z-[1] menu p-3 shadow bg-base-100 rounded-box w-64 mt-1">
                <div className="form-control mb-2">
                  <label className="label cursor-pointer justify-start">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm mr-2"
                      checked={filters.comment}
                      onChange={() => toggleFilter('comment')}
                    />
                    <span className="label-text flex items-center">
                      <FaRegComment className="mr-2 text-gray-600" /> Comments
                      {typeCounts.comment && (
                        <span className="ml-2 badge badge-sm badge-secondary">{typeCounts.comment}</span>
                      )}
                    </span>
                  </label>
                </div>
                <div className="form-control mb-2">
                  <label className="label cursor-pointer justify-start">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm mr-2"
                      checked={filters.revision}
                      onChange={() => toggleFilter('revision')}
                    />
                    <span className="label-text flex items-center">
                      <FaRegEdit className="mr-2 text-red-600" /> Revisions
                      {typeCounts.revision && (
                        <span className="ml-2 badge badge-sm badge-error">{typeCounts.revision}</span>
                      )}
                    </span>
                  </label>
                </div>
                <div className="form-control mb-2">
                  <label className="label cursor-pointer justify-start">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm mr-2"
                      checked={filters.suggestion}
                      onChange={() => toggleFilter('suggestion')}
                    />
                    <span className="label-text flex items-center">
                      <FaRegLightbulb className="mr-2 text-yellow-600" /> Suggestions
                      {typeCounts.suggestion && (
                        <span className="ml-2 badge badge-sm badge-warning">{typeCounts.suggestion}</span>
                      )}
                    </span>
                  </label>
                </div>
                <div className="form-control mb-2">
                  <label className="label cursor-pointer justify-start">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm mr-2"
                      checked={filters.question}
                      onChange={() => toggleFilter('question')}
                    />
                    <span className="label-text flex items-center">
                      <FaRegQuestionCircle className="mr-2 text-blue-600" /> Questions
                      {typeCounts.question && (
                        <span className="ml-2 badge badge-sm badge-info">{typeCounts.question}</span>
                      )}
                    </span>
                  </label>
                </div>
                <div className="form-control mb-2 border-t pt-2">
                  <label className="label cursor-pointer justify-start">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm mr-2"
                      checked={showResolved}
                      onChange={() => setShowResolved(!showResolved)}
                    />
                    <span className="label-text flex items-center">
                      <FaCheck className="mr-2 text-green-600" /> Show Resolved
                      {resolvedCount > 0 && (
                        <span className="ml-2 badge badge-sm badge-success">{resolvedCount}</span>
                      )}
                    </span>
                  </label>
                </div>
                <div className="form-control mb-2">
                  <label className="label cursor-pointer justify-start">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm mr-2"
                      checked={groupByType}
                      onChange={() => setGroupByType(!groupByType)}
                    />
                    <span className="label-text">Group by Type</span>
                  </label>
                </div>
                <div className="mt-2">
                  <button className="btn btn-xs btn-outline w-full" onClick={resetFilters}>
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <Link to={`/scenes/${id}`} className="btn btn-sm btn-primary">
            <FaEdit className="mr-2" /> Edit Scene
          </Link>
        </div>
      </div>
      
      {/* Comment summary */}
      <div className="stats shadow mb-6">
        <div className="stat">
          <div className="stat-figure text-secondary">
            <FaComments className="text-3xl" />
          </div>
          <div className="stat-title">Total Comments</div>
          <div className="stat-value">{comments.length}</div>
          <div className="stat-desc">
            {resolvedCount} resolved / {comments.length - resolvedCount} active
          </div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-secondary">
            <FaTasks className="text-3xl" />
          </div>
          <div className="stat-title">By Type</div>
          <div className="stat-value text-lg">
            <div className="flex space-x-2">
              <span className="badge badge-secondary badge-lg">{typeCounts.comment || 0}</span>
              <span className="badge badge-error badge-lg">{typeCounts.revision || 0}</span>
              <span className="badge badge-warning badge-lg">{typeCounts.suggestion || 0}</span>
              <span className="badge badge-info badge-lg">{typeCounts.question || 0}</span>
            </div>
          </div>
          <div className="stat-desc flex justify-between">
            <span>Comments</span>
            <span>Revisions</span>
            <span>Suggestions</span>
            <span>Questions</span>
          </div>
        </div>
      </div>
      
      {/* Add New Comment Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FaPlus className="mr-2" /> Add New Comment
        </h2>
        <form onSubmit={handleAddComment}>
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`btn btn-sm ${commentType === 'comment' ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => handleCommentTypeChange('comment')}
              >
                <FaRegComment className="mr-1" /> Comment
              </button>
              <button
                type="button"
                className={`btn btn-sm ${commentType === 'revision' ? 'btn-error' : 'btn-outline'}`}
                onClick={() => handleCommentTypeChange('revision')}
              >
                <FaRegEdit className="mr-1" /> Revision Needed
              </button>
              <button
                type="button"
                className={`btn btn-sm ${commentType === 'suggestion' ? 'btn-warning' : 'btn-outline'}`}
                onClick={() => handleCommentTypeChange('suggestion')}
              >
                <FaRegLightbulb className="mr-1" /> Suggestion
              </button>
              <button
                type="button"
                className={`btn btn-sm ${commentType === 'question' ? 'btn-info' : 'btn-outline'}`}
                onClick={() => handleCommentTypeChange('question')}
              >
                <FaRegQuestionCircle className="mr-1" /> Question
              </button>
            </div>
          </div>
          
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Related Section (Optional)</span>
            </label>
            <input
              type="text"
              value={contextSection}
              onChange={(e) => setContextSection(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g., 'Paragraph 3' or 'Character Introduction'"
            />
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
          <FaComments className="mr-2" /> Comments ({filteredComments.length})
        </h2>
        
        {filteredComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments found matching your filters.
          </div>
        ) : groupByType ? (
          // Grouped by type
          <div className="space-y-8">
            {Object.entries(groups).map(([type, typeComments]) => {
              if (type === 'ungrouped' || typeComments.length === 0) return null;
              return (
                <div key={type} className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center">
                    {type === 'revision' && <FaRegEdit className="mr-2 text-red-600" />}
                    {type === 'suggestion' && <FaRegLightbulb className="mr-2 text-yellow-600" />}
                    {type === 'question' && <FaRegQuestionCircle className="mr-2 text-blue-600" />}
                    {type === 'comment' && <FaRegComment className="mr-2 text-gray-600" />}
                    {type === 'revision' ? 'Revisions' : 
                     type === 'suggestion' ? 'Suggestions' : 
                     type === 'question' ? 'Questions' : 'Comments'} ({typeComments.length})
                  </h3>
                  <div className="space-y-4">
                    {typeComments.map((comment) => (
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
                              {formatCreatedDate(comment.created_at)}
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
                        {comment.position && comment.position.section && (
                          <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm mb-2">
                            Section: {comment.position.section}
                          </div>
                        )}
                        <div className={comment.resolved ? 'text-gray-500' : ''}>
                          {comment.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Flat list
          <div className="space-y-4">
            {filteredComments.map((comment) => (
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
                      {formatCreatedDate(comment.created_at)}
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
                {comment.position && comment.position.section && (
                  <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm mb-2">
                    Section: {comment.position.section}
                  </div>
                )}
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
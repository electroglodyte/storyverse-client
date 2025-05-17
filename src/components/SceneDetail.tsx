import React, { useEffect, useState } from 'react';
import { Scene, SceneVersion, SceneComment } from '../types/scene';
import { useSupabase } from '../contexts/SupabaseContext';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Save, ArrowLeft, MessageSquare, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { CommentForm } from './CommentForm';

interface SceneDetailProps {
  sceneId?: string;
  storyId?: string;
  isNew?: boolean;
}

export const SceneDetail: React.FC<SceneDetailProps> = ({ sceneId, storyId, isNew = false }) => {
  const [scene, setScene] = useState<Partial<Scene>>({
    title: '',
    description: '',
    content: '',
    scene_type: 'scene',
    status: 'draft',
    sequence_number: 1,
    story_id: storyId,
  });
  const [versions, setVersions] = useState<SceneVersion[]>([]);
  const [comments, setComments] = useState<SceneComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { supabase } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (!isNew && sceneId) {
      fetchSceneData();
    } else {
      setLoading(false);
    }
  }, [sceneId]);

  const fetchSceneData = async () => {
    try {
      // Fetch scene
      const { data: sceneData, error: sceneError } = await supabase
        .from('scenes')
        .select('*')
        .eq('id', sceneId)
        .single();

      if (sceneError) throw sceneError;
      setScene(sceneData);

      // Fetch versions
      const { data: versionData, error: versionError } = await supabase
        .from('scene_versions')
        .select('*')
        .eq('scene_id', sceneId)
        .order('version_number', { ascending: false });

      if (versionError) throw versionError;
      setVersions(versionData || []);

      // Fetch comments
      const { data: commentData, error: commentError } = await supabase
        .from('scene_comments')
        .select('*')
        .eq('scene_id', sceneId)
        .order('created_at', { ascending: false });

      if (commentError) throw commentError;
      setComments(commentData || []);
    } catch (error) {
      toast.error('Failed to fetch scene data');
      console.error('Error fetching scene data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (isNew) {
        const { data, error } = await supabase
          .from('scenes')
          .insert([scene])
          .select()
          .single();

        if (error) throw error;
        toast.success('Scene created successfully');
        router.push(`/scenes/${data.id}`);
      } else {
        // Create new version
        const { data: versionData, error: versionError } = await supabase
          .from('scene_versions')
          .insert([{
            scene_id: sceneId,
            content: scene.content,
            version_number: (versions[0]?.version_number || 0) + 1,
          }]);

        if (versionError) throw versionError;

        // Update scene
        const { error: updateError } = await supabase
          .from('scenes')
          .update(scene)
          .eq('id', sceneId);

        if (updateError) throw updateError;
        
        toast.success('Scene updated successfully');
        fetchSceneData(); // Refresh data
      }
    } catch (error) {
      toast.error('Failed to save scene');
      console.error('Error saving scene:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCommentResolved = async (commentId: string, currentResolved: boolean) => {
    try {
      const { error } = await supabase
        .from('scene_comments')
        .update({ resolved: !currentResolved })
        .eq('id', commentId);

      if (error) throw error;
      
      // Update local state
      setComments(comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, resolved: !currentResolved }
          : comment
      ));
    } catch (error) {
      toast.error('Failed to update comment status');
      console.error('Error updating comment status:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={scene.title}
            onChange={(e) => setScene({ ...scene, title: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={scene.description || ''}
            onChange={(e) => setScene({ ...scene, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="scene_type">Type</Label>
            <Select
              value={scene.scene_type}
              onValueChange={(value) => setScene({ ...scene, scene_type: value })}
            >
              <option value="scene">Scene</option>
              <option value="chapter">Chapter</option>
              <option value="beat">Beat</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={scene.status}
              onValueChange={(value) => setScene({ ...scene, status: value })}
            >
              <option value="idea">Idea</option>
              <option value="draft">Draft</option>
              <option value="revised">Revised</option>
              <option value="polished">Polished</option>
              <option value="finished">Finished</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="sequence_number">Sequence</Label>
            <Input
              id="sequence_number"
              type="number"
              value={scene.sequence_number}
              onChange={(e) => setScene({ ...scene, sequence_number: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={scene.content || ''}
            onChange={(e) => setScene({ ...scene, content: e.target.value })}
            className="min-h-[300px]"
          />
        </div>

        {!isNew && (
          <>
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Version History</h3>
              <div className="space-y-2">
                {versions.map((version) => (
                  <Card key={version.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>Version {version.version_number}</div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(version.created_at), 'MMM d, yyyy HH:mm')}
                      </div>
                    </div>
                    {version.notes && (
                      <div className="mt-2 text-sm">{version.notes}</div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Comments</h3>
              <div className="space-y-4">
                <CommentForm 
                  sceneId={sceneId!} 
                  onCommentAdded={fetchSceneData}
                />
                <div className="space-y-2">
                  {comments.map((comment) => (
                    <Card key={comment.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center flex-grow">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          <div className={comment.resolved ? 'text-gray-500' : ''}>
                            {comment.content}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-500">
                            {format(new Date(comment.created_at), 'MMM d, yyyy HH:mm')}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleCommentResolved(comment.id, comment.resolved)}
                          >
                            <Check className={`w-4 h-4 ${comment.resolved ? 'text-green-500' : 'text-gray-400'}`} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
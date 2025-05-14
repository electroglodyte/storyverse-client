import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaSave, FaHistory, FaComments, FaEye, FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Scene } from '../../supabase-tables';

const SceneEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [scene, setScene] = useState<Scene>({
    id: '',
    title: '',
    description: '',
    content: '',
    story_id: '',
    sequence_number: 0,
    is_visible: true,
    type: 'scene',
    format: 'plain',
    created_at: '',
    updated_at: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [versionNote, setVersionNote] = useState<string>('');
  const [showVersionDialog, setShowVersionDialog] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  
  // Fetch scene data if editing
  useEffect(() => {
    if (isEditing) {
      const fetchScene = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('scenes')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) throw error;
          if (!data) throw new Error('Scene not found');
          
          setScene(data);
        } catch (error) {
          console.error('Error fetching scene:', error);
          toast.error('Failed to load scene');
        } finally {
          setLoading(false);
        }
      };
      
      fetchScene();
    }
  }, [id, isEditing]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setScene(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setScene(prev => ({ ...prev, [name]: checked }));
  };
  
  // Save scene
  const handleSave = async (createVersion = false) => {
    try {
      setSaving(true);
      
      if (isEditing) {
        // Update existing scene
        const { error } = await supabase
          .from('scenes')
          .update({
            title: scene.title,
            description: scene.description,
            content: scene.content,
            story_id: scene.story_id,
            sequence_number: scene.sequence_number,
            is_visible: scene.is_visible,
            type: scene.type,
            format: scene.format,
          })
          .eq('id', id);
        
        if (error) throw error;
        
        // Create a version if requested
        if (createVersion) {
          await createSceneVersion();
        }
        
        toast.success('Scene updated successfully');
      } else {
        // Create new scene
        const { data, error } = await supabase
          .from('scenes')
          .insert({
            title: scene.title,
            description: scene.description,
            content: scene.content,
            story_id: scene.story_id,
            sequence_number: scene.sequence_number,
            is_visible: scene.is_visible,
            type: scene.type,
            format: scene.format,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Create an initial version
        if (data) {
          await supabase
            .from('scene_versions')
            .insert({
              scene_id: data.id,
              content: scene.content,
              version_number: 1,
              notes: 'Initial version',
            });
          
          navigate(`/scenes/${data.id}`);
        }
        
        toast.success('Scene created successfully');
      }
    } catch (error) {
      console.error('Error saving scene:', error);
      toast.error('Failed to save scene');
    } finally {
      setSaving(false);
      setShowVersionDialog(false);
    }
  };
  
  // Create a new version
  const createSceneVersion = async () => {
    try {
      if (!id) return;
      
      // Get the latest version number
      const { data: versions, error: versionError } = await supabase
        .from('scene_versions')
        .select('version_number')
        .eq('scene_id', id)
        .order('version_number', { ascending: false })
        .limit(1);
      
      if (versionError) throw versionError;
      
      const nextVersionNumber = versions && versions.length > 0 
        ? versions[0].version_number + 1 
        : 1;
      
      // Create new version
      const { error } = await supabase
        .from('scene_versions')
        .insert({
          scene_id: id,
          content: scene.content,
          version_number: nextVersionNumber,
          notes: versionNote || `Version ${nextVersionNumber}`,
        });
      
      if (error) throw error;
      
      setVersionNote('');
    } catch (error) {
      console.error('Error creating scene version:', error);
      throw error;
    }
  };
  
  // Render Fountain preview
  const renderFountainPreview = useCallback(() => {
    // Basic Fountain rendering - in a real app, you'd use a proper Fountain parser
    if (!scene.content) return null;
    
    const lines = scene.content.split('\n');
    return (
      <div className="fountain-preview font-mono">
        {lines.map((line, index) => {
          // Scene headings
          if (line.startsWith('INT.') || line.startsWith('EXT.') || line.startsWith('I/E.')) {
            return <p key={index} className="font-bold mt-4 mb-2">{line}</p>;
          }
          
          // Character names
          if (line.trim() === line.toUpperCase() && line.trim() !== '' && !line.startsWith('(')) {
            return <p key={index} className="font-bold text-center mt-4">{line}</p>;
          }
          
          // Parentheticals
          if (line.startsWith('(') && line.endsWith(')')) {
            return <p key={index} className="italic text-center ml-8 mr-8">{line}</p>;
          }
          
          // Dialogue - following character names
          if (index > 0 && lines[index-1].trim() === lines[index-1].toUpperCase() || 
              (index > 1 && lines[index-2].trim() === lines[index-2].toUpperCase() && 
               lines[index-1].startsWith('(') && lines[index-1].endsWith(')'))) {
            return <p key={index} className="ml-8 mr-8 text-center mb-4">{line}</p>;
          }
          
          // Transitions
          if (line.endsWith('TO:') || line === 'FADE OUT.' || line === 'CUT TO BLACK.') {
            return <p key={index} className="font-bold text-right mt-2 mb-2">{line}</p>;
          }
          
          // Default (action)
          return <p key={index} className="mb-2">{line}</p>;
        })}
      </div>
    );
  }, [scene.content]);
  
  // Render Markdown preview
  const renderMarkdownPreview = useCallback(() => {
    // Simple markdown rendering - in a real app, you'd use a proper Markdown parser
    if (!scene.content) return null;
    
    const lines = scene.content.split('\n');
    return (
      <div className="markdown-preview">
        {lines.map((line, index) => {
          // Headings
          if (line.startsWith('# ')) {
            return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={index} className="text-xl font-bold mt-3 mb-2">{line.substring(3)}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={index} className="text-lg font-bold mt-3 mb-2">{line.substring(4)}</h3>;
          }
          
          // Bold and Italic
          let content = line;
          content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
          
          // Lists
          if (line.startsWith('- ')) {
            return <li key={index} className="ml-4">{content.substring(2)}</li>;
          }
          
          // Default
          return <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: content }}></p>;
        })}
      </div>
    );
  }, [scene.content]);
  
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
          <Link to="/scenes" className="btn btn-ghost mr-4">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">
            {isEditing ? `Edit Scene: ${scene.title}` : 'Create New Scene'}
          </h1>
        </div>
        <div className="flex space-x-2">
          {isEditing && (
            <>
              <button 
                className="btn btn-outline btn-info flex items-center"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <FaEye className="mr-2" /> {previewMode ? 'Edit' : 'Preview'}
              </button>
              <Link to={`/scenes/${id}/versions`} className="btn btn-outline btn-secondary flex items-center">
                <FaHistory className="mr-2" /> Versions
              </Link>
              <Link to={`/scenes/${id}/comments`} className="btn btn-outline btn-warning flex items-center">
                <FaComments className="mr-2" /> Comments
              </Link>
            </>
          )}
          <button 
            className="btn btn-primary flex items-center"
            onClick={() => isEditing ? setShowVersionDialog(true) : handleSave()}
            disabled={saving}
          >
            <FaSave className="mr-2" /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {previewMode ? (
        <div className="bg-white p-6 rounded-lg shadow min-h-[70vh]">
          <h2 className="text-2xl font-bold mb-4">{scene.title}</h2>
          {scene.description && (
            <p className="text-gray-600 italic mb-6">{scene.description}</p>
          )}
          <div className="border-t pt-4">
            {scene.format === 'fountain' ? renderFountainPreview() : 
             scene.format === 'markdown' ? renderMarkdownPreview() : 
             <div className="whitespace-pre-wrap">{scene.content}</div>}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Title</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={scene.title}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Scene title"
                  required
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Description</span>
                </label>
                <textarea
                  name="description"
                  value={scene.description || ''}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full"
                  placeholder="Brief description of this scene"
                  rows={2}
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Content</span>
                </label>
                <textarea
                  name="content"
                  value={scene.content || ''}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full font-mono"
                  placeholder={scene.format === 'fountain' ? 
                    'INT. LOCATION - DAY\n\nAction description...\n\nCHARACTER\nDialogue...' : 
                    'Enter scene content here...'}
                  rows={20}
                />
              </div>
            </div>
            
            <div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Scene Type</span>
                </label>
                <select
                  name="type"
                  value={scene.type}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  <option value="scene">Scene</option>
                  <option value="chapter">Chapter</option>
                  <option value="outline_element">Outline Element</option>
                  <option value="summary">Summary</option>
                </select>
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Format</span>
                </label>
                <select
                  name="format"
                  value={scene.format}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  <option value="plain">Plain Text</option>
                  <option value="fountain">Fountain</option>
                  <option value="markdown">Markdown</option>
                </select>
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Sequence Number</span>
                </label>
                <input
                  type="number"
                  name="sequence_number"
                  value={scene.sequence_number || 0}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  min="0"
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label cursor-pointer">
                  <span className="label-text font-semibold">Visible in Output</span>
                  <input
                    type="checkbox"
                    name="is_visible"
                    checked={scene.is_visible || false}
                    onChange={handleCheckboxChange}
                    className="toggle toggle-primary"
                  />
                </label>
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Related Story</span>
                </label>
                <select
                  name="story_id"
                  value={scene.story_id || ''}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  <option value="">None</option>
                  {/* This would be populated with actual stories */}
                  <option value="placeholder">Sample Story</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Version creation dialog */}
      {showVersionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Save New Version</h3>
            <p className="mb-4 text-gray-600">
              A new version will be created with your changes. Please add a note to describe what changed.
            </p>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Version Notes</span>
              </label>
              <textarea
                value={versionNote}
                onChange={(e) => setVersionNote(e.target.value)}
                className="textarea textarea-bordered w-full"
                placeholder="What changed in this version?"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button 
                className="btn btn-ghost"
                onClick={() => setShowVersionDialog(false)}
              >
                <FaTimes className="mr-2" /> Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handleSave(true)}
                disabled={saving}
              >
                <FaCheck className="mr-2" /> {saving ? 'Saving...' : 'Save Version'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SceneEditorPage;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaSave, FaHistory, FaComments, FaEye, FaArrowLeft, FaCheck, FaTimes, FaCode, FaQuestion, FaParagraph } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Scene, SceneType, SceneStatus } from '../../supabase-tables';
import { renderFountainPreview, renderMarkdownPreview, convertToFountain, convertToMarkdown, detectFormat } from '../../utils/formatters';

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
    type: SceneType.SCENE,
    status: SceneStatus.DRAFT,
    format: 'plain',
    created_at: '',
    updated_at: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [versionNote, setVersionNote] = useState<string>('');
  const [showVersionDialog, setShowVersionDialog] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [availableStories, setAvailableStories] = useState<any[]>([]);
  const [showFormatHelp, setShowFormatHelp] = useState<boolean>(false);
  const [autoDetectFormat, setAutoDetectFormat] = useState<boolean>(false);
  const [splitView, setSplitView] = useState<boolean>(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save - Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditing) {
          setShowVersionDialog(true);
        } else {
          handleSave();
        }
      }
      
      // Toggle preview - Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setPreviewMode(!previewMode);
      }
      
      // Toggle split view - Ctrl+Alt+P / Cmd+Alt+P
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'p') {
        e.preventDefault();
        setSplitView(!splitView);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, previewMode, splitView]);
  
  // Fetch scene data if editing
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('id, title')
          .order('title');
        
        if (error) throw error;
        setAvailableStories(data || []);
      } catch (error) {
        console.error('Error fetching stories:', error);
      }
    };
    
    fetchStories();
    
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
  
  // Handle format auto-detection
  useEffect(() => {
    if (autoDetectFormat && scene.content) {
      const detectedFormat = detectFormat(scene.content);
      if (detectedFormat !== scene.format) {
        setScene(prev => ({ ...prev, format: detectedFormat }));
        toast.success(`Format detected as ${detectedFormat}`);
      }
    }
  }, [autoDetectFormat, scene.content]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setScene(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle format change with potential conversion
  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFormat = e.target.value as 'plain' | 'fountain' | 'markdown';
    
    // If content exists, ask if the user wants to convert the format
    if (scene.content.trim() && scene.format !== newFormat) {
      if (window.confirm(`Would you like to convert the content to ${newFormat} format? This might lose some formatting.`)) {
        let convertedContent = scene.content;
        
        // Perform the conversion
        if (newFormat === 'fountain') {
          convertedContent = convertToFountain(scene.content, scene.title);
        } else if (newFormat === 'markdown') {
          convertedContent = convertToMarkdown(scene.content, scene.title);
        }
        
        setScene(prev => ({ ...prev, format: newFormat, content: convertedContent }));
      } else {
        // Just change the format without conversion
        setScene(prev => ({ ...prev, format: newFormat }));
      }
    } else {
      // No content or same format, just update
      setScene(prev => ({ ...prev, format: newFormat }));
    }
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setScene(prev => ({ ...prev, [name]: checked }));
  };
  
  // Insert format-specific template text at cursor
  const insertTemplate = (template: string) => {
    if (!editorRef.current) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const content = scene.content;
    
    const newContent = content.substring(0, start) + template + content.substring(end);
    setScene(prev => ({ ...prev, content: newContent }));
    
    // Set cursor position after insertion
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.setSelectionRange(start + template.length, start + template.length);
      }
    }, 0);
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
  
  // Format help panel based on selected format
  const renderFormatHelp = useCallback(() => {
    switch (scene.format) {
      case 'fountain':
        return (
          <div className="p-4 bg-blue-50 border rounded">
            <h3 className="font-bold mb-2">Fountain Format Help</h3>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => insertTemplate("INT. LOCATION - DAY\n\n")}
              >
                Scene Heading
              </button>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => insertTemplate("\nCHARACTER NAME\n")}
              >
                Character
              </button>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => insertTemplate("(parenthetical)\n")}
              >
                Parenthetical
              </button>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => insertTemplate("\nCUT TO:\n\n")}
              >
                Transition
              </button>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => insertTemplate("[[Note: this is a note]]\n")}
              >
                Note
              </button>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => insertTemplate("\n")}
              >
                Dialogue
              </button>
            </div>
            <p className="text-xs text-gray-600">
              <strong>Tips:</strong> Scene headings start with INT./EXT., character names are in ALL CAPS, 
              and parentheticals go between character name and dialogue.
            </p>
          </div>
        );
      case 'markdown':
        return (
          <div className="p-4 bg-green-50 border rounded">
            <h3 className="font-bold mb-2">Markdown Format Help</h3>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => insertTemplate("# Heading 1\n")}
              >
                Heading 1
              </button>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => insertTemplate("## Heading 2\n")}
              >
                Heading 2
              </button>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => insertTemplate("**bold**")}
              >
                Bold
              </button>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => insertTemplate("*italic*")}
              >
                Italic
              </button>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => insertTemplate("- List item\n")}
              >
                List
              </button>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => insertTemplate("> Blockquote\n")}
              >
                Quote
              </button>
            </div>
            <p className="text-xs text-gray-600">
              <strong>Tips:</strong> Use # for headings, ** for bold, * for italic, 
              - for lists, and &gt; for blockquotes.
            </p>
          </div>
        );
      default:
        return (
          <div className="p-4 bg-gray-50 border rounded">
            <h3 className="font-bold mb-2">Plain Text Format</h3>
            <p className="text-sm">
              Plain text doesn't require special formatting. Just type normally and use paragraph breaks to separate sections.
            </p>
            <div className="mt-2">
              <button 
                className="btn btn-sm btn-outline w-full justify-between"
                onClick={() => {
                  if (window.confirm("Would you like to convert to a structured format? Choose OK for Fountain (screenplay) or Cancel for Markdown.")) {
                    handleFormatChange({ target: { value: 'fountain', name: 'format' } } as React.ChangeEvent<HTMLSelectElement>);
                  } else {
                    handleFormatChange({ target: { value: 'markdown', name: 'format' } } as React.ChangeEvent<HTMLSelectElement>);
                  }
                }}
              >
                <span>Convert to Structured Format</span> <FaArrowLeft />
              </button>
            </div>
          </div>
        );
    }
  }, [scene.format]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Link to="/scenes" className="btn btn-ghost mr-4">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">
            {isEditing ? `Edit Scene: ${scene.title}` : 'Create New Scene'}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEditing && (
            <>
              {!previewMode && (
                <button 
                  className={`btn btn-sm btn-outline ${showFormatHelp ? 'btn-primary' : ''}`}
                  onClick={() => setShowFormatHelp(!showFormatHelp)}
                >
                  <FaQuestion className="mr-1" /> Format Help
                </button>
              )}
              
              <button 
                className={`btn btn-sm btn-outline ${splitView ? 'btn-info' : ''}`}
                onClick={() => setSplitView(!splitView)}
                disabled={previewMode}
              >
                <FaCode className="mr-1" /> Split View
              </button>
              
              <button 
                className={`btn btn-sm ${previewMode ? 'btn-primary' : 'btn-outline btn-info'}`}
                onClick={() => setPreviewMode(!previewMode)}
              >
                <FaEye className="mr-1" /> {previewMode ? 'Edit' : 'Preview'}
              </button>
              
              <Link to={`/scenes/${id}/versions`} className="btn btn-sm btn-outline btn-secondary">
                <FaHistory className="mr-1" /> Versions
              </Link>
              
              <Link to={`/scenes/${id}/comments`} className="btn btn-sm btn-outline btn-warning">
                <FaComments className="mr-1" /> Comments
              </Link>
            </>
          )}
          
          <button 
            className="btn btn-sm btn-primary"
            onClick={() => isEditing ? setShowVersionDialog(true) : handleSave()}
            disabled={saving}
          >
            <FaSave className="mr-1" /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {previewMode ? (
        // Preview Mode
        <div className="bg-white p-6 rounded-lg shadow min-h-[70vh]">
          <h2 className="text-2xl font-bold mb-4">{scene.title}</h2>
          {scene.description && (
            <p className="text-gray-600 italic mb-6">{scene.description}</p>
          )}
          <div className="border-t pt-4">
            {scene.format === 'fountain' ? (
              <div className="fountain-preview font-mono">{renderFountainPreview(scene.content)}</div>
            ) : scene.format === 'markdown' ? (
              <div className="markdown-preview">{renderMarkdownPreview(scene.content)}</div>
            ) : (
              <div className="whitespace-pre-wrap">{scene.content}</div>
            )}
          </div>
        </div>
      ) : (
        // Edit Mode
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={splitView ? "md:col-span-2" : "md:col-span-3"}>
            <div className="bg-white p-6 rounded-lg shadow">
              {/* Main content area */}
              <div className={splitView ? "grid grid-cols-2 gap-4" : ""}>
                <div>
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
                  
                  {showFormatHelp && (
                    <div className="mb-4">
                      {renderFormatHelp()}
                    </div>
                  )}
                  
                  <div className="form-control mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <label className="label">
                        <span className="label-text font-semibold">Content</span>
                      </label>
                      <div className="flex items-center">
                        <label className="label cursor-pointer">
                          <span className="label-text mr-2 text-xs">Auto-detect format</span>
                          <input
                            type="checkbox"
                            className="toggle toggle-sm"
                            checked={autoDetectFormat}
                            onChange={(e) => setAutoDetectFormat(e.target.checked)}
                          />
                        </label>
                      </div>
                    </div>
                    <textarea
                      ref={editorRef}
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
                
                {splitView && (
                  <div className="border-l pl-4">
                    <h3 className="font-bold mb-2">Live Preview</h3>
                    <div className="border p-4 rounded-lg bg-gray-50 min-h-[500px] overflow-auto">
                      {scene.format === 'fountain' ? (
                        <div className="fountain-preview font-mono">{renderFountainPreview(scene.content)}</div>
                      ) : scene.format === 'markdown' ? (
                        <div className="markdown-preview">{renderMarkdownPreview(scene.content)}</div>
                      ) : (
                        <div className="whitespace-pre-wrap">{scene.content}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right sidebar - scene metadata */}
          {!splitView && (
            <div className="bg-white p-6 rounded-lg shadow">
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
                  <option value={SceneType.SCENE}>Scene</option>
                  <option value={SceneType.CHAPTER}>Chapter</option>
                  <option value={SceneType.OUTLINE_ELEMENT}>Outline Element</option>
                  <option value={SceneType.SUMMARY}>Summary</option>
                </select>
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Format</span>
                </label>
                <select
                  name="format"
                  value={scene.format}
                  onChange={handleFormatChange}
                  className="select select-bordered w-full"
                >
                  <option value="plain">Plain Text</option>
                  <option value="fountain">Fountain</option>
                  <option value="markdown">Markdown</option>
                </select>
                <label className="label">
                  <span className="label-text-alt">
                    {scene.format === 'fountain' ? 'Screenplay format with scene headings, characters, dialogue' : 
                     scene.format === 'markdown' ? 'Rich text with headings, lists, formatting' : 
                     'Simple text without special formatting'}
                  </span>
                </label>
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
                  {availableStories.map(story => (
                    <option key={story.id} value={story.id}>
                      {story.title}
                    </option>
                  ))}
                </select>
              </div>
              
              {showFormatHelp && renderFormatHelp()}
            </div>
          )}
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
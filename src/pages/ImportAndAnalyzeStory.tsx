import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupabaseService, StoryWorld, Story } from '../services/SupabaseService';

import './ImportAndAnalyzeStory.css';

interface FileInfo {
  file: File;
  content: string | null;
}

const ImportAndAnalyzeStory: React.FC = () => {
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryWorldId, setSelectedStoryWorldId] = useState<string>('');
  const [selectedStoryId, setSelectedStoryId] = useState<string>('');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isCreatingStoryWorld, setIsCreatingStoryWorld] = useState<boolean>(false);
  const [isCreatingStory, setIsCreatingStory] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newStoryWorldName, setNewStoryWorldName] = useState<string>('');
  const [newStoryTitle, setNewStoryTitle] = useState<string>('');
  
  const navigate = useNavigate();

  // Enhanced version (May 15, 2025)
  useEffect(() => {
    const loadStoryWorlds = async () => {
      try {
        const worlds = await SupabaseService.getStoryWorlds();
        setStoryWorlds(worlds);
      } catch (error) {
        console.error('Failed to load story worlds:', error);
        setError('Failed to load story worlds. Please refresh the page.');
      }
    };
    
    loadStoryWorlds();
  }, []);

  useEffect(() => {
    const loadStories = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (selectedStoryWorldId) {
          console.log(`Loading stories for story world ID: ${selectedStoryWorldId}`);
          const storiesList = await SupabaseService.getStories(selectedStoryWorldId);
          console.log('Loaded stories:', storiesList);
          setStories(storiesList);
        } else {
          setStories([]);
        }
        setSelectedStoryId('');
      } catch (error) {
        console.error('Error loading stories:', error);
        setError('Failed to load stories. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStories();
  }, [selectedStoryWorldId]);

  const handleFileUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFiles(prev => [...prev, { file, content }]);
      };
      
      reader.readAsText(file);
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const handleCreateStoryWorld = async () => {
    if (!newStoryWorldName.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newStoryWorld = await SupabaseService.createStoryWorld({
        name: newStoryWorldName
      });
      
      if (newStoryWorld) {
        setStoryWorlds(prev => [...prev, newStoryWorld]);
        setSelectedStoryWorldId(newStoryWorld.id);
        setNewStoryWorldName('');
        setIsCreatingStoryWorld(false);
      } else {
        throw new Error('Failed to create story world');
      }
    } catch (err) {
      console.error('Error creating story world:', err);
      setError('Failed to create story world. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStory = async () => {
    if (!newStoryTitle.trim() || !selectedStoryWorldId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Creating new story with title:', newStoryTitle);
      console.log('Story world ID:', selectedStoryWorldId);
      
      const newStory = await SupabaseService.createStory({
        title: newStoryTitle,
        name: newStoryTitle,
        story_world_id: selectedStoryWorldId,
        storyworld_id: selectedStoryWorldId
      });
      
      console.log('Story creation result:', newStory);
      
      if (newStory) {
        setStories(prev => [...prev, newStory]);
        setSelectedStoryId(newStory.id);
        setNewStoryTitle('');
        setIsCreatingStory(false);
      } else {
        throw new Error('Failed to create story - result was null');
      }
    } catch (err: any) {
      console.error('Error creating story:', err);
      setError(`Failed to create story: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoryWorldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (value === 'create-new') {
      setIsCreatingStoryWorld(true);
      setSelectedStoryWorldId('');
    } else {
      setIsCreatingStoryWorld(false);
      setSelectedStoryWorldId(value);
    }
  };

  const handleStoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (value === 'create-new') {
      setIsCreatingStory(true);
      setSelectedStoryId('');
    } else {
      setIsCreatingStory(false);
      setSelectedStoryId(value);
    }
  };

  const handleAnalyzeClick = () => {
    if (selectedStoryId && files.length > 0) {
      // Store analysis data in session storage for the progress and results pages
      sessionStorage.setItem('analysisData', JSON.stringify({
        storyId: selectedStoryId,
        storyWorldId: selectedStoryWorldId,
        files: files.map(f => ({ 
          name: f.file.name, 
          type: f.file.type,
          content: f.content
        }))
      }));
      
      navigate('/analyze-progress');
    }
  };

  const isAnalyzeDisabled = !selectedStoryId || files.length === 0 || isLoading;

  return (
    <div className="import-analyze-container">
      <h1>Import and Analyze Story</h1>
      <p>Upload a file to extract narrative elements like characters, locations, events, and plot structure. The system will analyze the content and organize it within StoryVerse.</p>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="selection-container">
        <div className="selection-group">
          <label htmlFor="storyWorld">Story World:</label>
          {isCreatingStoryWorld ? (
            <div className="create-new-input">
              <input
                type="text"
                value={newStoryWorldName}
                onChange={(e) => setNewStoryWorldName(e.target.value)}
                placeholder="Enter story world name"
                disabled={isLoading}
              />
              <button 
                onClick={handleCreateStoryWorld}
                disabled={isLoading || !newStoryWorldName.trim()}
              >
                {isLoading ? 'Creating...' : 'Create'}
              </button>
              <button 
                onClick={() => setIsCreatingStoryWorld(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          ) : (
            <select
              id="storyWorld"
              value={selectedStoryWorldId}
              onChange={handleStoryWorldChange}
              disabled={isLoading}
            >
              <option value="">Select a Story World</option>
              {storyWorlds.map(world => (
                <option key={world.id} value={world.id}>{world.name}</option>
              ))}
              <option value="create-new">Create New...</option>
            </select>
          )}
        </div>
        
        <div className="selection-group">
          <label htmlFor="story">Story:</label>
          {isCreatingStory ? (
            <div className="create-new-input">
              <input
                type="text"
                value={newStoryTitle}
                onChange={(e) => setNewStoryTitle(e.target.value)}
                placeholder="Enter story title"
                disabled={!selectedStoryWorldId || isLoading}
              />
              <button 
                onClick={handleCreateStory}
                disabled={!selectedStoryWorldId || isLoading || !newStoryTitle.trim()}
              >
                {isLoading ? 'Creating...' : 'Create'}
              </button>
              <button 
                onClick={() => setIsCreatingStory(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          ) : (
            <select
              id="story"
              value={selectedStoryId}
              onChange={handleStoryChange}
              disabled={!selectedStoryWorldId || isLoading}
            >
              <option value="">Select a Story</option>
              {stories.map(story => (
                <option key={story.id} value={story.id}>{story.title || story.name}</option>
              ))}
              {selectedStoryWorldId && <option value="create-new">Create New...</option>}
            </select>
          )}
        </div>
      </div>
      
      <div 
        className={`dropzone ${isDragging ? 'dragging' : ''} ${files.length > 0 ? 'has-files' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="dropzone-content">
          <p>Drag & drop a file here, or click to select</p>
          <input 
            type="file" 
            id="file-input" 
            accept=".txt,.md,.fountain" 
            onChange={handleFileInputChange}
            multiple
            disabled={isLoading}
          />
          <p className="supported-formats">
            Supported formats: TXT, Markdown, Fountain, PDF*, DOCX*, EPUB*
            <br />
            <small>* Advanced format support coming soon</small>
          </p>
        </div>
        
        {files.length > 0 && (
          <div className="files-list">
            <h3>Selected Files:</h3>
            <ul>
              {files.map((fileInfo, index) => (
                <li key={index}>
                  {fileInfo.file.name} ({(fileInfo.file.size / 1024).toFixed(2)} KB)
                  <button 
                    className="remove-file"
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="actions">
        <button 
          className="analyze-button"
          disabled={isAnalyzeDisabled}
          onClick={handleAnalyzeClick}
        >
          {isLoading ? 'Processing...' : 'Analyze'}
        </button>
      </div>
    </div>
  );
};

export default ImportAndAnalyzeStory;

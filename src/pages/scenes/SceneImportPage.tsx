import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaArrowLeft, FaUpload, FaCheckCircle, FaTimesCircle, FaEdit } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface DetectedScene {
  id?: string;
  title: string;
  content: string;
  type: string;
  format: string;
}

const SceneImportPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [importText, setImportText] = useState<string>('');
  const [importFormat, setImportFormat] = useState<string>('plain');
  const [detectionMethod, setDetectionMethod] = useState<string>('auto');
  const [sceneSeparator, setSceneSeparator] = useState<string>('');
  const [storyId, setStoryId] = useState<string>('');
  const [detectedScenes, setDetectedScenes] = useState<DetectedScene[]>([]);
  const [importStep, setImportStep] = useState<number>(1);
  const [processing, setProcessing] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  
  // Function to detect scenes based on the provided content and method
  const detectScenes = () => {
    if (!importText.trim()) {
      toast.error('Please enter text to import');
      return;
    }
    
    setProcessing(true);
    
    try {
      let scenes: DetectedScene[] = [];
      
      if (detectionMethod === 'auto') {
        // Automatic scene detection logic
        if (importFormat === 'fountain') {
          // Detect scenes based on Fountain format (scene headings)
          const lines = importText.split('\n');
          let currentScene: DetectedScene | null = null;
          let sceneContent = '';
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Scene heading detection in Fountain format
            if (line.match(/^(INT|EXT|I\/E)[\.\s]/i)) {
              // Save the previous scene if exists
              if (currentScene) {
                currentScene.content = sceneContent.trim();
                scenes.push(currentScene);
              }
              
              // Start a new scene
              const title = line.trim();
              currentScene = {
                title,
                content: line + '\n',
                type: 'scene',
                format: 'fountain'
              };
              sceneContent = line + '\n';
            } else if (currentScene) {
              // Add line to current scene
              sceneContent += line + '\n';
            }
          }
          
          // Add the last scene
          if (currentScene) {
            currentScene.content = sceneContent.trim();
            scenes.push(currentScene);
          }
        } else if (importFormat === 'markdown') {
          // Detect scenes based on Markdown format (headings)
          const lines = importText.split('\n');
          let currentScene: DetectedScene | null = null;
          let sceneContent = '';
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Heading detection in Markdown
            if (line.startsWith('# ') || line.startsWith('## ')) {
              // Save the previous scene if exists
              if (currentScene) {
                currentScene.content = sceneContent.trim();
                scenes.push(currentScene);
              }
              
              // Start a new scene
              const title = line.replace(/^#+\s+/, '').trim();
              currentScene = {
                title,
                content: line + '\n',
                type: line.startsWith('# ') ? 'chapter' : 'scene',
                format: 'markdown'
              };
              sceneContent = line + '\n';
            } else if (currentScene) {
              // Add line to current scene
              sceneContent += line + '\n';
            }
          }
          
          // Add the last scene
          if (currentScene) {
            currentScene.content = sceneContent.trim();
            scenes.push(currentScene);
          }
        } else {
          // Plain text - use paragraphs as a heuristic
          const paragraphs = importText.split(/\n\s*\n/);
          
          // If it's a large chunk with no clear scene breaks, create a single scene
          if (paragraphs.length === 1 || (paragraphs.length < 3 && importText.length > 500)) {
            scenes = [{
              title: 'Imported Scene',
              content: importText.trim(),
              type: 'scene',
              format: 'plain'
            }];
          } else {
            // Try to identify scenes from paragraphs
            let currentParagraph = 0;
            
            while (currentParagraph < paragraphs.length) {
              const startParagraph = paragraphs[currentParagraph].trim();
              
              // Use the first line as the title, limited to 50 chars
              const title = startParagraph.split('\n')[0].substring(0, 50) + 
                (startParagraph.split('\n')[0].length > 50 ? '...' : '');
              
              // Determine how many paragraphs to include in this scene
              // For simplicity, we'll use a sliding window approach
              const sceneParagraphCount = Math.min(
                5, // Max paragraphs per scene
                paragraphs.length - currentParagraph
              );
              
              const sceneContent = paragraphs
                .slice(currentParagraph, currentParagraph + sceneParagraphCount)
                .join('\n\n');
              
              scenes.push({
                title,
                content: sceneContent,
                type: 'scene',
                format: 'plain'
              });
              
              currentParagraph += sceneParagraphCount;
            }
          }
        }
      } else {
        // Custom separator method
        if (!sceneSeparator) {
          toast.error('Please specify a scene separator');
          setProcessing(false);
          return;
        }
        
        const parts = importText.split(new RegExp(sceneSeparator, 'g'));
        
        scenes = parts
          .filter(part => part.trim().length > 0)
          .map((part, index) => {
            const lines = part.trim().split('\n');
            const title = lines[0].substring(0, 50) + (lines[0].length > 50 ? '...' : '');
            
            return {
              title,
              content: part.trim(),
              type: 'scene',
              format: importFormat
            };
          });
      }
      
      if (scenes.length === 0) {
        toast.error('No scenes detected. Try adjusting your detection method.');
      } else {
        setDetectedScenes(scenes);
        setImportStep(2);
        toast.success(`${scenes.length} scene(s) detected`);
      }
    } catch (error) {
      console.error('Error detecting scenes:', error);
      toast.error('Error processing import text');
    } finally {
      setProcessing(false);
    }
  };
  
  // Function to handle scene metadata updates
  const handleSceneUpdate = (index: number, field: string, value: string) => {
    const updatedScenes = [...detectedScenes];
    updatedScenes[index] = {
      ...updatedScenes[index],
      [field]: value
    };
    setDetectedScenes(updatedScenes);
  };
  
  // Function to import scenes to the database
  const importScenes = async () => {
    if (detectedScenes.length === 0) {
      toast.error('No scenes to import');
      return;
    }
    
    setImporting(true);
    
    try {
      // Get the highest sequence number to start after
      let startSequence = 0;
      
      if (storyId) {
        const { data, error } = await supabase
          .from('scenes')
          .select('sequence_number')
          .eq('story_id', storyId)
          .order('sequence_number', { ascending: false })
          .limit(1);
        
        if (!error && data && data.length > 0) {
          startSequence = data[0].sequence_number || 0;
        }
      }
      
      // Insert all scenes
      const insertPromises = detectedScenes.map(async (scene, index) => {
        const { data, error } = await supabase
          .from('scenes')
          .insert({
            title: scene.title,
            content: scene.content,
            story_id: storyId || null,
            type: scene.type,
            format: scene.format,
            sequence_number: startSequence + index + 1,
            is_visible: true,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Create initial version
        await supabase
          .from('scene_versions')
          .insert({
            scene_id: data.id,
            content: scene.content,
            version_number: 1,
            notes: 'Initial import',
          });
        
        return data;
      });
      
      await Promise.all(insertPromises);
      
      toast.success(`Successfully imported ${detectedScenes.length} scenes`);
      navigate('/scenes');
      
    } catch (error) {
      console.error('Error importing scenes:', error);
      toast.error('Failed to import scenes');
    } finally {
      setImporting(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link to="/scenes" className="btn btn-ghost mr-4">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">
            Import Scenes
          </h1>
        </div>
        {importStep === 2 && (
          <button 
            className="btn btn-primary flex items-center"
            onClick={importScenes}
            disabled={importing}
          >
            <FaUpload className="mr-2" /> {importing ? 'Importing...' : 'Import Scenes'}
          </button>
        )}
      </div>
      
      {/* Step Indicator */}
      <div className="steps mb-8 w-full">
        <div className={`step ${importStep >= 1 ? 'step-primary' : ''}`}>
          Paste Content
        </div>
        <div className={`step ${importStep >= 2 ? 'step-primary' : ''}`}>
          Review Scenes
        </div>
        <div className={`step ${importStep >= 3 ? 'step-primary' : ''}`}>
          Complete
        </div>
      </div>
      
      {importStep === 1 && (
        /* Step 1: Input Content */
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Paste Text to Import</span>
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="textarea textarea-bordered w-full font-mono"
                  placeholder="Paste the content you want to import here..."
                  rows={20}
                  required
                />
              </div>
            </div>
            
            <div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Format</span>
                </label>
                <select
                  value={importFormat}
                  onChange={(e) => setImportFormat(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="plain">Plain Text</option>
                  <option value="fountain">Fountain</option>
                  <option value="markdown">Markdown</option>
                </select>
                <label className="label">
                  <span className="label-text-alt">Select the format of the text you're importing</span>
                </label>
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Scene Detection Method</span>
                </label>
                <select
                  value={detectionMethod}
                  onChange={(e) => setDetectionMethod(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="auto">Automatic (Based on Format)</option>
                  <option value="separator">Custom Separator</option>
                </select>
                <label className="label">
                  <span className="label-text-alt">How to identify individual scenes</span>
                </label>
              </div>
              
              {detectionMethod === 'separator' && (
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-semibold">Scene Separator</span>
                  </label>
                  <input
                    type="text"
                    value={sceneSeparator}
                    onChange={(e) => setSceneSeparator(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="e.g., ===== or SCENE BREAK"
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt">Text pattern that separates scenes</span>
                  </label>
                </div>
              )}
              
              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text font-semibold">Assign to Story (Optional)</span>
                </label>
                <select
                  value={storyId}
                  onChange={(e) => setStoryId(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="">None</option>
                  {/* This would be populated with actual stories */}
                  <option value="placeholder">Sample Story</option>
                </select>
              </div>
              
              <button 
                className="btn btn-primary w-full"
                onClick={detectScenes}
                disabled={processing || !importText.trim()}
              >
                {processing ? 'Processing...' : 'Detect Scenes'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {importStep === 2 && (
        /* Step 2: Review Detected Scenes */
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">
            Review Detected Scenes ({detectedScenes.length})
          </h2>
          
          <div className="mb-4 text-sm text-gray-600">
            Review and edit the metadata for each detected scene before importing.
          </div>
          
          <div className="space-y-8">
            {detectedScenes.map((scene, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="form-control w-full max-w-xs">
                    <label className="label">
                      <span className="label-text font-semibold">Title</span>
                    </label>
                    <input
                      type="text"
                      value={scene.title}
                      onChange={(e) => handleSceneUpdate(index, 'title', e.target.value)}
                      className="input input-bordered w-full"
                    />
                  </div>
                  
                  <div className="flex space-x-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Type</span>
                      </label>
                      <select
                        value={scene.type}
                        onChange={(e) => handleSceneUpdate(index, 'type', e.target.value)}
                        className="select select-bordered"
                      >
                        <option value="scene">Scene</option>
                        <option value="chapter">Chapter</option>
                        <option value="outline_element">Outline</option>
                        <option value="summary">Summary</option>
                      </select>
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Format</span>
                      </label>
                      <select
                        value={scene.format}
                        onChange={(e) => handleSceneUpdate(index, 'format', e.target.value)}
                        className="select select-bordered"
                      >
                        <option value="plain">Plain Text</option>
                        <option value="fountain">Fountain</option>
                        <option value="markdown">Markdown</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="preview bg-gray-50 p-4 rounded font-mono text-sm overflow-auto max-h-48">
                  {scene.content.length > 500 
                    ? scene.content.substring(0, 500) + '...' 
                    : scene.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SceneImportPage;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaArrowLeft, FaFileExport, FaDownload, FaClipboard, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Scene, Story, SceneType } from '../../supabase-tables';

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const ExportFormats: ExportFormat[] = [
  {
    id: 'plain',
    name: 'Plain Text',
    description: 'Export as a simple text file with scene breaks',
    icon: <FaFileExport className="text-4xl text-gray-600" />
  },
  {
    id: 'fountain',
    name: 'Fountain',
    description: 'Export in Fountain screenplay format',
    icon: <FaFileExport className="text-4xl text-blue-600" />
  },
  {
    id: 'markdown',
    name: 'Markdown',
    description: 'Export in Markdown format with scene headings',
    icon: <FaFileExport className="text-4xl text-green-600" />
  }
];

const SceneExportPage: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedStory, setSelectedStory] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('plain');
  const [selectedScenes, setSelectedScenes] = useState<string[]>([]);
  const [includeComments, setIncludeComments] = useState<boolean>(false);
  const [includeMetadata, setIncludeMetadata] = useState<boolean>(false);
  const [exportOutput, setExportOutput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  
  // Fetch stories and scenes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch stories
        const { data: storiesData, error: storiesError } = await supabase
          .from('stories')
          .select('*')
          .order('title');
        
        if (storiesError) throw storiesError;
        setStories(storiesData || []);
        
        // Fetch all scenes
        const { data: scenesData, error: scenesError } = await supabase
          .from('scenes')
          .select('*')
          .order('sequence_number');
        
        if (scenesError) throw scenesError;
        setScenes(scenesData || []);
        
      } catch (error) {
        console.error('Error fetching export data:', error);
        toast.error('Failed to load export data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter scenes when story selection changes
  useEffect(() => {
    if (selectedStory) {
      // Filter to only show scenes from the selected story
      const storyScenes = scenes.filter(scene => scene.story_id === selectedStory);
      setSelectedScenes(storyScenes.map(scene => scene.id));
    } else {
      // Clear selection when no story is selected
      setSelectedScenes([]);
    }
  }, [selectedStory, scenes]);
  
  // Toggle scene selection
  const toggleSceneSelection = (sceneId: string) => {
    if (selectedScenes.includes(sceneId)) {
      setSelectedScenes(prev => prev.filter(id => id !== sceneId));
    } else {
      setSelectedScenes(prev => [...prev, sceneId]);
    }
  };
  
  // Select/deselect all scenes
  const toggleAllScenes = () => {
    const filteredScenes = selectedStory 
      ? scenes.filter(scene => scene.story_id === selectedStory)
      : scenes;
    
    if (selectedScenes.length === filteredScenes.length) {
      setSelectedScenes([]);
    } else {
      setSelectedScenes(filteredScenes.map(scene => scene.id));
    }
  };
  
  // Generate the export
  const generateExport = async () => {
    if (selectedScenes.length === 0) {
      toast.error('Please select at least one scene to export');
      return;
    }
    
    setExporting(true);
    
    try {
      // Fetch the selected scenes with all data
      const { data: scenesData, error: scenesError } = await supabase
        .from('scenes')
        .select(`
          *,
          scene_comments(*),
          story:story_id(title)
        `)
        .in('id', selectedScenes)
        .order('sequence_number');
      
      if (scenesError) throw scenesError;
      if (!scenesData || scenesData.length === 0) throw new Error('No scenes found');
      
      // Get the story title if available
      const storyTitle = selectedStory && stories.find(s => s.id === selectedStory)?.title;
      
      // Format the output based on the selected export format
      let output = '';
      
      // Add metadata header if requested
      if (includeMetadata) {
        output += `Title: ${storyTitle || 'Untitled Export'}\n`;
        output += `Date: ${new Date().toLocaleDateString()}\n`;
        output += `Scenes: ${scenesData.length}\n\n`;
      }
      
      // Generate the export based on the selected format
      if (selectedFormat === 'fountain') {
        // Fountain format
        output += `Title: ${storyTitle || 'Untitled Script'}\n\n`;
        
        scenesData.forEach((scene, index) => {
          // Add scene separator
          if (index > 0) output += '\n\n';
          
          // Convert plain text to Fountain if needed
          if (scene.format !== 'fountain') {
            const lines = scene.content.split('\n');
            
            // Use scene title as scene heading if not already in Fountain format
            if (!lines[0].match(/^(INT|EXT|I\/E)/i)) {
              output += `INT. ${scene.title.toUpperCase()} - DAY\n\n`;
            }
            
            output += scene.content;
          } else {
            // Already in Fountain format
            output += scene.content;
          }
          
          // Add comments if requested
          if (includeComments && scene.scene_comments && scene.scene_comments.length > 0) {
            output += '\n\n/* COMMENTS:\n';
            scene.scene_comments.forEach(comment => {
              output += `- ${comment.content.replace(/\n/g, ' ')}\n`;
            });
            output += '*/\n';
          }
        });
      } else if (selectedFormat === 'markdown') {
        // Markdown format
        output += `# ${storyTitle || 'Untitled Document'}\n\n`;
        
        scenesData.forEach((scene, index) => {
          // Add scene heading
          output += `## ${scene.title}\n\n`;
          
          // Add scene content, ensuring it's properly formatted for Markdown
          if (scene.format === 'markdown') {
            output += `${scene.content}\n\n`;
          } else {
            // Convert plain text or Fountain to Markdown
            const paragraphs = scene.content.split(/\n\s*\n/);
            output += paragraphs.join('\n\n') + '\n\n';
          }
          
          // Add comments if requested
          if (includeComments && scene.scene_comments && scene.scene_comments.length > 0) {
            output += '> **Comments:**\n';
            scene.scene_comments.forEach(comment => {
              output += `> - ${comment.content.replace(/\n/g, ' ')}\n`;
            });
            output += '\n';
          }
        });
      } else {
        // Plain text format
        if (storyTitle) {
          output += `${storyTitle.toUpperCase()}\n\n`;
        }
        
        scenesData.forEach((scene, index) => {
          // Add scene separator
          if (index > 0) output += '\n\n==========\n\n';
          
          // Add scene title
          output += `${scene.title.toUpperCase()}\n\n`;
          
          // Add scene content
          output += scene.content;
          
          // Add comments if requested
          if (includeComments && scene.scene_comments && scene.scene_comments.length > 0) {
            output += '\n\nCOMMENTS:\n';
            scene.scene_comments.forEach(comment => {
              output += `- ${comment.content.replace(/\n/g, ' ')}\n`;
            });
          }
        });
      }
      
      setExportOutput(output);
      toast.success('Export generated successfully');
      
    } catch (error) {
      console.error('Error generating export:', error);
      toast.error('Failed to generate export');
    } finally {
      setExporting(false);
    }
  };
  
  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportOutput)
      .then(() => {
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        toast.error('Failed to copy to clipboard');
      });
  };
  
  // Download the export
  const downloadExport = () => {
    const blob = new Blob([exportOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const extension = selectedFormat === 'fountain' ? 'fountain' : 
                      selectedFormat === 'markdown' ? 'md' : 'txt';
    
    const fileName = `${selectedStory ? 
      stories.find(s => s.id === selectedStory)?.title || 'export' : 
      'scenes-export'}.${extension}`;
    
    a.href = url;
    a.download = fileName.replace(/\s+/g, '-').toLowerCase();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <Link to="/scenes" className="btn btn-ghost mr-4">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">
            Export Scenes
          </h1>
        </div>
        {!exportOutput && (
          <button 
            className="btn btn-primary flex items-center"
            onClick={generateExport}
            disabled={exporting || selectedScenes.length === 0}
          >
            <FaFileExport className="mr-2" /> {exporting ? 'Generating...' : 'Generate Export'}
          </button>
        )}
      </div>
      
      {!exportOutput ? (
        /* Export Configuration */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Format Selection */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Export Format</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {ExportFormats.map(format => (
                <div 
                  key={format.id}
                  className={`cursor-pointer border rounded-lg p-4 ${
                    selectedFormat === format.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedFormat(format.id)}
                >
                  <div className="flex items-center">
                    <div className="mr-4">
                      {format.icon}
                    </div>
                    <div>
                      <h3 className="font-bold">{format.name}</h3>
                      <p className="text-sm text-gray-600">{format.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 space-y-4">
              <h3 className="font-bold">Export Options</h3>
              
              <div className="form-control">
                <label className="label cursor-pointer justify-start">
                  <input
                    type="checkbox"
                    className="checkbox mr-2"
                    checked={includeComments}
                    onChange={() => setIncludeComments(!includeComments)}
                  />
                  <span className="label-text">Include comments</span>
                </label>
              </div>
              
              <div className="form-control">
                <label className="label cursor-pointer justify-start">
                  <input
                    type="checkbox"
                    className="checkbox mr-2"
                    checked={includeMetadata}
                    onChange={() => setIncludeMetadata(!includeMetadata)}
                  />
                  <span className="label-text">Include metadata header</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Right Column: Scene Selection */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Select Scenes</h2>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">Filter by Story (Optional)</span>
              </label>
              <select
                value={selectedStory}
                onChange={(e) => setSelectedStory(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">All Scenes</option>
                {stories.map(story => (
                  <option key={story.id} value={story.id}>
                    {story.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <button 
                className="btn btn-sm btn-outline"
                onClick={toggleAllScenes}
              >
                {selectedScenes.length === (selectedStory 
                  ? scenes.filter(s => s.story_id === selectedStory).length 
                  : scenes.length) 
                  ? 'Deselect All' 
                  : 'Select All'}
              </button>
            </div>
            
            <div className="overflow-auto max-h-96 border rounded-lg">
              {(selectedStory 
                ? scenes.filter(s => s.story_id === selectedStory)
                : scenes
              ).length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No scenes available
                </div>
              ) : (
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Title</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedStory 
                      ? scenes.filter(s => s.story_id === selectedStory)
                      : scenes
                    ).map(scene => (
                      <tr key={scene.id} className="hover:bg-gray-50">
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedScenes.includes(scene.id)}
                            onChange={() => toggleSceneSelection(scene.id)}
                          />
                        </td>
                        <td>{scene.title}</td>
                        <td>
                          <span className="badge badge-sm">
                            {scene.type === SceneType.SCENE ? 'Scene' : 
                             scene.type === SceneType.CHAPTER ? 'Chapter' :
                             scene.type === SceneType.OUTLINE_ELEMENT ? 'Outline' : 
                             scene.type === SceneType.SUMMARY ? 'Summary' : scene.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="mt-4 text-right">
              <span className="text-sm text-gray-600">
                {selectedScenes.length} scene(s) selected
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Export Results */
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Export Output</h2>
            <div className="flex space-x-2">
              <button 
                className="btn btn-outline btn-primary flex items-center"
                onClick={copyToClipboard}
              >
                {copied ? <FaCheck className="mr-2" /> : <FaClipboard className="mr-2" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button 
                className="btn btn-primary flex items-center"
                onClick={downloadExport}
              >
                <FaDownload className="mr-2" /> Download
              </button>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 bg-gray-50 font-mono overflow-auto max-h-[70vh] whitespace-pre-wrap">
            {exportOutput}
          </div>
          
          <div className="flex justify-end mt-4">
            <button 
              className="btn btn-outline"
              onClick={() => setExportOutput('')}
            >
              Back to Export Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SceneExportPage;
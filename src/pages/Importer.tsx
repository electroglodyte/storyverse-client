import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import './Importer.css';
import { v4 as uuidv4 } from 'uuid'; // Add UUID import

interface FileInfo {
  file: File;
  content: string | null;
}

interface ExtractedElements {
  characters: any[];
  locations: any[];
  plotlines: any[];
  scenes: any[];
  events: any[];
}

// Default story and world UUIDs - use the existing records from the database
const DEFAULT_STORYWORLD_ID = 'bb4e4c55-0280-4ba1-985b-1590e3270d65'; // NoneVerse UUID
const DEFAULT_STORY_ID = '02334755-067a-44b2-bb58-9c8aa24ac667'; // NoneStory UUID

// Helper function to extract characters marked in ALL CAPS
const extractAllCapsCharacters = (text: string): string[] => {
  // Regular expression to match words in ALL CAPS with 2 or more letters
  const allCapsRegex = /\b[A-Z]{2,}(?:'[A-Z]+)?\b/g;
  const matches = text.match(allCapsRegex) || [];
  
  // Filter out common non-character ALL CAPS words
  const nonCharacterWords = ['THE', 'AND', 'OF', 'TO', 'IN', 'A', 'FOR', 'WITH', 'IS', 'ON', 'AT', 'BY', 'AS', 'IT', 'ALL'];
  return [...new Set(matches)].filter(word => !nonCharacterWords.includes(word));
};

const Importer: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'characters' | 'locations' | 'plotlines' | 'scenes' | 'events' | 'complete'>('upload');
  const [extractedElements, setExtractedElements] = useState<ExtractedElements | null>(null);
  const [selectedElements, setSelectedElements] = useState<{
    characters: string[];
    locations: string[];
    plotlines: string[];
    scenes: string[];
    events: string[];
  }>({
    characters: [],
    locations: [],
    plotlines: [],
    scenes: [],
    events: []
  });
  const [debugInfo, setDebugInfo] = useState<string>(''); // Add debug info

  const navigate = useNavigate();

  // File handling functions
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

  // Process the file and extract elements
  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError('Please upload a file first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the content of the first file
      const fileContent = files[0].content;
      
      if (!fileContent) {
        throw new Error('File content is empty');
      }

      // Extract ALL CAPS characters directly from the text first
      const allCapsCharacters = extractAllCapsCharacters(fileContent);
      setDebugInfo(`Found ${allCapsCharacters.length} ALL CAPS characters: ${allCapsCharacters.join(', ')}`);
      
      // Create character objects from ALL CAPS names
      const characterObjects = allCapsCharacters.map(name => {
        // Set role based on character name if possible
        let role: 'protagonist' | 'antagonist' | 'supporting' | 'background' | 'other' = 'supporting';
        let description = 'A character in the story';
        
        // Sample role detection logic - adjust as needed
        if (name === 'RUFUS') {
          role = 'protagonist';
          description = 'The main character, a young wolf';
        } else if (name === 'STUPUS') {
          role = 'antagonist';
          description = 'An arrogant character who antagonizes Rufus';
        }
        
        return {
          id: uuidv4(),
          name: name.charAt(0) + name.slice(1).toLowerCase(), // Convert to Title Case
          role,
          description,
          story_id: DEFAULT_STORY_ID,
          confidence: 0.9 // High confidence for ALL CAPS characters
        };
      });

      // Call the analyze-story edge function with a unique request ID to avoid caching
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      try {
        // Call API in parallel, but don't wait for it
        supabase.functions.invoke('analyze-story', {
          body: {
            story_text: fileContent,
            story_title: files[0].file.name.replace(/\\.[^/.]+$/, ""),
            story_world_id: DEFAULT_STORYWORLD_ID,
            options: {
              create_project: false,
              story_id: DEFAULT_STORY_ID,
              extract_characters: true,
              extract_locations: true,
              extract_events: true,
              extract_scenes: true,
              extract_relationships: true,
              extract_dependencies: true, 
              extract_plotlines: true,
              extract_arcs: true,
              debug: true,
              request_id: requestId,
              bypass_cache: true,
              timestamp: new Date().toISOString()
            }
          }
        }).then(response => {
          if (response.error) {
            console.warn('API warning:', response.error.message);
            setDebugInfo(prev => `${prev}\nAPI warning: ${response.error.message}`);
          } else {
            console.log('API results:', response.data);
            setDebugInfo(prev => `${prev}\nAPI returned ${response.data?.characters?.length || 0} characters`);
          }
        }).catch(apiErr => {
          console.warn('API error:', apiErr);
          setDebugInfo(prev => `${prev}\nAPI error: ${apiErr.message}`);
        });
      } catch (apiErr: any) {
        console.warn('Failed to call API, using direct extraction only:', apiErr);
        setDebugInfo(prev => `${prev}\nAPI call failed: ${apiErr.message}`);
      }

      // Create a skeleton response with our character data
      const processedData = {
        characters: characterObjects,
        locations: [],
        plotlines: [],
        scenes: [],
        events: []
      };
      
      // Store the extracted elements and move to the first review step
      setExtractedElements(processedData);
      
      // Initialize selected elements with all the IDs (by default all are selected)
      setSelectedElements({
        characters: processedData.characters?.map((c: any) => c.id) || [],
        locations: processedData.locations?.map((l: any) => l.id) || [],
        plotlines: processedData.plotlines?.map((p: any) => p.id) || [],
        scenes: processedData.scenes?.map((s: any) => s.id) || [],
        events: processedData.events?.map((e: any) => e.id) || []
      });

      // Move to the first review step
      setCurrentStep('characters');
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(`Error analyzing file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle selection of an element
  const toggleElementSelection = (type: 'characters' | 'locations' | 'plotlines' | 'scenes' | 'events', id: string) => {
    setSelectedElements(prev => {
      if (prev[type].includes(id)) {
        return {
          ...prev,
          [type]: prev[type].filter(itemId => itemId !== id)
        };
      } else {
        return {
          ...prev,
          [type]: [...prev[type], id]
        };
      }
    });
  };

  // Select/deselect all elements of a given type
  const toggleAllSelection = (type: 'characters' | 'locations' | 'plotlines' | 'scenes' | 'events', select: boolean) => {
    if (!extractedElements) return;
    
    setSelectedElements(prev => {
      if (select) {
        return {
          ...prev,
          [type]: extractedElements[type]?.map((item: any) => item.id) || []
        };
      } else {
        return {
          ...prev,
          [type]: []
        };
      }
    });
  };

  // New simplified approach: just get existing names/titles as strings
  const getExistingNameMap = async (type: 'characters' | 'locations' | 'plotlines' | 'scenes' | 'events', elements: any[]) => {
    // Define the name field based on the type
    const nameField = type === 'plotlines' || type === 'scenes' || type === 'events' ? 'title' : 'name';
    
    // Extract all names to check
    const namesToCheck = elements
      .filter(elem => elem && elem[nameField])
      .map(elem => elem[nameField]);
    
    if (namesToCheck.length === 0) {
      return { existingNames: new Set<string>(), count: 0 };
    }
    
    try {
      // Query the database for any matching names
      const { data, error } = await supabase
        .from(type)
        .select('id, ' + nameField)
        .in(nameField, namesToCheck);
      
      if (error) {
        console.error(`Error checking for duplicates in ${type}:`, error);
        return { existingNames: new Set<string>(), count: 0 };
      }
      
      // Create a set of existing names (lowercase for case-insensitive comparison)
      const existingNames = new Set<string>();
      
      // Safely process data
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item && item[nameField]) {
            existingNames.add(String(item[nameField]).toLowerCase());
          }
        });
      }
      
      return { existingNames, count: existingNames.size };
    } catch (err) {
      console.error(`Error in getExistingNameMap:`, err);
      return { existingNames: new Set<string>(), count: 0 };
    }
  };

  // Save the selected elements to the database
  const saveElementsToDatabase = async (type: 'characters' | 'locations' | 'plotlines' | 'scenes' | 'events') => {
    if (!extractedElements) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the selected elements of the current type
      const elementsToSave = extractedElements[type]
        .filter((elem: any) => selectedElements[type].includes(elem.id));
      
      if (elementsToSave.length === 0) {
        // If nothing selected, just move to the next step
        moveToNextStep();
        return;
      }
      
      // Check for duplicates using our simplified approach
      const { existingNames, count: duplicatesCount } = await getExistingNameMap(type, elementsToSave);
      
      // Filter out duplicate elements
      const nameField = type === 'plotlines' || type === 'scenes' || type === 'events' ? 'title' : 'name';
      
      const newElements = elementsToSave.filter(elem => {
        if (!elem || !elem[nameField]) return false;
        const elemName = String(elem[nameField]).toLowerCase();
        return !existingNames.has(elemName);
      });
      
      if (duplicatesCount > 0) {
        console.log(`Found ${duplicatesCount} existing ${type} that will be skipped.`);
      }
      
      if (newElements.length === 0) {
        console.log(`All ${type} already exist in the database. Skipping.`);
        moveToNextStep();
        return;
      }
      
      // Prepare elements for saving based on type
      const preparedElements = newElements.map((elem: any) => {
        // Common fields for all element types
        const commonFields = {
          id: elem.id, // Now using UUID
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Add type-specific fields
        switch (type) {
          case 'characters':
            return {
              ...commonFields,
              name: elem.name,
              description: elem.description || '',
              story_world_id: DEFAULT_STORYWORLD_ID,
              story_id: DEFAULT_STORY_ID,
              role: elem.role || 'supporting',
              appearance: elem.appearance || '',
              background: elem.background || '',
              personality: elem.personality || '',
            };
          
          case 'locations':
            return {
              ...commonFields,
              name: elem.name,
              description: elem.description || '',
              story_world_id: DEFAULT_STORYWORLD_ID,
              story_id: DEFAULT_STORY_ID,
              location_type: elem.location_type || 'other',
            };
          
          case 'plotlines':
            return {
              ...commonFields,
              title: elem.title,
              description: elem.description || '',
              story_id: DEFAULT_STORY_ID,
              plotline_type: elem.plotline_type || 'main',
            };
          
          case 'scenes':
            return {
              ...commonFields,
              title: elem.title,
              description: elem.description || '',
              story_id: DEFAULT_STORY_ID,
              content: elem.content || '',
              type: elem.type || 'scene',
              status: 'draft',
              is_visible: true,
            };
          
          case 'events':
            return {
              ...commonFields,
              title: elem.title || elem.name,
              description: elem.description || '',
              story_id: DEFAULT_STORY_ID,
              sequence_number: elem.sequence_number || 0,
            };
          
          default:
            return elem;
        }
      });
      
      // Insert elements into the appropriate table
      const { data, error } = await supabase
        .from(type)
        .insert(preparedElements)
        .select();
      
      if (error) {
        throw new Error(`Error saving ${type}: ${error.message}`);
      }
      
      console.log(`Saved ${data?.length || 0} ${type}:`, data);
      
      // If some duplicates were skipped, show a message
      if (duplicatesCount > 0) {
        setError(`Note: ${duplicatesCount} ${type} already existed and were skipped.`);
        setTimeout(() => setError(null), 5000); // Clear message after 5 seconds
      }
      
      // Move to the next step automatically
      moveToNextStep();
    } catch (err: any) {
      console.error(`Error saving ${type}:`, err);
      const errorMessage = err.message || 'Unknown error';
      setError(`Error saving ${type}: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Move to the next step in the process
  const moveToNextStep = () => {
    switch (currentStep) {
      case 'upload':
        setCurrentStep('characters');
        break;
      case 'characters':
        setCurrentStep('locations');
        break;
      case 'locations':
        setCurrentStep('plotlines');
        break;
      case 'plotlines':
        setCurrentStep('scenes');
        break;
      case 'scenes':
        setCurrentStep('events');
        break;
      case 'events':
        setCurrentStep('complete');
        break;
      case 'complete':
        // Reset everything and go back to upload
        setFiles([]);
        setExtractedElements(null);
        setSelectedElements({
          characters: [],
          locations: [],
          plotlines: [],
          scenes: [],
          events: []
        });
        setCurrentStep('upload');
        break;
    }
  };

  // Skip the current step without saving
  const skipCurrentStep = () => {
    moveToNextStep();
  };

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="importer-upload-step">
            <h2>Import a File</h2>
            <p>Upload a file to extract characters, locations, plotlines, scenes, and events.</p>
            
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
            
            <div className="action-buttons">
              <button 
                className="primary-button"
                onClick={handleAnalyze}
                disabled={files.length === 0 || isLoading}
              >
                {isLoading ? 'Analyzing...' : 'Analyze File'}
              </button>
            </div>
          </div>
        );
      
      case 'characters':
        return renderElementsReview('characters', 'Characters');
      
      case 'locations':
        return renderElementsReview('locations', 'Locations');
      
      case 'plotlines':
        return renderElementsReview('plotlines', 'Plotlines');
      
      case 'scenes':
        return renderElementsReview('scenes', 'Scenes');
      
      case 'events':
        return renderElementsReview('events', 'Events');
      
      case 'complete':
        return (
          <div className="importer-complete-step">
            <div className="success-icon">✓</div>
            <h2>Import Complete!</h2>
            <p>All selected elements have been successfully imported to the database.</p>
            
            <div className="action-buttons">
              <button 
                className="primary-button"
                onClick={() => navigate('/')}
              >
                Go to Dashboard
              </button>
              <button 
                className="secondary-button"
                onClick={() => setCurrentStep('upload')}
              >
                Import Another File
              </button>
            </div>
          </div>
        );
    }
  };

  // Helper function to render the review screen for each element type
  const renderElementsReview = (type: 'characters' | 'locations' | 'plotlines' | 'scenes' | 'events', title: string) => {
    if (!extractedElements) return null;
    
    const elements = extractedElements[type] || [];
    const count = elements.length;
    const selectedCount = selectedElements[type].length;
    
    // Get display properties based on element type
    const getNameProperty = () => {
      return type === 'plotlines' || type === 'scenes' || type === 'events' ? 'title' : 'name';
    };
    
    const getTypeProperty = () => {
      switch (type) {
        case 'characters': return 'role';
        case 'locations': return 'location_type';
        case 'plotlines': return 'plotline_type';
        case 'scenes': return 'type';
        case 'events': return '';
      }
    };
    
    return (
      <div className="importer-elements-review">
        <h2>{title} ({count} found)</h2>
        <p>Review and select the {title.toLowerCase()} to import.</p>
        
        {/* Debug info - temporarily show this */}
        {debugInfo && type === 'characters' && (
          <div style={{ margin: '10px 0', padding: '8px', backgroundColor: '#f0f8ff', borderRadius: '4px', fontSize: '12px' }}>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{debugInfo}</pre>
          </div>
        )}
        
        <div className="elements-selection-controls">
          <div className="selection-info">
            <span>{selectedCount} of {count} selected</span>
          </div>
          <div className="selection-buttons">
            <button onClick={() => toggleAllSelection(type, true)}>Select All</button>
            <button onClick={() => toggleAllSelection(type, false)}>Deselect All</button>
          </div>
        </div>
        
        {count > 0 ? (
          <div className="elements-list">
            {elements.map((element: any) => {
              const isSelected = selectedElements[type].includes(element.id);
              const nameProperty = getNameProperty();
              const typeProperty = getTypeProperty();
              
              return (
                <div 
                  key={element.id} 
                  className={`element-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleElementSelection(type, element.id)}
                >
                  <div className="element-checkbox">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => {}} // Managed by the card click
                      onClick={(e) => e.stopPropagation()} // Prevent double-toggle
                    />
                  </div>
                  <div className="element-details">
                    <h3>{element[nameProperty]}</h3>
                    {typeProperty && element[typeProperty] && (
                      <span className="element-type">{element[typeProperty]}</span>
                    )}
                    {element.description && (
                      <p className="element-description">
                        {element.description.length > 100 
                          ? `${element.description.substring(0, 100)}...` 
                          : element.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No {title.toLowerCase()} found in the uploaded file.</p>
          </div>
        )}
        
        <div className="action-buttons">
          <button 
            className="primary-button"
            onClick={() => saveElementsToDatabase(type)}
            disabled={isLoading || selectedElements[type].length === 0}
          >
            {isLoading ? 'Saving...' : `Save ${selectedCount} ${title}`}
          </button>
          <button 
            className="secondary-button"
            onClick={skipCurrentStep}
            disabled={isLoading}
          >
            Skip
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="importer-container">
      <h1>Story Importer</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {renderStep()}
    </div>
  );
};

export default Importer;
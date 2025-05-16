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

      // Call the analyze-story edge function with a unique request ID to avoid caching
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      const response = await supabase.functions.invoke('analyze-story', {
        body: {
          story_text: fileContent,
          story_title: files[0].file.name.replace(/\.[^/.]+$/, ""),
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
      });

      if (response.error) {
        throw new Error(`Analysis error: ${response.error.message || 'Unknown error'}`);
      }

      // Generate proper UUIDs for each element
      const processedData = processElementsWithUuids(response.data);
      
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

  // Process elements and replace tempIDs with UUIDs
  const processElementsWithUuids = (data: any) => {
    const processedData = { ...data };
    
    // Process each type of element
    ['characters', 'locations', 'plotlines', 'scenes', 'events'].forEach(type => {
      if (Array.isArray(processedData[type])) {
        // Create a mapping from old IDs to new UUIDs
        const idMapping: { [key: string]: string } = {};
        
        // First pass: generate UUIDs
        processedData[type] = processedData[type].map((item: any) => {
          const uuid = uuidv4();
          idMapping[item.id] = uuid;
          
          return {
            ...item,
            id: uuid
          };
        });
        
        // Second pass: update any references to other items
        // This will update any links between elements (e.g., a character referenced in a scene)
        processedData[type] = processedData[type].map((item: any) => {
          const updatedItem = { ...item };
          
          // Update any fields that might reference other elements
          Object.keys(updatedItem).forEach(key => {
            if (key.endsWith('_id') && typeof updatedItem[key] === 'string' && idMapping[updatedItem[key]]) {
              updatedItem[key] = idMapping[updatedItem[key]];
            }
          });
          
          return updatedItem;
        });
      }
    });
    
    return processedData;
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

  // Check if an element already exists in the database
  const checkDuplicates = async (type: 'characters' | 'locations' | 'plotlines' | 'scenes' | 'events', elements: any[]) => {
    // Define the name field based on the type
    const nameField = type === 'plotlines' || type === 'scenes' || type === 'events' ? 'title' : 'name';
    
    // Extract all names to check
    const namesToCheck = elements.map(elem => elem[nameField]);
    
    if (namesToCheck.length === 0) return [];
    
    // Query the database for any matching names
    const { data, error } = await supabase
      .from(type)
      .select('id, ' + nameField)
      .in(nameField, namesToCheck);
    
    if (error) {
      console.error(`Error checking for duplicates in ${type}:`, error);
      throw new Error(`Error checking for duplicates: ${error.message}`);
    }
    
    // Create a map of existing names to their IDs
    const existingNamesMap = new Map();
    if (data) {
      data.forEach(item => {
        existingNamesMap.set(item[nameField].toLowerCase(), item.id);
      });
    }
    
    // Return a list of elements that are duplicate (already exist in the database)
    return elements.filter(elem => 
      existingNamesMap.has(elem[nameField].toLowerCase())
    );
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
      
      // Check for duplicates in the database
      const duplicateElements = await checkDuplicates(type, elementsToSave);
      
      // Filter out duplicate elements
      const newElements = elementsToSave.filter(elem => {
        const nameField = type === 'plotlines' || type === 'scenes' || type === 'events' ? 'title' : 'name';
        return !duplicateElements.some(dupElem => 
          dupElem[nameField].toLowerCase() === elem[nameField].toLowerCase()
        );
      });
      
      if (duplicateElements.length > 0) {
        console.log(`Found ${duplicateElements.length} existing ${type} that will be skipped:`, 
          duplicateElements.map(elem => elem.name || elem.title));
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
      
      console.log(`Saved ${data.length} ${type}:`, data);
      
      // If some duplicates were skipped, show a message
      if (duplicateElements.length > 0) {
        setError(`Note: ${duplicateElements.length} ${type} already existed and were skipped.`);
        setTimeout(() => setError(null), 5000); // Clear message after 5 seconds
      }
      
      // Move to the next step automatically
      moveToNextStep();
    } catch (err: any) {
      console.error(`Error saving ${type}:`, err);
      setError(`Error saving ${type}: ${err.message}`);
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
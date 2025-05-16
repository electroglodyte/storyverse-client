import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import './Importer.css';
import { v4 as uuidv4 } from 'uuid';

// Import the new extractors
import {
  extractCharacters,
  extractLocations,
  extractPlotlines,
  extractEvents,
  extractObjects,
  extractScenes
} from '../extractors';

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
  objects: any[]; // Added objects
}

interface DuplicateInfo {
  id: string;
  name: string;
  match_type: 'exact' | 'similar';
  similarity: number; // 0-100 percentage
}

// Default story and world UUIDs - use the existing records from the database
const DEFAULT_STORYWORLD_ID = 'bb4e4c55-0280-4ba1-985b-1590e3270d65'; // NoneVerse UUID
const DEFAULT_STORY_ID = '02334755-067a-44b2-bb58-9c8aa24ac667'; // NoneStory UUID

const Importer: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'characters' | 'locations' | 'plotlines' | 'scenes' | 'events' | 'objects' | 'complete'>('upload');
  const [extractedElements, setExtractedElements] = useState<ExtractedElements | null>(null);
  const [editedLoglines, setEditedLoglines] = useState<Record<string, string>>({});
  const [selectedElements, setSelectedElements] = useState<{
    characters: string[];
    locations: string[];
    plotlines: string[];
    scenes: string[];
    events: string[];
    objects: string[];
  }>({
    characters: [],
    locations: [],
    plotlines: [],
    scenes: [],
    events: [],
    objects: []
  });
  const [duplicateElements, setDuplicateElements] = useState<Record<string, DuplicateInfo[]>>({});
  const [debugInfo, setDebugInfo] = useState<string>(''); // Add debug info

  const navigate = useNavigate();

  // Update element with edited logline before saving
  useEffect(() => {
    if (extractedElements && Object.keys(editedLoglines).length > 0) {
      const updatedCharacters = extractedElements.characters.map(character => {
        if (editedLoglines[character.id]) {
          return {
            ...character,
            character_logline: editedLoglines[character.id]
          };
        }
        return character;
      });

      setExtractedElements(prev => prev ? {
        ...prev,
        characters: updatedCharacters
      } : null);
    }
  }, [editedLoglines]);

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

  const handleLoglineChange = (id: string, value: string) => {
    setEditedLoglines(prev => ({
      ...prev,
      [id]: value
    }));
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

      // Use our modular extractors to get all entity types
      const characterObjects = extractCharacters(fileContent, DEFAULT_STORY_ID);
      const locationObjects = extractLocations(fileContent, DEFAULT_STORY_ID, DEFAULT_STORYWORLD_ID);
      const plotlineObjects = extractPlotlines(fileContent, DEFAULT_STORY_ID);
      const eventObjects = extractEvents(fileContent, DEFAULT_STORY_ID);
      const objectObjects = extractObjects(fileContent, DEFAULT_STORY_ID, DEFAULT_STORYWORLD_ID);
      const sceneObjects = extractScenes(fileContent, DEFAULT_STORY_ID);

      // Add debug information about what was extracted
      setDebugInfo(`Found ${characterObjects.length} characters\n` +
                  `Found ${locationObjects.length} locations\n` +
                  `Found ${plotlineObjects.length} plotlines\n` +
                  `Found ${eventObjects.length} events\n` +
                  `Found ${objectObjects.length} objects\n` +
                  `Found ${sceneObjects.length} scenes`);

      // Call the analyze-story edge function with a unique request ID to avoid caching
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Create a data structure with all our extracted entities
      const processedData = {
        characters: characterObjects,
        locations: locationObjects,
        plotlines: plotlineObjects,
        scenes: sceneObjects,
        events: eventObjects,
        objects: objectObjects
      };

      // Before setting extracted elements, check for potential duplicates
      await checkForDuplicates('characters', characterObjects);
      
      // Store the extracted elements and move to the first review step
      setExtractedElements(processedData);
      
      // Initialize selected elements with all the IDs (by default all are selected)
      setSelectedElements({
        characters: processedData.characters?.map((c: any) => c.id) || [],
        locations: processedData.locations?.map((l: any) => l.id) || [],
        plotlines: processedData.plotlines?.map((p: any) => p.id) || [],
        scenes: processedData.scenes?.map((s: any) => s.id) || [],
        events: processedData.events?.map((e: any) => e.id) || [],
        objects: processedData.objects?.map((o: any) => o.id) || []
      });
      
      try {
        // Call API in parallel, but don't wait for it
        supabase.functions.invoke('analyze-story', {
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
        }).then(response => {
          if (response.error) {
            console.warn('API warning:', response.error.message);
            setDebugInfo(prev => `${prev}\nAPI warning: ${response.error.message}`);
          } else {
            console.log('API results:', response.data);
            const apiCharacters = response.data?.characters || [];
            if (apiCharacters.length > 0) {
              // Merge API characters with already extracted ones
              // Create a set of existing names to avoid duplicates
              const existingNames = new Set(processedData.characters.map((c: any) => c.name.toLowerCase()));
              
              // Process and filter API characters
              const newApiCharacters = apiCharacters
                .filter((c: any) => c.name && !existingNames.has(c.name.toLowerCase()))
                .map((c: any) => ({
                  ...c,
                  id: c.id || uuidv4(),
                  story_id: DEFAULT_STORY_ID,
                  confidence: c.confidence || 0.7
                }));
              
              // Add new characters to the extracted elements
              if (newApiCharacters.length > 0) {
                // Update the characters array with the combined results
                const updatedCharacters = [...processedData.characters, ...newApiCharacters];
                
                // Update the extracted elements state
                setExtractedElements(prev => ({
                  ...prev,
                  characters: updatedCharacters
                }));
                
                // Update the selected characters
                setSelectedElements(prev => ({
                  ...prev,
                  characters: [...prev.characters, ...newApiCharacters.map((c: any) => c.id)]
                }));
                
                console.log(`Added ${newApiCharacters.length} additional characters from API`);
                
                // Check these new characters for duplicates too
                await checkForDuplicates('characters', newApiCharacters);
              }
            }
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

      // Move to the first review step
      setCurrentStep('characters');
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(`Error analyzing file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced duplicate detection
  const checkForDuplicates = async (type: 'characters' | 'locations' | 'plotlines' | 'scenes' | 'events' | 'objects', elements: any[]) => {
    if (elements.length === 0) return;
    
    try {
      const tableName = type === 'objects' ? 'items' : type;
      const nameField = type === 'plotlines' || type === 'scenes' || type === 'events' ? 'title' : 'name';
      
      const duplicatesInfo: Record<string, DuplicateInfo[]> = {};
      
      // For each extracted element, check for similar entries in the database
      for (const element of elements) {
        if (!element[nameField]) continue;
        
        const elementName = element[nameField];
        
        // First check for exact matches
        const { data: exactMatches, error: exactError } = await supabase
          .from(tableName)
          .select('id, ' + nameField)
          .eq(nameField, elementName);
          
        if (exactError) {
          console.error(`Error checking for exact duplicates:`, exactError);
          continue;
        }
        
        // Then check for similar matches (case insensitive)
        const { data: similarMatches, error: similarError } = await supabase
          .from(tableName)
          .select('id, ' + nameField)
          .neq('id', element.id) // Skip self
          .ilike(nameField, `%${elementName}%`);
          
        if (similarError) {
          console.error(`Error checking for similar duplicates:`, similarError);
          continue;
        }
        
        // Combine and process matches
        const allMatches: DuplicateInfo[] = [];
        
        // Process exact matches
        if (exactMatches && exactMatches.length > 0) {
          exactMatches.forEach(match => {
            allMatches.push({
              id: match.id,
              name: match[nameField],
              match_type: 'exact',
              similarity: 100
            });
          });
        }
        
        // Process similar matches
        if (similarMatches && similarMatches.length > 0) {
          similarMatches.forEach(match => {
            // Skip if already added as exact match
            if (!allMatches.some(m => m.id === match.id)) {
              // Calculate similarity (simple version)
              const nameLower = elementName.toLowerCase();
              const matchNameLower = match[nameField].toLowerCase();
              const similarity = matchNameLower.includes(nameLower) || nameLower.includes(matchNameLower) ? 70 : 50;
              
              allMatches.push({
                id: match.id,
                name: match[nameField],
                match_type: 'similar',
                similarity
              });
            }
          });
        }
        
        // If matches found, store them
        if (allMatches.length > 0) {
          duplicatesInfo[element.id] = allMatches;
        }
      }
      
      // Update state with duplicate info
      if (Object.keys(duplicatesInfo).length > 0) {
        setDuplicateElements(prev => ({
          ...prev,
          ...duplicatesInfo
        }));
        
        console.log(`Found ${Object.keys(duplicatesInfo).length} elements with potential duplicates`);
      }
    } catch (err) {
      console.error(`Error in checkForDuplicates:`, err);
    }
  };

  // Toggle selection of an element
  const toggleElementSelection = (type: 'characters' | 'locations' | 'plotlines' | 'scenes' | 'events' | 'objects', id: string) => {
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

  // Handle checkbox click without toggling the card
  const handleCheckboxClick = (e: React.MouseEvent, type: 'characters' | 'locations' | 'plotlines' | 'scenes' | 'events' | 'objects', id: string) => {
    e.stopPropagation(); // Prevent card click
    toggleElementSelection(type, id);
  };

  // Select/deselect all elements of a given type
  const toggleAllSelection = (type: 'characters' | 'locations' | 'plotlines' | 'scenes' | 'events' | 'objects', select: boolean) => {
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
  const getExistingNameMap = async (type: 'characters' | 'locations' | 'plotlines' | 'scenes' | 'events' | 'objects', elements: any[]) => {
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
      // Convert 'objects' to 'items' for the table name if necessary
      const tableName = type === 'objects' ? 'items' : type;
      
      // Query the database for any matching names
      const { data, error } = await supabase
        .from(tableName)
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

  // Handle discarding a duplicate element
  const handleDiscardDuplicate = (id: string) => {
    if (!extractedElements) return;
    
    // Remove from selected elements
    setSelectedElements(prev => ({
      ...prev,
      characters: prev.characters.filter(elemId => elemId !== id)
    }));
    
    // Remove from extracted elements
    setExtractedElements(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        characters: prev.characters.filter(char => char.id !== id)
      };
    });
    
    // Remove from duplicates list
    setDuplicateElements(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  // Save the selected elements to the database
  const saveElementsToDatabase = async (type: 'characters' | 'locations' | 'plotlines' | 'scenes' | 'events' | 'objects') => {
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
      
      // Convert 'objects' to 'items' for the table name if necessary
      const tableName = type === 'objects' ? 'items' : type;
      
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
      
      // Insert elements into the appropriate table
      const { data, error } = await supabase
        .from(tableName)
        .insert(newElements)
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
        setCurrentStep('objects'); // Added objects step
        break;
      case 'objects':
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
          events: [],
          objects: []
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
            <p>Upload a file to extract characters, locations, plotlines, scenes, events, and objects.</p>
            
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
      
      case 'objects':
        return renderElementsReview('objects', 'Objects');
      
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
  const renderElementsReview = (type: 'characters' | 'locations' | 'plotlines' | 'scenes' | 'events' | 'objects', title: string) => {
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
        case 'objects': return 'item_type';
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
              const hasDuplicates = duplicateElements[element.id] && duplicateElements[element.id].length > 0;
              
              return (
                <div 
                  key={element.id} 
                  className={`element-card ${isSelected ? 'selected' : ''} ${hasDuplicates ? 'has-duplicates' : ''}`}
                >
                  <div 
                    className="element-checkbox"
                    onClick={(e) => handleCheckboxClick(e, type, element.id)}
                  >
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => {}} // Managed by the handleCheckboxClick
                    />
                  </div>
                  <div className="element-details">
                    <h3>{element[nameProperty]}</h3>
                    {typeProperty && element[typeProperty] && (
                      <span className="element-type">{element[typeProperty]}</span>
                    )}
                    
                    {/* Display duplicate warnings if any */}
                    {hasDuplicates && (
                      <div className="duplicate-warning" style={{
                        backgroundColor: '#fff3cd',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        fontSize: '0.85em'
                      }}>
                        <strong>Potential duplicate found: </strong>
                        {duplicateElements[element.id].map((dup, idx) => (
                          <span key={idx}>
                            {dup.name} 
                            ({dup.match_type === 'exact' ? 'exact match' : `${dup.similarity}% similar`})
                            <button 
                              style={{
                                marginLeft: '8px',
                                padding: '2px 6px',
                                border: 'none',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85em'
                              }}
                              onClick={() => handleDiscardDuplicate(element.id)}
                            >
                              Discard
                            </button>
                            {idx < duplicateElements[element.id].length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Editable logline for characters */}
                    {type === 'characters' && (
                      <textarea
                        className="element-logline-editor"
                        value={editedLoglines[element.id] || element.character_logline || ''}
                        onChange={(e) => handleLoglineChange(element.id, e.target.value)}
                        placeholder="Enter character logline..."
                        style={{ 
                          width: '100%',
                          minHeight: '60px',
                          padding: '8px',
                          margin: '8px 0',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontStyle: 'italic',
                          fontSize: '0.9em',
                          color: '#555'
                        }}
                      />
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
// StoryImporter.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Checkbox, Grid, Typography, Box, CircularProgress } from '@mui/material';
import { supabase } from '../supabaseClient';
import { Character, Location, Plotline } from '../supabase-tables';
import { extractCharacters, extractLocations, extractPlotlines, extractEvents, extractObjects } from '../extractors';

// Extended interfaces for API response data that includes confidence scores
interface CharacterWithConfidence extends Character {
  confidence?: number;
  isNew?: boolean; // Added flag to identify new characters
}

interface LocationWithConfidence extends Location {
  confidence?: number;
}

interface StoryImporterProps {
  storyWorldId?: string;
  onImportComplete?: (storyId: string) => void;
  storyText: string;
  storyTitle: string;
}

export const StoryImporter: React.FC<StoryImporterProps> = ({
  storyWorldId,
  onImportComplete,
  storyText,
  storyTitle
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'analyzing' | 'characters' | 'locations' | 'plotlines' | 'complete'>('analyzing');
  const [characters, setCharacters] = useState<CharacterWithConfidence[]>([]);
  const [locations, setLocations] = useState<LocationWithConfidence[]>([]);
  const [plotlines, setPlotlines] = useState<Plotline[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<Record<string, boolean>>({});
  const [selectedLocations, setSelectedLocations] = useState<Record<string, boolean>>({});
  const [selectedPlotlines, setSelectedPlotlines] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Generate a UUID for new entities
  const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // On component mount, start the analysis process
  useEffect(() => {
    if (storyText && storyTitle) {
      analyzeStory();
    }
  }, [storyText, storyTitle]);

  // Select all items by default when they load
  useEffect(() => {
    if (characters.length > 0) {
      const newSelected = characters.reduce((acc, char) => {
        // Only auto-select new characters
        acc[char.id] = char.isNew !== false;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedCharacters(newSelected);
    }
  }, [characters]);

  useEffect(() => {
    if (locations.length > 0) {
      const newSelected = locations.reduce((acc, loc) => {
        acc[loc.id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedLocations(newSelected);
    }
  }, [locations]);

  useEffect(() => {
    if (plotlines.length > 0) {
      const newSelected = plotlines.reduce((acc, plot) => {
        acc[plot.id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedPlotlines(newSelected);
    }
  }, [plotlines]);

  const analyzeStory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate a temporary story ID
      const tempStoryId = generateUUID();
      setStoryId(tempStoryId);
      
      // Use the modular extractors for better detection
      // Note: extractCharacters is now asynchronous
      const charactersList = await extractCharacters(storyText, tempStoryId, storyWorldId);
      
      // Log extracted characters for debugging
      console.log('Characters found:', charactersList);
      setDebugInfo(`Found ${charactersList.length} characters total`);
      
      // Filter out duplicate characters if there's nothing new to show
      const newCharacters = charactersList.filter(char => char.isNew);
      if (newCharacters.length === 0) {
        setDebugInfo(prev => `${prev}\nNo new characters detected`);
      } else {
        setDebugInfo(prev => `${prev}\nFound ${newCharacters.length} new characters`);
      }
      
      // Save results
      setAnalysisResults({
        story: { id: tempStoryId },
        results: {
          characters: charactersList,
          locations: [],  // locationsList
          plotlines: []   // plotlinesList
        }
      });
      
      setCharacters(charactersList);
      setStep('characters');
      
      // After getting local results, try the API in parallel
      try {
        const apiUrl = '/api/import-story-with-progress';
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            story_text: storyText,
            story_title: storyTitle,
            options: {
              story_world_id: storyWorldId,
              extract_characters: true,
              extract_locations: true,
              extract_plotlines: true,
              extract_scenes: true,
              confidence_threshold: 0.05
            }
          }),
        })
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error(`API error: ${response.statusText}`);
        })
        .then(data => {
          console.log('API analysis results:', data);
          setDebugInfo(prev => `${prev}\nAPI returned: ${data.results?.characters?.length || 0} characters`);
          
          // We could merge API results here if needed
          // For now, we'll stick with our direct extraction results
        })
        .catch(err => {
          console.warn('API analysis failed, using direct extraction only:', err);
        });
      } catch (apiErr) {
        console.warn('Failed to call API, using direct extraction only:', apiErr);
      }
      
    } catch (err) {
      console.error('Error in story analysis:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (step === 'characters') {
      // Move to locations step
      if (analysisResults?.results?.locations && analysisResults.results.locations.length > 0) {
        setLocations(analysisResults.results.locations);
        setStep('locations');
      } else {
        // Skip to plotlines if no locations
        if (analysisResults?.results?.plotlines && analysisResults.results.plotlines.length > 0) {
          setPlotlines(analysisResults.results.plotlines);
          setStep('plotlines');
        } else {
          // No more steps, complete the import
          completeImport();
        }
      }
    } else if (step === 'locations') {
      // Move to plotlines step
      if (analysisResults?.results?.plotlines && analysisResults.results.plotlines.length > 0) {
        setPlotlines(analysisResults.results.plotlines);
        setStep('plotlines');
      } else {
        // No more steps, complete the import
        completeImport();
      }
    } else if (step === 'plotlines') {
      // Complete the import
      completeImport();
    }
  };

  const handleSkip = () => {
    if (storyId && onImportComplete) {
      onImportComplete(storyId);
    } else {
      navigate('/stories');
    }
  };

  const completeImport = async () => {
    setLoading(true);
    
    try {
      // First, create the story entry if we don't have a real one from API
      let finalStoryId = storyId;
      
      if (!finalStoryId || finalStoryId === 'temp') {
        // Create a story in the database
        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .insert({
            title: storyTitle,
            name: storyTitle,
            description: `Imported story: ${storyTitle}`,
            story_world_id: storyWorldId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (storyError) throw storyError;
        finalStoryId = storyData.id;
      }
      
      // Save selected characters to database
      const selectedCharsArray = characters.filter(char => selectedCharacters[char.id] && char.isNew !== false);
      
      for (const char of selectedCharsArray) {
        const { error: charError } = await supabase
          .from('characters')
          .insert({
            name: char.name,
            description: char.description,
            role: char.role,
            story_id: finalStoryId,
            story_world_id: storyWorldId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        if (charError) console.error(`Error saving character ${char.name}:`, charError);
      }
      
      // Note: In a real implementation, you would also save locations and plotlines
      
      // Complete import and navigate to story detail
      setStep('complete');
      
      if (onImportComplete) {
        onImportComplete(finalStoryId);
      } else {
        navigate(`/stories/${finalStoryId}`);
      }
    } catch (err) {
      console.error('Error completing import:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterToggle = (characterId: string) => {
    setSelectedCharacters(prev => ({
      ...prev,
      [characterId]: !prev[characterId]
    }));
  };

  const handleLocationToggle = (locationId: string) => {
    setSelectedLocations(prev => ({
      ...prev,
      [locationId]: !prev[locationId]
    }));
  };

  const handlePlotlineToggle = (plotlineId: string) => {
    setSelectedPlotlines(prev => ({
      ...prev,
      [plotlineId]: !prev[plotlineId]
    }));
  };

  const selectAll = (type: 'characters' | 'locations' | 'plotlines') => {
    if (type === 'characters') {
      const newSelected = characters.reduce((acc, char) => {
        // Only allow selecting new characters
        acc[char.id] = char.isNew !== false;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedCharacters(newSelected);
    } else if (type === 'locations') {
      const newSelected = locations.reduce((acc, loc) => {
        acc[loc.id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedLocations(newSelected);
    } else if (type === 'plotlines') {
      const newSelected = plotlines.reduce((acc, plot) => {
        acc[plot.id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedPlotlines(newSelected);
    }
  };

  const deselectAll = (type: 'characters' | 'locations' | 'plotlines') => {
    if (type === 'characters') {
      setSelectedCharacters({});
    } else if (type === 'locations') {
      setSelectedLocations({});
    } else if (type === 'plotlines') {
      setSelectedPlotlines({});
    }
  };

  // Count selected items
  const countSelected = (items: any[], selectedMap: Record<string, boolean>) => {
    return items.filter(item => selectedMap[item.id]).length;
  };

  // Count new characters
  const countNewCharacters = () => {
    return characters.filter(char => char.isNew).length;
  };

  // Render content based on current step
  const renderContent = () => {
    if (loading && step === 'analyzing') {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" p={4}>
          <CircularProgress />
          <Typography variant="h6" mt={2}>
            Analyzing story...
          </Typography>
          <Typography variant="body2" color="textSecondary" mt={1}>
            This may take a moment as we detect characters, locations, and plotlines.
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box p={3} bgcolor="error.light" borderRadius={1} mb={3}>
          <Typography color="error" variant="body1">
            {error}
          </Typography>
          <Button variant="contained" onClick={analyzeStory} sx={{ mt: 2 }}>
            Try Again
          </Button>
        </Box>
      );
    }

    if (step === 'characters') {
      // Filter to show only new characters if there are any
      const newCharacters = characters.filter(char => char.isNew);
      
      // If no new characters are found, show a message
      if (newCharacters.length === 0) {
        return (
          <Box p={4} textAlign="center">
            <Typography variant="h6" gutterBottom>
              No New Characters Detected
            </Typography>
            <Typography variant="body1" paragraph>
              All characters in this story already exist in your database.
            </Typography>
            <Button variant="contained" onClick={handleNextStep}>
              Continue to Next Step
            </Button>
          </Box>
        );
      }
      
      // Otherwise, show the new characters
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            Characters ({newCharacters.length} new found)
          </Typography>
          <Typography variant="body2" paragraph>
            Review and select the characters to import.
          </Typography>
          
          {/* Debug info - temporarily show this */}
          {debugInfo && (
            <Box p={2} bgcolor="info.light" borderRadius={1} mb={2}>
              <Typography variant="caption" component="pre">
                {debugInfo}
              </Typography>
            </Box>
          )}
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body2">
              {countSelected(newCharacters, selectedCharacters)} of {newCharacters.length} selected
            </Typography>
            <Box>
              <Button size="small" onClick={() => selectAll('characters')} sx={{ mr: 1 }}>
                Select All
              </Button>
              <Button size="small" onClick={() => deselectAll('characters')}>
                Deselect All
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            {newCharacters.map(character => (
              <Grid item xs={12} sm={6} key={character.id}>
                <Card variant="outlined" sx={{ 
                  p: 2, 
                  bgcolor: selectedCharacters[character.id] ? 'rgba(33, 150, 243, 0.08)' : 'transparent',
                  border: selectedCharacters[character.id] ? '1px solid #2196f3' : '1px solid rgba(0, 0, 0, 0.12)'
                }}>
                  <Box display="flex" alignItems="flex-start">
                    <Checkbox 
                      checked={!!selectedCharacters[character.id]} 
                      onChange={() => handleCharacterToggle(character.id)}
                    />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">{character.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Role: {character.role}
                      </Typography>
                      <Typography variant="body2">
                        {character.description}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button variant="outlined" onClick={handleSkip} sx={{ mr: 2 }}>
              Skip
            </Button>
            <Button variant="contained" onClick={handleNextStep}>
              {analysisResults?.results?.locations?.length > 0 ? 'Next: Locations' : 
               analysisResults?.results?.plotlines?.length > 0 ? 'Next: Plotlines' : 
               'Complete Import'}
            </Button>
          </Box>
        </Box>
      );
    }

    // Other steps would be implemented here
    return null;
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Import Story: {storyTitle}
      </Typography>
      {renderContent()}
    </Box>
  );
};

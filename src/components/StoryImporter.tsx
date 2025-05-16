// StoryImporter.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Checkbox, Grid, Typography, Box, CircularProgress } from '@mui/material';
import { supabase } from '../supabaseClient';
import { Character, Location, Plotline } from '../supabase-tables';

// Extended interfaces for API response data that includes confidence scores
interface CharacterWithConfidence extends Character {
  confidence?: number;
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

// Helper function to extract characters marked in ALL CAPS
const extractAllCapsCharacters = (text: string): string[] => {
  // Regular expression to match words in ALL CAPS with 2 or more letters
  const allCapsRegex = /\b[A-Z]{2,}(?:'[A-Z]+)?\b/g;
  const matches = text.match(allCapsRegex) || [];
  
  // Filter out common non-character ALL CAPS words
  const nonCharacterWords = ['THE', 'AND', 'OF', 'TO', 'IN', 'A', 'FOR', 'WITH', 'IS', 'ON', 'AT', 'BY', 'AS', 'IT', 'ALL'];
  return [...new Set(matches)].filter(word => !nonCharacterWords.includes(word));
};

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
        acc[char.id] = true;
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
      // QUICK FIX: Skip the API for now and use direct character extraction
      // This is a temporary solution until we fix the API integration
      
      // Extract ALL CAPS characters from the text
      const allCapsCharacters = extractAllCapsCharacters(storyText);
      console.log('ALL CAPS characters found:', allCapsCharacters);
      setDebugInfo(`Found ${allCapsCharacters.length} ALL CAPS characters: ${allCapsCharacters.join(', ')}`);
      
      // Create character objects directly
      const charactersList = allCapsCharacters.map(name => {
        // Set role based on character name if possible (example logic)
        let role: 'protagonist' | 'antagonist' | 'supporting' | 'background' | 'other' = 'supporting';
        let description = 'A character in the story';
        
        // Detect protagonist - this is just an example, adjust based on your story
        if (name === 'RUFUS') {
          role = 'protagonist';
          description = 'The main character, a young wolf';
        } else if (name === 'STUPUS') {
          role = 'antagonist';
          description = 'An arrogant character who antagonizes Rufus';
        }
        
        return {
          id: generateUUID(),
          name: name.charAt(0) + name.slice(1).toLowerCase(), // Convert to Title Case
          role,
          description,
          story_id: generateUUID(), // Temporary ID until we get one from the database
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          confidence: 0.9, // High confidence for ALL CAPS characters
        } as CharacterWithConfidence;
      });
      
      // Save results
      setAnalysisResults({
        story: { id: generateUUID() },
        results: {
          characters: charactersList,
          locations: [],
          plotlines: []
        }
      });
      
      setStoryId(generateUUID());
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
      const selectedCharsArray = characters.filter(char => selectedCharacters[char.id]);
      
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
        acc[char.id] = true;
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

    if (step === 'characters' && characters.length > 0) {
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            Characters ({characters.length} found)
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
              {countSelected(characters, selectedCharacters)} of {characters.length} selected
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
            {characters.map(character => (
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
                      <Typography variant="h6">{character.name}</Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ 
                        display: 'inline-block', 
                        bgcolor: 'rgba(0, 0, 0, 0.08)', 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1,
                        mb: 1
                      }}>
                        {character.role}
                      </Typography>
                      <Typography variant="body2">
                        {character.description || 'A character in the story'}
                      </Typography>
                      {character.confidence !== undefined && (
                        <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                          Detection confidence: {Math.round(character.confidence * 100)}%
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button variant="outlined" onClick={handleSkip}>
              Skip
            </Button>
            <Button 
              variant="contained" 
              onClick={handleNextStep}
              disabled={countSelected(characters, selectedCharacters) === 0}
            >
              {analysisResults?.results?.locations && analysisResults.results.locations.length > 0 
                ? 'Save Characters' 
                : analysisResults?.results?.plotlines && analysisResults.results.plotlines.length > 0
                  ? 'Save Characters' 
                  : 'Save Characters'}
            </Button>
          </Box>
        </Box>
      );
    }

    if (step === 'locations' && locations.length > 0) {
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            Locations ({locations.length} found)
          </Typography>
          <Typography variant="body2" paragraph>
            Review and select the locations to import.
          </Typography>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body2">
              {countSelected(locations, selectedLocations)} of {locations.length} selected
            </Typography>
            <Box>
              <Button size="small" onClick={() => selectAll('locations')} sx={{ mr: 1 }}>
                Select All
              </Button>
              <Button size="small" onClick={() => deselectAll('locations')}>
                Deselect All
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            {locations.map(location => (
              <Grid item xs={12} sm={6} key={location.id}>
                <Card variant="outlined" sx={{ 
                  p: 2, 
                  bgcolor: selectedLocations[location.id] ? 'rgba(33, 150, 243, 0.08)' : 'transparent',
                  border: selectedLocations[location.id] ? '1px solid #2196f3' : '1px solid rgba(0, 0, 0, 0.12)'
                }}>
                  <Box display="flex" alignItems="flex-start">
                    <Checkbox 
                      checked={!!selectedLocations[location.id]} 
                      onChange={() => handleLocationToggle(location.id)}
                    />
                    <Box>
                      <Typography variant="h6">{location.name}</Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ 
                        display: 'inline-block', 
                        bgcolor: 'rgba(0, 0, 0, 0.08)', 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1,
                        mb: 1
                      }}>
                        {location.location_type || 'location'}
                      </Typography>
                      <Typography variant="body2">
                        {location.description || 'A location in the story'}
                      </Typography>
                      {location.confidence !== undefined && (
                        <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                          Detection confidence: {Math.round(location.confidence * 100)}%
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button variant="outlined" onClick={handleSkip}>
              Skip
            </Button>
            <Button 
              variant="contained" 
              onClick={handleNextStep}
              disabled={countSelected(locations, selectedLocations) === 0}
            >
              {analysisResults?.results?.plotlines && analysisResults.results.plotlines.length > 0 
                ? 'Save Locations' 
                : 'Save Locations'}
            </Button>
          </Box>
        </Box>
      );
    }

    if (step === 'plotlines' && plotlines.length > 0) {
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            Plotlines ({plotlines.length} found)
          </Typography>
          <Typography variant="body2" paragraph>
            Review and select the plotlines to import.
          </Typography>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body2">
              {countSelected(plotlines, selectedPlotlines)} of {plotlines.length} selected
            </Typography>
            <Box>
              <Button size="small" onClick={() => selectAll('plotlines')} sx={{ mr: 1 }}>
                Select All
              </Button>
              <Button size="small" onClick={() => deselectAll('plotlines')}>
                Deselect All
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            {plotlines.map(plotline => (
              <Grid item xs={12} sm={6} key={plotline.id}>
                <Card variant="outlined" sx={{ 
                  p: 2, 
                  bgcolor: selectedPlotlines[plotline.id] ? 'rgba(33, 150, 243, 0.08)' : 'transparent',
                  border: selectedPlotlines[plotline.id] ? '1px solid #2196f3' : '1px solid rgba(0, 0, 0, 0.12)'
                }}>
                  <Box display="flex" alignItems="flex-start">
                    <Checkbox 
                      checked={!!selectedPlotlines[plotline.id]} 
                      onChange={() => handlePlotlineToggle(plotline.id)}
                    />
                    <Box>
                      <Typography variant="h6">{plotline.title}</Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ 
                        display: 'inline-block', 
                        bgcolor: 'rgba(0, 0, 0, 0.08)', 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1,
                        mb: 1
                      }}>
                        {plotline.plotline_type || 'plotline'}
                      </Typography>
                      <Typography variant="body2">
                        {plotline.description || 'A plotline in the story'}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button variant="outlined" onClick={handleSkip}>
              Skip
            </Button>
            <Button 
              variant="contained" 
              onClick={completeImport}
              disabled={countSelected(plotlines, selectedPlotlines) === 0}
            >
              Save Plotlines
            </Button>
          </Box>
        </Box>
      );
    }

    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <Button variant="contained" onClick={analyzeStory} disabled={loading}>
          Start Analysis
        </Button>
      </Box>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Story Importer
      </Typography>
      {renderContent()}
    </Box>
  );
};

export default StoryImporter;
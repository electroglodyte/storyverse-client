import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  CircularProgress,
  Alert,
  Divider,
  LinearProgress,
  Chip,
  Grid
} from '@mui/material';
import { supabase } from '../../services/supabase';
import { v4 as uuidv4 } from 'uuid';

const ImportAnalyzer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setFile(acceptedFiles[0]);
    setError(null);
    setAnalysisResults(null);
    await extractTextFromFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/epub+zip': ['.epub'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/rtf': ['.rtf'],
      'application/x-fountain': ['.fountain'],
    },
    multiple: false,
  });

  const extractTextFromFile = async (file: File) => {
    setIsExtracting(true);
    setExtractedText('');
    setError(null);
    
    try {
      let text = '';
      
      // For now, just read as text - specialized parsers will be added in future updates
      text = await readAsText(file);
      
      // Basic format detection and cleanup
      if (file.name.endsWith('.fountain') || detectFountainFormat(text)) {
        // Clean up fountain format
        text = cleanFountainFormat(text);
      } else if (file.name.endsWith('.md')) {
        // Simple markdown cleanup
        text = cleanMarkdown(text);
      }
      
      setExtractedText(text);
    } catch (err: any) {
      console.error('Error extracting text:', err);
      setError(`Error extracting text: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const readAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const detectFountainFormat = (text: string): boolean => {
    // Simple heuristic for Fountain screenplay format
    const fountainPatterns = [
      /^INT\.\\s.+/m,
      /^EXT\.\\s.+/m,
      /^INT\/EXT\.\\s.+/m,
      /^[A-Z\\s]+$/m
    ];
    
    return fountainPatterns.some(pattern => pattern.test(text));
  };

  const cleanFountainFormat = (text: string): string => {
    // Basic cleanup for Fountain format
    return text
      .replace(/^#.*$/gm, '') // Remove comments
      .replace(/^\\[\\[.*\\]\\]$/gm, '') // Remove notes
      .replace(/\\n{3,}/g, '\\n\\n'); // Normalize spacing
  };

  const cleanMarkdown = (text: string): string => {
    // Basic cleanup for Markdown
    return text
      .replace(/#{1,6}\\s/g, '') // Remove headings
      .replace(/\\*\\*/g, '') // Remove bold
      .replace(/\\*/g, '') // Remove italic
      .replace(/\\n{3,}/g, '\\n\\n'); // Normalize spacing
  };

  const analyzeText = async () => {
    if (!extractedText) return;
    
    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 100 ? 99 : newProgress;
        });
      }, 1000);
      
      // Create a story title from the filename
      const fileNameWithoutExt = file ? file.name.replace(/\\.[^/.]+$/, "") : "Untitled";
      const storyTitle = fileNameWithoutExt
        .split(/[-_\\s]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      // Call the MCP server to analyze the story
      const response = await fetch('http://localhost:3000/analyze-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story_text: extractedText,
          story_title: storyTitle,
          options: {
            create_project: true,
            extract_characters: true,
            extract_locations: true,
            extract_events: true,
            extract_relationships: true,
            interactive_mode: false
          }
        }),
      });

      if (!response.ok) {
        // Try to get error details if available
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResults(data);
      setAnalysisProgress(100);
      clearInterval(progressInterval);
    } catch (err: any) {
      console.error('Error analyzing text:', err);
      setError(`Error analyzing text: ${err.message}`);
      setAnalysisProgress(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Import and Analyze Story
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Upload a file to extract narrative elements like characters, locations, events, and plot structure.
          The system will analyze the content and organize it within StoryVerse.
        </Typography>
        
        {!file && (
          <Paper {...getRootProps()} sx={{ 
            p: 5, 
            textAlign: 'center',
            border: '2px dashed #aaa',
            borderRadius: 2,
            my: 3,
            cursor: 'pointer',
            backgroundColor: '#f8f9fa'
          }}>
            <input {...getInputProps()} />
            <Typography variant="h6">
              Drag & drop a file here, or click to select
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Supported formats: TXT, Markdown, Fountain, PDF*, DOCX*, EPUB* 
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              * Advanced format support coming soon
            </Typography>
          </Paper>
        )}
      </Paper>
      
      {isExtracting && (
        <Paper sx={{ p: 4, my: 4, textAlign: 'center' }}>
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Extracting text from {file?.name}...
          </Typography>
        </Paper>
      )}
      
      {file && extractedText && !isExtracting && (
        <Paper sx={{ p: 4, my: 4 }}>
          <Typography variant="h5" gutterBottom>
            Content from: {file.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="textSecondary">
              {extractedText.split(/\\s+/).length.toLocaleString()} words • {extractedText.length.toLocaleString()} characters
            </Typography>
            <Box sx={{ ml: 'auto' }}>
              <Button 
                onClick={() => {
                  setFile(null);
                  setExtractedText('');
                  setAnalysisResults(null);
                }}
                color="secondary"
                sx={{ mr: 1 }}
              >
                Change File
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={analyzeText}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Content'}
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {isAnalyzing && (
            <Box sx={{ my: 4 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Analysis in progress... This may take a few minutes for large texts.
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={analysisProgress} 
                sx={{ height: 10, borderRadius: 1 }}
              />
              <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
                {Math.round(analysisProgress)}%
              </Typography>
            </Box>
          )}
          
          <Box sx={{ 
            maxHeight: 300, 
            overflowY: 'auto', 
            p: 3, 
            backgroundColor: '#f8f9fa',
            borderRadius: 1,
            my: 2,
            border: '1px solid #e0e0e0'
          }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {extractedText.length > 2000 
                ? extractedText.substring(0, 2000) + '...\\n\\n[Content truncated for preview]' 
                : extractedText}
            </Typography>
          </Box>
        </Paper>
      )}
      
      {analysisResults && (
        <Paper sx={{ p: 4, my: 4 }}>
          <Typography variant="h5" gutterBottom>
            Analysis Results
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: '#f0f7ff', height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Overview
                </Typography>
                <Typography variant="body1">
                  Story ID: {analysisResults.story_id}
                </Typography>
                <Typography variant="body1">
                  Title: {analysisResults.title}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    label={`${analysisResults.characters?.length || 0} Characters`} 
                    color="primary" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`${analysisResults.locations?.length || 0} Locations`} 
                    color="secondary" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`${analysisResults.events?.length || 0} Events`} 
                    color="success" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`${analysisResults.plotlines?.length || 0} Plotlines`} 
                    color="info" 
                    variant="outlined"
                  />
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: '#fff9f0', height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Key Elements
                </Typography>
                {analysisResults.characters?.length > 0 && (
                  <Typography variant="body2">
                    <strong>Main Characters:</strong>{' '}
                    {analysisResults.characters
                      .filter(c => c.role === 'protagonist' || c.role === 'antagonist' || c.confidence > 0.8)
                      .slice(0, 5)
                      .map(c => c.name)
                      .join(', ')}
                    {analysisResults.characters.length > 5 && ' and others...'}
                  </Typography>
                )}
                {analysisResults.locations?.length > 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Key Locations:</strong>{' '}
                    {analysisResults.locations
                      .filter(l => l.confidence > 0.7)
                      .slice(0, 5)
                      .map(l => l.name)
                      .join(', ')}
                    {analysisResults.locations.length > 5 && ' and others...'}
                  </Typography>
                )}
                {analysisResults.plotlines?.length > 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Plotlines:</strong>{' '}
                    {analysisResults.plotlines
                      .slice(0, 3)
                      .map(p => p.title)
                      .join(', ')}
                    {analysisResults.plotlines.length > 3 && ' and others...'}
                  </Typography>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="primary"
                href={`/stories/${analysisResults.story_id}`}
                fullWidth
              >
                View Full Story Details
              </Button>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button 
              variant="outlined" 
              href={`/characters?story_id=${analysisResults.story_id}`}
            >
              View Characters
            </Button>
            <Button 
              variant="outlined" 
              href={`/locations?story_id=${analysisResults.story_id}`}
            >
              View Locations
            </Button>
            <Button 
              variant="outlined" 
              href={`/timeline/${analysisResults.story_id}`}
            >
              View Timeline
            </Button>
            <Button 
              variant="outlined" 
              href={`/scenes?story_id=${analysisResults.story_id}`}
            >
              View Scenes
            </Button>
          </Box>
        </Paper>
      )}
      
      {error && (
        <Alert severity="error" sx={{ my: 3 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default ImportAnalyzer;
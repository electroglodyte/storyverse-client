import React, { useState } from 'react';
import { StyleSample } from '@/types/style';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StyleAnalysisVisualization } from './StyleAnalysisVisualization';
import { FileText, Upload } from 'lucide-react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { toast } from 'react-hot-toast';

interface StyleSampleManagerProps {
  profileId: string;
  samples: StyleSample[];
  onSamplesUpdated: () => void;
}

export const StyleSampleManager: React.FC<StyleSampleManagerProps> = ({
  profileId,
  samples,
  onSamplesUpdated,
}) => {
  const [uploadText, setUploadText] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const { supabase } = useSupabase();

  const handleAnalyzeText = async () => {
    try {
      setUploading(true);

      // Call the analyze_writing_sample MCP tool
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('analyze-writing-sample', {
        body: {
          text: uploadText,
          description: uploadDescription,
          profileId: profileId,
        },
      });

      if (analysisError) throw analysisError;

      // Create new sample with analysis results
      const { error: insertError } = await supabase
        .from('style_samples')
        .insert([{
          profile_id: profileId,
          text_content: uploadText,
          description: uploadDescription,
          metrics: analysisResult.metrics,
        }]);

      if (insertError) throw insertError;

      toast.success('Sample analyzed and added successfully');
      setUploadText('');
      setUploadDescription('');
      onSamplesUpdated();
    } catch (error) {
      toast.error('Failed to analyze and add sample');
      console.error('Error analyzing sample:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveSample = async (sampleId: string) => {
    try {
      const { error } = await supabase
        .from('style_samples')
        .delete()
        .eq('id', sampleId);

      if (error) throw error;

      toast.success('Sample removed successfully');
      onSamplesUpdated();
    } catch (error) {
      toast.error('Failed to remove sample');
      console.error('Error removing sample:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Sample</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="sampleText">Sample Text</Label>
            <Textarea
              id="sampleText"
              value={uploadText}
              onChange={(e) => setUploadText(e.target.value)}
              placeholder="Paste your text sample here..."
              className="min-h-[200px]"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="Brief description of this sample..."
            />
          </div>
          <Button
            onClick={handleAnalyzeText}
            disabled={uploading || !uploadText.trim()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Analyzing...' : 'Analyze & Add Sample'}
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Existing Samples</h3>
        {samples.map((sample) => (
          <Card key={sample.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <h4 className="font-medium">
                    {sample.description || 'Untitled Sample'}
                  </h4>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Added {new Date(sample.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveSample(sample.id)}
              >
                Remove
              </Button>
            </div>
            
            <div className="mt-4">
              <StyleAnalysisVisualization
                metrics={sample.metrics}
                height={300}
              />
            </div>

            <div className="mt-4 bg-gray-50 p-4 rounded-md">
              <pre className="whitespace-pre-wrap text-sm">
                {sample.text_content.slice(0, 200)}
                {sample.text_content.length > 200 ? '...' : ''}
              </pre>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
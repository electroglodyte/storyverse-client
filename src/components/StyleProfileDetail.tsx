import React, { useEffect, useState } from 'react';
import { StyleProfile, StyleGuidance, StyleMetric } from '@/types/style';
import { useSupabase } from '@/contexts/SupabaseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { StyleAnalysisVisualization } from './StyleAnalysisVisualization';
import { StyleSampleManager } from './StyleSampleManager';
import { StyleGuidanceDisplay } from './StyleGuidanceDisplay';
import { Save, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StyleProfileDetailProps {
  profileId?: string;
  isNew?: boolean;
}

const getAggregateMetrics = (profile: StyleProfile): StyleMetric[] => {
  if (!profile.representative_samples?.length) return [];

  const metricMap = new Map<string, { total: number; count: number; confidence: number }>();

  profile.representative_samples.forEach(sample => {
    sample.metrics.forEach(metric => {
      const existing = metricMap.get(metric.name);
      if (existing) {
        existing.total += metric.value;
        existing.count += 1;
        existing.confidence = Math.max(existing.confidence, metric.confidence);
      } else {
        metricMap.set(metric.name, {
          total: metric.value,
          count: 1,
          confidence: metric.confidence,
        });
      }
    });
  });

  return Array.from(metricMap.entries()).map(([name, data]) => ({
    id: name,
    name,
    value: data.total / data.count,
    confidence: data.confidence,
    description: null,
  }));
};

export const StyleProfileDetail: React.FC<StyleProfileDetailProps> = ({
  profileId,
  isNew = false,
}) => {
  const [profile, setProfile] = useState<Partial<StyleProfile>>({
    name: '',
    description: '',
    genre: [],
    comparable_authors: [],
    user_comments: '',
    representative_samples: [],
  });
  const [guidance, setGuidance] = useState<StyleGuidance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { supabase } = useSupabase();

  useEffect(() => {
    if (!isNew && profileId) {
      fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [profileId]);

  const fetchProfileData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('style_profiles')
        .select('*, representative_samples(*)')
        .eq('id', profileId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch guidance
      const { data: guidanceData, error: guidanceError } = await supabase
        .from('style_guidance')
        .select('*')
        .eq('profile_id', profileId)
        .order('priority', { ascending: false });

      if (guidanceError) throw guidanceError;
      setGuidance(guidanceData || []);
    } catch (error) {
      toast.error('Failed to fetch profile data');
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (isNew) {
        const { data, error } = await supabase
          .from('style_profiles')
          .insert([profile])
          .select()
          .single();

        if (error) throw error;
        toast.success('Profile created successfully');
        // Redirect to the new profile's page
        window.location.href = `/style-profiles/${data.id}`;
      } else {
        const { error } = await supabase
          .from('style_profiles')
          .update(profile)
          .eq('id', profileId);

        if (error) throw error;
        toast.success('Profile updated successfully');
        fetchProfileData();
      }
    } catch (error) {
      toast.error('Failed to save profile');
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleGenreChange = (input: string) => {
    const genres = input.split(',').map(g => g.trim()).filter(Boolean);
    setProfile({ ...profile, genre: genres });
  };

  const handleAuthorsChange = (input: string) => {
    const authors = input.split(',').map(a => a.trim()).filter(Boolean);
    setProfile({ ...profile, comparable_authors: authors });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const aggregateMetrics = profile.representative_samples?.length
    ? getAggregateMetrics(profile as StyleProfile)
    : [];

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">
          {isNew ? 'Create New Style Profile' : 'Edit Style Profile'}
        </h2>
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Profile Name</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={profile.description || ''}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="genre">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Genres
                </div>
              </Label>
              <Input
                id="genre"
                value={profile.genre?.join(', ')}
                onChange={(e) => handleGenreChange(e.target.value)}
                placeholder="Comma-separated genres..."
              />
            </div>

            <div>
              <Label htmlFor="authors">Comparable Authors</Label>
              <Input
                id="authors"
                value={profile.comparable_authors?.join(', ')}
                onChange={(e) => handleAuthorsChange(e.target.value)}
                placeholder="Comma-separated authors..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="comments">Additional Notes</Label>
            <Textarea
              id="comments"
              value={profile.user_comments || ''}
              onChange={(e) => setProfile({ ...profile, user_comments: e.target.value })}
              placeholder="Any additional notes or requirements..."
            />
          </div>
        </div>
      </Card>

      {!isNew && (
        <Tabs defaultValue="analysis">
          <TabsList>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="samples">Samples</TabsTrigger>
            <TabsTrigger value="guidance">Guidance</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="mt-6">
            {aggregateMetrics.length > 0 ? (
              <StyleAnalysisVisualization
                metrics={aggregateMetrics}
                height={500}
              />
            ) : (
              <Card className="p-6 text-center text-gray-500">
                No analysis data available yet. Add some samples to see the analysis.
              </Card>
            )}
          </TabsContent>

          <TabsContent value="samples" className="mt-6">
            <StyleSampleManager
              profileId={profileId!}
              samples={profile.representative_samples || []}
              onSamplesUpdated={fetchProfileData}
            />
          </TabsContent>

          <TabsContent value="guidance" className="mt-6">
            <StyleGuidanceDisplay guidance={guidance} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
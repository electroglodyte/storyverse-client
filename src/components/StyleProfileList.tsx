import React, { useEffect, useState } from 'react';
import { StyleProfile } from '@/types/style';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Book, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const StyleProfileList: React.FC = () => {
  const [profiles, setProfiles] = useState<StyleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { supabase } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('style_profiles')
        .select('*, representative_samples(count)')
        .order('name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      toast.error('Failed to fetch style profiles');
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Style Profiles</h2>
        <Button
          onClick={() => router.push('/style-profiles/new')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <Card
            key={profile.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push(`/style-profiles/${profile.id}`)}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{profile.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {profile.description || 'No description'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/style-profiles/${profile.id}`);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Book className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">
                  {(profile as any).representative_samples_count || 0} samples
                </span>
              </div>

              {profile.genre && profile.genre.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  {profile.genre.map((genre) => (
                    <Badge
                      key={genre}
                      variant="secondary"
                      className="text-xs"
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}

              {profile.comparable_authors && profile.comparable_authors.length > 0 && (
                <div className="text-sm text-gray-500">
                  Similar to: {profile.comparable_authors.join(', ')}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
import React from 'react';
import { useParams } from 'react-router-dom';
import { Location } from '../../types/database';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSupabase } from '@/services/SupabaseService';
import { useState, useEffect } from 'react';

interface LocationDetailsProps {
  locationId?: string;
  storyId?: string;
  onUpdate?: (location: Location) => void;
}

export const LocationDetails: React.FC<LocationDetailsProps> = ({
  locationId,
  storyId,
  onUpdate
}) => {
  const { id } = useParams<{ id: string }>();
  const finalLocationId = locationId || id;
  const supabase = useSupabase();
  
  const [location, setLocation] = useState<Location | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [parentLocation, setParentLocation] = useState<Location | null>(null);
  const [childLocations, setChildLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLocationData = async () => {
      if (!finalLocationId) {
        setError('No location ID provided');
        setLoading(false);
        return;
      }

      try {
        // Load location details
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('*')
          .eq('id', finalLocationId)
          .single();

        if (locationError) throw locationError;
        if (!locationData) throw new Error('Location not found');
        
        setLocation(locationData);

        // Load parent location if exists
        if (locationData.parent_location_id) {
          const { data: parentData, error: parentError } = await supabase
            .from('locations')
            .select('*')
            .eq('id', locationData.parent_location_id)
            .single();

          if (!parentError && parentData) {
            setParentLocation(parentData);
          }
        }

        // Load child locations
        const { data: childrenData, error: childrenError } = await supabase
          .from('locations')
          .select('*')
          .eq('parent_location_id', finalLocationId);

        if (!childrenError && childrenData) {
          setChildLocations(childrenData);
        }

        // Load characters associated with this location
        if (storyId) {
          const { data: characterData, error: characterError } = await supabase
            .from('characters')
            .select('*')
            .eq('location_id', finalLocationId)
            .eq('story_id', storyId);

          if (!characterError && characterData) {
            setCharacters(characterData);
          }
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadLocationData();
  }, [finalLocationId, storyId, supabase]);

  if (loading) {
    return <div className="p-4">Loading location details...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!location) {
    return (
      <Alert>
        <AlertDescription>No location found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{location.name}</h1>
          {location.location_type && (
            <span className="text-sm text-gray-500">{location.location_type}</span>
          )}
        </div>
        {location.image_url && (
          <img 
            src={location.image_url} 
            alt={location.name}
            className="w-32 h-32 object-cover rounded-lg"
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-gray-700">{location.description || 'No description available'}</p>
        </section>

        {parentLocation && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Parent Location</h2>
            <div className="p-3 border rounded-lg">
              <h3 className="font-medium">{parentLocation.name}</h3>
              {parentLocation.location_type && (
                <p className="text-sm text-gray-500">{parentLocation.location_type}</p>
              )}
            </div>
          </section>
        )}

        {childLocations.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Sub-Locations</h2>
            <div className="grid grid-cols-1 gap-2">
              {childLocations.map(child => (
                <div key={child.id} className="p-3 border rounded-lg">
                  <h3 className="font-medium">{child.name}</h3>
                  {child.location_type && (
                    <p className="text-sm text-gray-500">{child.location_type}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {location.climate && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Climate</h2>
            <p className="text-gray-700">{location.climate}</p>
          </section>
        )}

        {location.culture && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Culture</h2>
            <p className="text-gray-700">{location.culture}</p>
          </section>
        )}

        {location.notable_features && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Notable Features</h2>
            <p className="text-gray-700">{location.notable_features}</p>
          </section>
        )}
      </div>

      {characters.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Characters Present</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characters.map(character => (
              <div key={character.id} className="p-3 border rounded-lg">
                <h3 className="font-medium">{character.name}</h3>
                {character.role && (
                  <p className="text-sm text-gray-500">{character.role}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {location.map_coordinates && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Map Coordinates</h2>
          <p className="text-gray-700">{location.map_coordinates}</p>
        </section>
      )}

      {location.notes && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Additional Notes</h2>
          <p className="text-gray-700">{location.notes}</p>
        </section>
      )}
    </div>
  );
};

export default LocationDetails;
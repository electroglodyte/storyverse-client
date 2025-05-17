import React from 'react';
import { useParams } from 'react-router-dom';
import { Character, CharacterRelationship, CharacterEvent } from '../../types/database';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSupabase } from '@/services/SupabaseService';
import { useState, useEffect } from 'react';

interface CharacterDetailsProps {
  characterId?: string;
  storyId?: string;
  onUpdate?: (character: Character) => void;
}

export const CharacterDetails: React.FC<CharacterDetailsProps> = ({
  characterId,
  storyId,
  onUpdate
}) => {
  const { id } = useParams<{ id: string }>();
  const finalCharacterId = characterId || id;
  const supabase = useSupabase();
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [relationships, setRelationships] = useState<CharacterRelationship[]>([]);
  const [events, setEvents] = useState<CharacterEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCharacterData = async () => {
      if (!finalCharacterId) {
        setError('No character ID provided');
        setLoading(false);
        return;
      }

      try {
        // Load character details
        const { data: characterData, error: characterError } = await supabase
          .from('characters')
          .select(`
            *,
            faction:factions(name),
            location:locations(name)
          `)
          .eq('id', finalCharacterId)
          .single();

        if (characterError) throw characterError;
        if (!characterData) throw new Error('Character not found');
        
        setCharacter(characterData);

        // Load relationships
        const { data: relationshipData, error: relationshipError } = await supabase
          .from('character_relationships')
          .select(`
            *,
            character2:characters!character2_id(name)
          `)
          .eq('character1_id', finalCharacterId);

        if (relationshipError) throw relationshipError;
        setRelationships(relationshipData || []);

        // Load character events if storyId is provided
        if (storyId) {
          const { data: eventData, error: eventError } = await supabase
            .from('character_events')
            .select(`
              *,
              event:events(*)
            `)
            .eq('character_id', finalCharacterId)
            .eq('event:events.story_id', storyId)
            .order('character_sequence_number', { ascending: true });

          if (eventError) throw eventError;
          setEvents(eventData || []);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadCharacterData();
  }, [finalCharacterId, storyId, supabase]);

  if (loading) {
    return <div className="p-4">Loading character details...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!character) {
    return (
      <Alert>
        <AlertDescription>No character found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{character.name}</h1>
          {character.role && (
            <span className="text-sm text-gray-500">{character.role}</span>
          )}
        </div>
        {character.image_url && (
          <img 
            src={character.image_url} 
            alt={character.name}
            className="w-32 h-32 object-cover rounded-lg"
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-gray-700">{character.description || 'No description available'}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Background</h2>
          <p className="text-gray-700">{character.background || 'No background available'}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Motivation</h2>
          <p className="text-gray-700">{character.motivation || 'No motivation specified'}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Personality</h2>
          <p className="text-gray-700">{character.personality || 'No personality traits specified'}</p>
        </section>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-2">Relationships</h2>
        {relationships.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relationships.map((rel) => (
              <div key={rel.id} className="p-3 border rounded-lg">
                <h3 className="font-medium">{rel.character2?.name}</h3>
                <p className="text-sm text-gray-500">{rel.relationship_type}</p>
                {rel.description && (
                  <p className="text-sm mt-1">{rel.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No relationships defined</p>
        )}
      </section>

      {events.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Story Events</h2>
          <div className="space-y-4">
            {events.map((charEvent) => (
              <div key={charEvent.id} className="p-3 border rounded-lg">
                <h3 className="font-medium">{charEvent.event?.title}</h3>
                <p className="text-sm text-gray-500">
                  Experience: {charEvent.experience_type || 'Not specified'}
                  {charEvent.importance && ` • Importance: ${charEvent.importance}/10`}
                </p>
                {charEvent.notes && (
                  <p className="text-sm mt-1">{charEvent.notes}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {character.notes && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Additional Notes</h2>
          <p className="text-gray-700">{character.notes}</p>
        </section>
      )}
    </div>
  );
};

export default CharacterDetails;
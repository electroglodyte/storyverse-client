import React from 'react';
import { useParams } from 'react-router-dom';
import { Faction, Character, Location } from '../../types/database';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSupabase } from '@/services/SupabaseService';
import { useState, useEffect } from 'react';

interface FactionDetailsProps {
  factionId?: string;
  storyId?: string;
  onUpdate?: (faction: Faction) => void;
}

export const FactionDetails: React.FC<FactionDetailsProps> = ({
  factionId,
  storyId,
  onUpdate
}) => {
  const { id } = useParams<{ id: string }>();
  const finalFactionId = factionId || id;
  const supabase = useSupabase();
  
  const [faction, setFaction] = useState<Faction | null>(null);
  const [members, setMembers] = useState<Character[]>([]);
  const [leader, setLeader] = useState<Character | null>(null);
  const [headquarters, setHeadquarters] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFactionData = async () => {
      if (!finalFactionId) {
        setError('No faction ID provided');
        setLoading(false);
        return;
      }

      try {
        // Load faction details
        const { data: factionData, error: factionError } = await supabase
          .from('factions')
          .select(`
            *,
            leader:characters(id, name, role),
            headquarters:locations(id, name, location_type)
          `)
          .eq('id', finalFactionId)
          .single();

        if (factionError) throw factionError;
        if (!factionData) throw new Error('Faction not found');
        
        setFaction(factionData);
        if (factionData.leader) setLeader(factionData.leader);
        if (factionData.headquarters) setHeadquarters(factionData.headquarters);

        // Load faction members
        const { data: memberData, error: memberError } = await supabase
          .from('faction_characters')
          .select(`
            *,
            character:characters(*)
          `)
          .eq('faction_id', finalFactionId);

        if (!memberError && memberData) {
          const characters = memberData
            .map(m => m.character)
            .filter((c): c is Character => c !== null);
          setMembers(characters);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadFactionData();
  }, [finalFactionId, supabase]);

  if (loading) {
    return <div className="p-4">Loading faction details...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!faction) {
    return (
      <Alert>
        <AlertDescription>No faction found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{faction.name}</h1>
          {faction.faction_type && (
            <span className="text-sm text-gray-500">{faction.faction_type}</span>
          )}
        </div>
        {faction.image_url && (
          <img 
            src={faction.image_url} 
            alt={faction.name}
            className="w-32 h-32 object-cover rounded-lg"
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-gray-700">{faction.description || 'No description available'}</p>
        </section>

        {leader && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Leader</h2>
            <div className="p-3 border rounded-lg">
              <h3 className="font-medium">{leader.name}</h3>
              {leader.role && (
                <p className="text-sm text-gray-500">{leader.role}</p>
              )}
            </div>
          </section>
        )}

        {headquarters && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Headquarters</h2>
            <div className="p-3 border rounded-lg">
              <h3 className="font-medium">{headquarters.name}</h3>
              {headquarters.location_type && (
                <p className="text-sm text-gray-500">{headquarters.location_type}</p>
              )}
            </div>
          </section>
        )}

        {faction.ideology && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Ideology</h2>
            <p className="text-gray-700">{faction.ideology}</p>
          </section>
        )}

        {faction.goals && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Goals</h2>
            <p className="text-gray-700">{faction.goals}</p>
          </section>
        )}

        {faction.resources && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Resources</h2>
            <p className="text-gray-700">{faction.resources}</p>
          </section>
        )}
      </div>

      {members.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Members</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(member => (
              <div key={member.id} className="p-3 border rounded-lg">
                <h3 className="font-medium">{member.name}</h3>
                {member.role && (
                  <p className="text-sm text-gray-500">{member.role}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {faction.notes && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Additional Notes</h2>
          <p className="text-gray-700">{faction.notes}</p>
        </section>
      )}
    </div>
  );
};

export default FactionDetails;
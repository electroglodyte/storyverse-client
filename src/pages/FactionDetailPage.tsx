import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Faction, StoryWorld, Character, FactionCharacter } from '../supabase-tables';
import { FaArrowLeft, FaSave, FaUserPlus, FaUserMinus, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

// Modified interface to correctly extend Character with appropriate role type
interface FactionMember extends Omit<Character, 'role'> {
  role: string;
  faction_character_id: string;
}

interface CharacterData {
  id: string;
  name: string;
  description: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'background' | 'other'; // Use the correct enum type
  attributes: any;
  relationships: any;
  story_world_id: string;
  storyworld_id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const FactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewFaction = id === 'new';

  const [faction, setFaction] = useState<Faction>({
    id: isNewFaction ? crypto.randomUUID() : id || '',
    name: '',
    description: '',
    type: 'other',
    attributes: {},
    storyworld_id: '',
    story_world_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: '',
  });

  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([]);
  const [members, setMembers] = useState<FactionMember[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingData, setSavingData] = useState(false);
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [newMemberId, setNewMemberId] = useState('');
  const [showMembersSection, setShowMembersSection] = useState(true);

  const factionTypes = [
    { value: 'political', label: 'Political' },
    { value: 'social', label: 'Social' },
    { value: 'familial', label: 'Family' },
    { value: 'criminal', label: 'Criminal' },
    { value: 'military', label: 'Military' },
    { value: 'religious', label: 'Religious' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'educational', label: 'Educational' },
    { value: 'other', label: 'Other' },
  ];

  const memberRoles = [
    { value: 'leader', label: 'Leader' },
    { value: 'member', label: 'Member' },
    { value: 'ally', label: 'Ally' },
    { value: 'founder', label: 'Founder' },
    { value: 'enemy', label: 'Enemy (Hostile)' },
    { value: 'spy', label: 'Spy' },
    { value: 'former', label: 'Former Member' },
    { value: 'recruit', label: 'Recruit' },
    { value: 'supporter', label: 'Supporter' },
    { value: 'outcast', label: 'Outcast' },
    { value: 'other', label: 'Other' },
  ];

  // Fetch story worlds
  useEffect(() => {
    const fetchStoryWorlds = async () => {
      try {
        const { data, error } = await supabase
          .from('story_worlds')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          throw error;
        }

        setStoryWorlds(data || []);

        // Set default story world for new faction
        if (isNewFaction && data && data.length > 0) {
          setFaction(prev => ({
            ...prev,
            story_world_id: data[0].id,
            storyworld_id: data[0].id,
          }));
        }
      } catch (error: any) {
        toast.error(`Error fetching story worlds: ${error.message}`);
        console.error('Error fetching story worlds:', error);
      }
    };

    fetchStoryWorlds();
  }, [isNewFaction]);

  // Fetch faction data if editing
  useEffect(() => {
    if (isNewFaction) {
      setLoading(false);
      return;
    }

    const fetchFaction = async () => {
      try {
        const { data, error } = await supabase
          .from('factions')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setFaction(data);
        }
      } catch (error: any) {
        toast.error(`Error fetching faction: ${error.message}`);
        console.error('Error fetching faction:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaction();
  }, [id, isNewFaction]);

  // Fetch faction members when faction or story world changes
  useEffect(() => {
    if (!faction.story_world_id || !faction.id || isNewFaction) {
      setMembers([]);
      return;
    }

    const fetchMembers = async () => {
      try {
        // Fetch faction_characters and join with characters
        const { data, error } = await supabase
          .from('faction_characters')
          .select(`
            id,
            faction_id,
            character_id,
            role,
            characters:character_id (
              id,
              name,
              description,
              role,
              attributes,
              relationships,
              story_world_id,
              storyworld_id,
              created_at,
              updated_at,
              user_id
            )
          `)
          .eq('faction_id', faction.id);

        if (error) {
          throw error;
        }

        // Create properly typed member objects
        if (data && data.length > 0) {
          const membersList: FactionMember[] = data.map(item => {
            // Check if item.characters exists and is not null/undefined
            if (!item.characters) {
              console.error('Character data missing for faction member:', item);
              return null;
            }
            
            // Handle the case where item.characters might be an array or an object
            // We need to extract the character data appropriately
            let characterData: CharacterData;
            
            if (Array.isArray(item.characters)) {
              // If it's an array, take the first element
              if (item.characters.length === 0) {
                console.error('Character data array is empty for faction member:', item);
                return null;
              }
              characterData = item.characters[0] as unknown as CharacterData;
            } else {
              // Otherwise, use it directly as an object
              characterData = item.characters as unknown as CharacterData;
            }
            
            // Create a properly typed character object from the data
            const character: Character = {
              id: characterData.id,
              name: characterData.name,
              role: characterData.role,
              description: characterData.description,
              attributes: characterData.attributes,
              relationships: characterData.relationships || {},
              story_world_id: characterData.story_world_id,
              storyworld_id: characterData.storyworld_id,
              created_at: characterData.created_at,
              updated_at: characterData.updated_at,
              user_id: characterData.user_id || ''
            };
            
            // Create a proper FactionMember by extending the character
            const member: FactionMember = {
              ...character,
              role: item.role || 'member',
              faction_character_id: item.id
            };
            
            return member;
          }).filter((item): item is FactionMember => item !== null);
          
          setMembers(membersList);
        } else {
          setMembers([]);
        }
      } catch (error: any) {
        toast.error(`Error fetching faction members: ${error.message}`);
        console.error('Error fetching faction members:', error);
      }
    };

    fetchMembers();
  }, [faction.id, faction.story_world_id, isNewFaction]);

  // Fetch available characters based on the story world
  useEffect(() => {
    if (!faction.story_world_id) return;

    const fetchAvailableCharacters = async () => {
      try {
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('story_world_id', faction.story_world_id)
          .order('name', { ascending: true });

        if (error) {
          throw error;
        }

        // Filter out characters already in the faction
        const memberIds = members.map(m => m.id);
        const available = data?.filter(char => !memberIds.includes(char.id)) || [];
        
        setAvailableCharacters(available);
        
        // Set default for new member dropdown
        if (available.length > 0) {
          setNewMemberId(available[0].id);
        }
      } catch (error: any) {
        console.error('Error fetching available characters:', error);
      }
    };

    fetchAvailableCharacters();
  }, [faction.story_world_id, members]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'story_world_id') {
      setFaction({
        ...faction,
        story_world_id: value,
        storyworld_id: value, // Keep both fields in sync
      });
    } else {
      setFaction({
        ...faction,
        [name]: value,
      });
    }
  };

  const handleSaveFaction = async () => {
    if (!faction.name.trim()) {
      toast.error('Faction name is required');
      return;
    }

    try {
      setSavingData(true);
      const now = new Date().toISOString();
      
      const factionToSave = {
        ...faction,
        updated_at: now,
        created_at: isNewFaction ? now : faction.created_at,
      };

      let operation;
      if (isNewFaction) {
        operation = supabase.from('factions').insert([factionToSave]);
      } else {
        operation = supabase.from('factions').update(factionToSave).eq('id', faction.id);
      }

      const { error } = await operation;

      if (error) {
        throw error;
      }

      toast.success(`Faction ${isNewFaction ? 'created' : 'updated'} successfully`);
      
      if (isNewFaction) {
        navigate(`/factions/${faction.id}`);
      }
    } catch (error: any) {
      toast.error(`Error saving faction: ${error.message}`);
      console.error('Error saving faction:', error);
    } finally {
      setSavingData(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberId || !faction.id) return;
    
    try {
      const newMemberRelation = {
        id: crypto.randomUUID(),
        faction_id: faction.id,
        character_id: newMemberId,
        role: newMemberRole,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('faction_characters')
        .insert([newMemberRelation]);

      if (error) {
        throw error;
      }

      // Find the character in availableCharacters
      const addedCharacter = availableCharacters.find(c => c.id === newMemberId);
      
      if (addedCharacter) {
        // Add to members
        const newMember: FactionMember = {
          ...addedCharacter,
          role: newMemberRole,
          faction_character_id: newMemberRelation.id,
        };
        
        setMembers([...members, newMember]);
        
        // Remove from available characters
        setAvailableCharacters(availableCharacters.filter(c => c.id !== newMemberId));
        
        toast.success(`Character added to faction`);
        
        // Reset the selection if there are still characters available
        if (availableCharacters.length > 1) {
          const nextAvailableId = availableCharacters.find(c => c.id !== newMemberId)?.id || '';
          setNewMemberId(nextAvailableId);
        }
      }
    } catch (error: any) {
      toast.error(`Error adding member: ${error.message}`);
      console.error('Error adding member:', error);
    }
  };

  const handleRemoveMember = async (memberId: string, factionCharacterId: string) => {
    try {
      const { error } = await supabase
        .from('faction_characters')
        .delete()
        .eq('id', factionCharacterId);

      if (error) {
        throw error;
      }

      // Remove from members list
      const removedMember = members.find(m => m.id === memberId);
      setMembers(members.filter(m => m.id !== memberId));
      
      // Add back to available characters if found
      if (removedMember) {
        const characterToAdd: Character = {
          id: removedMember.id,
          name: removedMember.name,
          role: 'other', // Set to 'other' to match enum type
          description: removedMember.description,
          attributes: removedMember.attributes,
          relationships: removedMember.relationships,
          story_world_id: faction.story_world_id,
          storyworld_id: faction.story_world_id,
          created_at: removedMember.created_at,
          updated_at: removedMember.updated_at,
          user_id: removedMember.user_id,
        };
        
        setAvailableCharacters([...availableCharacters, characterToAdd].sort((a, b) => 
          a.name.localeCompare(b.name)
        ));
      }
      
      toast.success('Member removed from faction');
    } catch (error: any) {
      toast.error(`Error removing member: ${error.message}`);
      console.error('Error removing member:', error);
    }
  };

  const handleChangeMemberRole = async (memberId: string, factionCharacterId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('faction_characters')
        .update({ role: newRole })
        .eq('id', factionCharacterId);

      if (error) {
        throw error;
      }

      // Update the role in the members list
      setMembers(members.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      ));
      
      toast.success('Member role updated');
    } catch (error: any) {
      toast.error(`Error updating member role: ${error.message}`);
      console.error('Error updating member role:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button 
          onClick={() => navigate('/factions')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" />
          Back to Factions
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6">
          {isNewFaction ? 'Create New Faction' : 'Edit Faction'}
        </h1>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Story World *
            </label>
            <select
              name="story_world_id"
              value={faction.story_world_id}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              {storyWorlds.map((world) => (
                <option key={world.id} value={world.id}>
                  {world.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Faction Name *
            </label>
            <input
              type="text"
              name="name"
              value={faction.name}
              onChange={handleInputChange}
              placeholder="Enter faction name"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Faction Type
            </label>
            <select
              name="type"
              value={faction.type}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {factionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={faction.description}
              onChange={handleInputChange}
              placeholder="Enter faction description"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveFaction}
            disabled={savingData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50"
          >
            <FaSave className="mr-2" />
            {savingData ? 'Saving...' : 'Save Faction'}
          </button>
        </div>
      </div>

      {!isNewFaction && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div 
            className="flex justify-between items-center cursor-pointer mb-4"
            onClick={() => setShowMembersSection(!showMembersSection)}
          >
            <h2 className="text-xl font-bold">Faction Members</h2>
            {showMembersSection ? <FaChevronUp /> : <FaChevronDown />}
          </div>

          {showMembersSection && (
            <>
              {members.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 mb-6">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {members.map((member) => (
                        <tr key={member.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {member.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={member.role}
                              onChange={(e) => handleChangeMemberRole(member.id, member.faction_character_id, e.target.value)}
                              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                              {memberRoles.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleRemoveMember(member.id, member.faction_character_id)}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <FaUserMinus className="mr-1" />
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 mb-6 text-gray-500">
                  No members yet. Add characters from your story world below.
                </div>
              )}

              {availableCharacters.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-4">Add Character to Faction</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Character
                      </label>
                      <select
                        value={newMemberId}
                        onChange={(e) => setNewMemberId(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        {availableCharacters.map((character) => (
                          <option key={character.id} value={character.id}>
                            {character.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role in Faction
                      </label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        {memberRoles.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleAddMember}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
                      >
                        <FaUserPlus className="mr-2" />
                        Add Member
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No available characters to add. Create characters in this story world first.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FactionDetailPage;
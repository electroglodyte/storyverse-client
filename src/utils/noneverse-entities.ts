/**
 * NoneVerse Entities
 * 
 * This file contains code to create the NoneVerse story world, characters, and locations
 * in your Supabase database.
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Supabase connection parameters
const supabaseUrl = 'https://rkmjjhjjpnhjymqmcvpe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbWpqaGpqcG5oanltcW1jdnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MzM5NDUsImV4cCI6MjA2MjQwOTk0NX0.GlxA96751aHLq0Bi6nhKXtWHF0tlmWvsemGr3heQ13k';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Define the NoneVerse story world
const noneVerseWorld = {
  id: uuidv4(),
  name: 'NoneVerse',
  description: 'A reality where the boundaries between what exists and what doesn\'t are permeable. In the NoneVerse, absence has presence, voids contain multitudes, and forgotten things gain power.',
  genre: ['fantasy', 'science fiction', 'speculative'],
  tags: ['dimensional', 'metaphysical', 'surreal'],
  time_period: 'Outside conventional time',
  rules: 'In the NoneVerse, physics are mutable, time is non-linear, and consciousness affects reality. Nothing is truly destroyed, only transformed or forgotten. The more something is forgotten, the more power it potentially contains.',
  notes: 'Created on May 15, 2025 as a collaborative worldbuilding exercise.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Define characters
const characters = [
  {
    id: uuidv4(),
    name: 'Vex Hollow',
    description: 'A former quantum physicist with hollow eyes that appear to contain tiny universes. After an experiment gone wrong, Vex exists in a perpetual state of semi-presence - sometimes visible, sometimes just a voice in the wind. They collect abandoned dreams and forgotten memories, storing them in glass vials attached to their tattered lab coat.',
    story_world_id: noneVerseWorld.id,
    role: 'protagonist',
    appearance: 'Tall and gaunt with hollow eyes containing swirling microcosms. Wears a tattered lab coat covered in glass vials of glowing substances. Physical form sometimes becomes transparent or fades entirely.',
    background: 'Once a brilliant physicist specializing in quantum observation theory. An experiment attempting to measure the space between particles went catastrophically wrong, hollowing out parts of their existence.',
    motivation: 'To understand the nature of emptiness and find a way to restore their complete existence.',
    personality: 'Intellectual, curious, and possessing a dry sense of humor. Has an almost compulsive need to fix broken things. Sometimes forgets that they\'re speaking aloud versus thinking internally.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Mira Latch',
    description: 'A cartographer of impossible spaces who can identify paths between places that shouldn\'t connect. With silver-threaded hair that moves independently of wind or gravity, Mira navigates the NoneVerse by feeling the textures of reality beneath her fingertips. She carries an ancient brass compass that doesn\'t point north, but toward the nearest dimensional aberration.',
    story_world_id: noneVerseWorld.id,
    role: 'supporting',
    appearance: 'Medium height with bronze skin and silver-threaded hair that moves independently of gravity. Eyes that change color based on the stability of local reality. Always carries an ancient brass compass with strange markings.',
    background: 'Born with the ability to sense "thin spots" between realities. Self-taught in the art of mapping impossible spaces and finding paths that shouldn\'t exist. Discovered the NoneVerse accidentally while following a path that appeared on no conventional map.',
    motivation: 'To create the first complete atlas of the NoneVerse and all its connected realms.',
    personality: 'Quiet, methodical, and extraordinarily patient. Has an almost supernatural sense of direction but struggles with emotional connections since she can see how temporary all things truly are.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Drav Thorne',
    description: 'A former guardian of reality\'s boundaries who now works as a smuggler of contraband concepts. His skin is covered in shifting tattoos that represent rules he\'s broken. With a prosthetic arm made of crystallized time, Drav can temporarily suspend local physics, though each use ages him slightly.',
    story_world_id: noneVerseWorld.id,
    role: 'antagonist',
    appearance: 'Muscular build with olive skin covered in shifting tattoos that represent rules he\'s broken. Has a prosthetic right arm made of crystallized time that occasionally ticks audibly. Deep voice that sometimes echoes slightly.',
    background: 'Once part of an ancient order tasked with maintaining the boundaries between realities. Abandoned his post after becoming disillusioned with the rigid ideology of his order. Now uses his knowledge to smuggle concepts that shouldn\'t exist between realities.',
    motivation: 'To acquire enough power and knowledge to rewrite the fundamental rules of existence, believing the current system to be fundamentally flawed.',
    personality: 'Charismatic and roguish, hiding his guilt over abandoning his duties behind bravado and clever wordplay. Deeply intelligent but prone to taking unnecessary risks.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Define locations
const locations = [
  {
    id: uuidv4(),
    name: 'The Hollow Market',
    description: 'A bazaar that exists in the negative spaces between realities, appearing only during what locals call "null hours." Stalls constructed from forgotten architecture sell impossible wares - bottled echoes, pre-worn memories, emotional residue, and maps to places that don\'t exist yet. The market is illuminated by lanterns containing the last thoughts of extinct species, casting shadows that move independently of their owners.',
    story_world_id: noneVerseWorld.id,
    location_type: 'realm',
    climate: 'Varies unpredictably. Sometimes multiple climates exist simultaneously in different sections.',
    culture: 'A complex economy based on barter of abstractions and concepts. No centralized authority, but governed by unwritten rules that shift subtly after each "null hour" cycle.',
    notable_features: 'The constant background noise is a melodic hum that seems to be counting down to something. Central fountain that flows upward with a liquid that isn\'t quite water. Shadows that move independently of their casters.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'The Recursion Library',
    description: 'A massive, seemingly infinite structure where books contain stories that change every time they\'re read. Built from materials that shouldn\'t structurally work together - liquid glass, solidified smoke, and compressed silence - the library defies conventional geometry. Some corridors loop back on themselves, others lead to reading rooms that exist in different time periods.',
    story_world_id: noneVerseWorld.id,
    location_type: 'building',
    climate: 'Temperature and humidity carefully maintained for book preservation, though what\'s optimal for books from different realities varies widely, creating microclimates throughout.',
    culture: 'Maintained by librarians who appear human from the front but are hollow when viewed from behind. Strictly enforced silence except in designated "echo chambers" where whispers from other timelines can be heard.',
    notable_features: 'The air smells faintly of cinnamon and static electricity. Books that write themselves based on readers\' thoughts. The Infinite Index - a catalog that supposedly contains references to every book that has been or will be written across all realities.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Function to add NoneVerse entities to Supabase
export async function addNoneVerseEntities() {
  try {
    // Insert story world
    const { data: worldData, error: worldError } = await supabase
      .from('story_worlds')
      .insert(noneVerseWorld)
      .select();

    if (worldError) {
      throw new Error(`Error creating story world: ${worldError.message}`);
    }
    
    console.log('Created NoneVerse story world:', worldData);

    // Insert characters
    const { data: charactersData, error: charactersError } = await supabase
      .from('characters')
      .insert(characters)
      .select();

    if (charactersError) {
      throw new Error(`Error creating characters: ${charactersError.message}`);
    }
    
    console.log('Created NoneVerse characters:', charactersData);

    // Insert locations
    const { data: locationsData, error: locationsError } = await supabase
      .from('locations')
      .insert(locations)
      .select();

    if (locationsError) {
      throw new Error(`Error creating locations: ${locationsError.message}`);
    }
    
    console.log('Created NoneVerse locations:', locationsData);

    return {
      storyWorld: worldData,
      characters: charactersData,
      locations: locationsData
    };
  } catch (error) {
    console.error('Error adding NoneVerse entities:', error);
    throw error;
  }
}

// Usage:
// import { addNoneVerseEntities } from './path/to/noneverse-entities';
// 
// addNoneVerseEntities()
//   .then(result => console.log('Successfully added NoneVerse entities:', result))
//   .catch(error => console.error('Failed to add NoneVerse entities:', error));

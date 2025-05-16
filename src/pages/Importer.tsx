import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import './Importer.css';
import { v4 as uuidv4 } from 'uuid'; // Add UUID import

interface FileInfo {
  file: File;
  content: string | null;
}

interface ExtractedElements {
  characters: any[];
  locations: any[];
  plotlines: any[];
  scenes: any[];
  events: any[];
  objects: any[]; // Added objects
}

// Default story and world UUIDs - use the existing records from the database
const DEFAULT_STORYWORLD_ID = 'bb4e4c55-0280-4ba1-985b-1590e3270d65'; // NoneVerse UUID
const DEFAULT_STORY_ID = '02334755-067a-44b2-bb58-9c8aa24ac667'; // NoneStory UUID

// Helper function to extract characters marked in ALL CAPS
const extractAllCapsCharacters = (text: string): string[] => {
  // Regular expression to match words in ALL CAPS with 2 or more letters
  const allCapsRegex = /\b[A-Z]{2,}(?:'[A-Z]+)?\b/g;
  const matches = text.match(allCapsRegex) || [];
  
  // Filter out common non-character ALL CAPS words
  const nonCharacterWords = ['THE', 'AND', 'OF', 'TO', 'IN', 'A', 'FOR', 'WITH', 'IS', 'ON', 'AT', 'BY', 'AS', 'IT', 'ALL'];
  return [...new Set(matches)].filter(word => !nonCharacterWords.includes(word));
};

// Helper function to extract locations based on patterns
const extractLocations = (text: string): string[] => {
  // Common location indicators
  const locationPrefixes = ['at', 'in', 'to', 'from', 'near', 'around', 'inside', 'outside'];
  const locationIndicators = ['street', 'avenue', 'road', 'lane', 'drive', 'boulevard', 'highway', 
                             'park', 'building', 'house', 'apartment', 'office', 'room', 'city', 
                             'town', 'village', 'country', 'kingdom', 'castle', 'palace', 'mountain',
                             'river', 'lake', 'ocean', 'sea', 'forest', 'desert', 'cafe', 'restaurant',
                             'bar', 'pub', 'hotel', 'motel', 'school', 'university', 'college', 'hospital'];
  
  // Find potential locations: capitalized words after location prefixes
  const locations = new Set<string>();
  
  // Check for "INT." and "EXT." in screenplay format (interior/exterior locations)
  const scriptLocationRegex = /\b(INT\.|EXT\.)\s+([A-Z][A-Za-z0-9\s']+)(?:\s*-\s*|\s*–\s*|$)/g;
  let match;
  while ((match = scriptLocationRegex.exec(text)) !== null) {
    if (match[2] && match[2].trim().length > 0) {
      locations.add(match[2].trim());
    }
  }
  
  // Look for capitalized phrases after location prefixes
  const lines = text.split('\n');
  for (const line of lines) {
    for (const prefix of locationPrefixes) {
      const regex = new RegExp(`\\b${prefix}\\s+([A-Z][A-Za-z0-9\\s']+)\\b`, 'g');
      while ((match = regex.exec(line)) !== null) {
        if (match[1] && match[1].trim().length > 0) {
          locations.add(match[1].trim());
        }
      }
    }
  }
  
  // Look for capitalized phrases containing location indicators
  for (const indicator of locationIndicators) {
    const regex = new RegExp(`\\b([A-Z][A-Za-z0-9\\s']*\\s+${indicator})\\b`, 'gi');
    while ((match = regex.exec(text)) !== null) {
      if (match[1] && match[1].trim().length > 0) {
        locations.add(match[1].trim());
      }
    }
  }
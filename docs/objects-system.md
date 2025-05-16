# StoryVerse Objects System

## Overview

The Objects System is a new feature in StoryVerse that tracks significant props, items, artifacts, and other objects throughout your stories. This system helps writers keep track of important physical items in their narratives and understand how these objects relate to characters, locations, and events.

## Key Features

- **Object Detection**: Automatically identify potential significant objects in your text
- **Object Relationships**: Track how objects relate to characters and locations
- **Object Appearances**: Monitor where and when objects appear in your story
- **Object Analysis**: Analyze how objects are used throughout the narrative

## Database Structure

The Objects system consists of several related tables:

1. **objects** - Main table storing object data:
   - Basic properties: name, description, significance
   - Classification: object_type, tags
   - Status tracking: current_location, current_owner
   - Usage metrics: appearance_count, is_macguffin

2. **object_character_relationships** - Tracks how objects relate to characters:
   - Relationship types: owned, created, desires, uses, associated

3. **object_location_relationships** - Tracks how objects relate to locations:
   - Relationship types: located, stored, origin, hidden

4. **object_appearances** - Tracks when/where objects appear:
   - Can link to scenes and/or events
   - Tracks importance in each appearance

## Object Types

Objects can be classified into various types:
- **weapon**: Swords, guns, daggers, etc.
- **tool**: Devices, instruments, apparatus
- **clothing**: Garments, robes, cloaks
- **magical**: Enchanted items, talismans, potions
- **technology**: Advanced devices, computers
- **document**: Books, scrolls, letters, maps
- **other**: Miscellaneous objects

## Using the Objects System

### 1. Automatic Detection

When analyzing a story using the `analyze_story` function, StoryVerse will:
- Identify potential objects based on contextual patterns
- Detect relationships between objects and characters/locations
- Track object appearances in events

### 2. Manual Creation

You can manually create objects using:
- `create_object`: Creates a new object with specific properties
- `link_object_to_character`: Establishes a relationship between an object and a character
- `link_object_to_location`: Links an object to a specific location
- `track_object_appearance`: Records when an object appears in a scene or event

### 3. Analysis

Use `analyze_object_usage` to get insights about:
- How frequently objects appear
- Which characters interact with which objects
- How objects move through locations
- Object storylines and arcs throughout the narrative

## Integration with Story Elements

The Objects system connects with other StoryVerse elements:

- **Characters**: Characters can own, create, desire, or use objects
- **Locations**: Objects can be located in, stored in, originate from, or be hidden in locations
- **Events**: Objects can play roles in story events with varying importance
- **Scenes**: Objects can appear in specific scenes

## MacGuffins

The system has special support for tracking MacGuffins - objects that drive the plot:
- Set `is_macguffin` to true for particularly significant plot objects
- These will be highlighted in analysis for their special story role

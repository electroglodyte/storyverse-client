# StoryVerse Project Roadmap

This document outlines the planned features, improvements, and milestones for the StoryVerse project.

## Current Version: 0.9.13 (2025-05-17)

## Vision
StoryVerse aims to be a comprehensive storytelling platform that leverages AI to help writers develop, visualize, and manage complex narratives with interconnected characters, events, and storylines.

## Interface Architecture Vision

### Current Mode (Interim Solution)
* Entity pages accessible from the sidebar with story world pre-selected
* But still allowing selection changes via the dropdown
* Works for now as a flexible approach

### Future Architecture Vision
1. **Project-Focused View** (accessed from sidebar)
   * Entity pages (Characters, Locations, etc.) locked to the current story world
   * No story world selector visible - purely working within the context of the selected project
   * Cleaner, more focused interface for story development
2. **Admin/Database View** (separate navigation)
   * Comprehensive tables with full filtering options
   * Story world selection and cross-project capabilities
   * More powerful for data management across the entire system

This distinction makes perfect sense from a UX perspective. It separates the creative workflow (staying within one story world) from the administrative/data management workflow (working across all story worlds).

## Short-Term Goals (1-3 Months)

### Database Enhancements
- [x] Define basic story world, character, and location schemas
- [ ] Implement event relationships and dependencies
- [ ] Create character-event junction table
- [ ] Add sequence numbering to events
- [x] Add essence and interest fields to scenes table
- [x] Add creation_notes, 5Q, and subtext fields to scenes table
- [x] Create story_questions table for tracking narrative questions
- [x] Create writing_goals, writing_sessions, and daily_progress tables for progress tracking
- [x] Add image_url column to characters table to fix character import issue

### Progress Tracking Features
- [x] Database schema for writing goals, sessions, and progress tracking
- [ ] Dashboard UI implementation with progress visualization
- [ ] Goal setting interface for daily/weekly/monthly targets
- [ ] Session timer and word count tracking
- [ ] Daily writing summaries and statistics
- [ ] Progress charts and achievement badges

### MCP Tools Development
- [ ] Build character journey analysis tools
- [ ] Implement event manipulation functions
- [ ] Create generative story element tools
- [ ] Develop journey comparison functionality
- [ ] Develop tools to extract events from text descriptions
- [x] Develop tools for scene metadata: creation_notes, 5Q, and subtext

### UI Improvements
- [x] Fix TypeScript errors in StoryImporter component
- [x] Completely rewrite StoryImporter with direct character extraction from ALL CAPS names
- [x] Improve character extraction with multi-word name detection (e.g., "BOBA FETT")
- [x] Add better character descriptions instead of generic placeholders
- [x] Fix checkbox functionality in character selection
- [x] Filter out possessive forms like "Wolf's" from character detection
- [x] Fix character importer to properly merge API results with locally extracted characters
- [x] Fix Supabase query handling in Importer.tsx to resolve TypeScript errors
- [x] Add duplicate character detection during import process
- [x] Fix Promise handling in extractor functions to properly await results
- [x] Simplify import process with direct JSON import interface
- [x] Fix character import functionality to properly handle database schema requirements
- [ ] Implement React Flow for story visualization
- [ ] Create multiple interactive views:
  - [ ] Timeline View
  - [ ] Relationship View
  - [ ] Character Journey View
  - [ ] Canvas View (Miro-like)
- [ ] Design and implement drag-and-drop event reordering
- [ ] Add event detail cards with quick-edit functionality
- [ ] Implement real-time updates between UI and database

## Medium-Term Goals (3-6 Months)

### Advanced Story Structure
- [ ] Implement story beat templates (Hero's Journey, Save the Cat, 3-Act, etc.)
- [ ] Add story analysis tools to detect pacing issues
- [ ] Create theme and motif tracking capabilities
- [ ] Develop beat sheet management
- [ ] Create conflict and resolution visualization
- [ ] Create story question interface to track major narrative questions

### Advanced Progress Analytics
- [ ] Historical writing patterns analysis
- [ ] Predictive completion date estimates
- [ ] Productivity optimization suggestions
- [ ] Writing streak gamification
- [ ] Customizable dashboard widgets
- [ ] Progress reports and exports

### Collaboration Features
- [ ] Add multi-user editing capabilities
- [ ] Implement authentication and permission levels
- [ ] Create commenting and feedback system for story elements
- [ ] Implement version history for storylines

### Export and Integration
- [ ] Add export to common writing formats (Fountain, Final Draft, etc.)
- [ ] Create integration with other writing tools
- [ ] Implement timeline/beat sheet PDF export

### Analytics
- [ ] Character screen time/importance analysis
- [ ] Pacing visualization
- [ ] Emotional arc tracking
- [ ] Subplot balance analysis

## Long-Term Vision (6+ Months)

### Story Intelligence
- [ ] AI-assisted plot hole detection
- [ ] Character consistency analysis
- [ ] Genre-specific writing suggestions
- [ ] "What if" scenario exploration
- [ ] Emotional impact prediction based on story structure
- [ ] Automated story consistency checking
- [ ] Character voice maintenance tools
- [ ] Scene generation from plot points
- [ ] World-building assistant

### Community Features
- [ ] Shared story element templates
- [ ] Public/private story worlds
- [ ] Collaborative story universe building

### Expanded Content Types
- [ ] Support for screenplays with industry-standard formatting
- [ ] Novel chapter management
- [ ] Series planning across multiple stories
- [ ] Interactive narrative branches

### Production Integration
- [ ] Production scheduling features
- [ ] Budget tracking per scene/storyline
- [ ] Location scouting integration
- [ ] Character casting suggestions

## Technical Debt & Maintenance
- [x] Fix TypeScript errors in StoryImporter component
- [x] Replace API-based character detection with direct ALL CAPS extraction
- [x] Refactor character extraction into modular components
- [x] Improve character detection to handle multi-word names and possessive forms
- [x] Fix issue with component imports (using the correct Importer component)
- [x] Fix TypeScript errors related to Supabase promises/queries
- [x] Implement character duplicate detection with database check
- [x] Fix Promise handling in extractor functions for proper TypeScript support
- [x] Remove old analyze_story tools and related importer interfaces
- [x] Create a simplified JSON import interface
- [x] Fix dependency issues for Vercel deployment (removed outdated @types/react-dropzone)
- [x] Fix dependency conflicts to ensure Vercel deployment works correctly
- [x] Add .npmrc file with legacy-peer-deps=true for compatibility
- [x] Add proper ESLint configuration
- [x] Update Vercel configuration for more reliable builds
- [x] Fix database schema mismatch (added missing image_url column to characters table)
- [ ] Refactor supabase-tables.ts to use more consistent naming
- [x] Complete transition from local setup to Vercel/Supabase
- [ ] Improve test coverage
- [ ] Optimize database queries for complex event relationships
- [ ] Create comprehensive documentation
- [ ] Enhance security for collaborative features

---

This roadmap is a living document and will be updated as the project evolves. Feature priorities may shift based on user feedback and development progress.

import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../../supabaseClient';
import { Event, Scene, Storyline, StructuralElement, TimelineElement } from '../../supabase-tables';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Define color map for different element types
const colorMap = {
  event: '#3498db',
  scene: '#2ecc71',
  structural_element: '#f39c12',
};

// Define different colors for storylines
const storylineColors = [
  '#e74c3c', '#9b59b6', '#1abc9c', '#f1c40f', '#34495e',
  '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#f39c12',
];

interface TimelineEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
  color?: string;
}

const TimelinePage: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'chronological' | 'narrative'>('chronological');
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [stories, setStories] = useState<{ id: string; title: string }[]>([]);
  const [storylines, setStorylines] = useState<Storyline[]>([]);
  const [showEventTypes, setShowEventTypes] = useState({
    events: true,
    scenes: true,
    structuralElements: true,
  });
  
  // Fetch stories for selection
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('id, title')
          .order('title');

        if (error) throw error;
        setStories(data || []);
        
        // Set the first story as active if none is selected
        if (data && data.length > 0 && !activeStoryId) {
          setActiveStoryId(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching stories:', error);
        setError('Failed to load stories');
      }
    };

    fetchStories();
  }, []);

  // Fetch storylines when active story changes
  useEffect(() => {
    if (!activeStoryId) return;

    const fetchStorylines = async () => {
      try {
        const { data, error } = await supabase
          .from('storylines')
          .select('*')
          .eq('story_id', activeStoryId);

        if (error) throw error;
        setStorylines(data || []);
      } catch (error) {
        console.error('Error fetching storylines:', error);
      }
    };

    fetchStorylines();
  }, [activeStoryId]);

  // Fetch timeline data
  useEffect(() => {
    if (!activeStoryId) return;
    
    const fetchTimelineData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch timeline elements
        const { data: timelineElements, error: timelineError } = await supabase
          .from('timeline_elements')
          .select('*')
          .eq('story_id', activeStoryId);
        
        if (timelineError) throw timelineError;
        if (!timelineElements) {
          setEvents([]);
          setIsLoading(false);
          return;
        }
        
        // Process timeline elements into calendar events
        const calendarEvents: TimelineEvent[] = [];
        
        for (const element of timelineElements) {
          // Skip element types that are not selected to show
          if (
            (element.element_type === 'event' && !showEventTypes.events) ||
            (element.element_type === 'scene' && !showEventTypes.scenes) ||
            (element.element_type === 'structural_element' && !showEventTypes.structuralElements)
          ) {
            continue;
          }
          
          // Fetch the actual element data based on element_type
          let elementData;
          
          switch (element.element_type) {
            case 'event':
              const { data: eventData } = await supabase
                .from('events')
                .select('*')
                .eq('id', element.element_id)
                .single();
              elementData = eventData;
              break;
            
            case 'scene':
              const { data: sceneData } = await supabase
                .from('scenes')
                .select('*')
                .eq('id', element.element_id)
                .single();
              elementData = sceneData;
              break;
              
            case 'structural_element':
              const { data: structuralData } = await supabase
                .from('structural_elements')
                .select('*')
                .eq('id', element.element_id)
                .single();
              elementData = structuralData;
              break;
          }
          
          if (!elementData) continue;
          
          // Determine display color
          let color = colorMap[element.element_type as keyof typeof colorMap] || '#95a5a6';
          
          // Check if this element belongs to any storyline
          const { data: storylineElements } = await supabase
            .from('storyline_elements')
            .select('storyline_id')
            .eq('element_id', element.element_id)
            .eq('element_type', element.element_type);
            
          if (storylineElements && storylineElements.length > 0) {
            // Use the first storyline's color for simplicity
            const storylineId = storylineElements[0].storyline_id;
            const storyline = storylines.find(sl => sl.id === storylineId);
            
            if (storyline && storyline.color) {
              color = storyline.color;
            } else {
              // Assign a color based on storyline's index in the array
              const storylineIndex = storylines.findIndex(sl => sl.id === storylineId);
              if (storylineIndex >= 0) {
                color = storylineColors[storylineIndex % storylineColors.length];
              }
            }
          }
          
          // Create event based on chronological_time or relative_time_offset
          let startTime, endTime;
          
          if (view === 'chronological') {
            if (element.chronological_time) {
              startTime = new Date(element.chronological_time);
              endTime = new Date(startTime.getTime() + 3600000); // 1 hour duration by default
            } else if (element.relative_time_offset) {
              // Create a reference point (project start date for example)
              const refPoint = new Date(2025, 0, 1); // January 1, 2025
              const offsetHours = parseFloat(element.relative_time_offset);
              startTime = new Date(refPoint.getTime() + offsetHours * 3600000);
              endTime = new Date(startTime.getTime() + 3600000);
            } else {
              // Skip items without time information in chronological view
              continue;
            }
          } else {
            // Narrative view - use story_order to determine position
            if (element.story_order !== null) {
              // Create artificial dates based on story_order
              // 1 day per story_order unit for visibility
              startTime = new Date(2025, 0, element.story_order);
              endTime = new Date(2025, 0, element.story_order + 1);
            } else {
              // Skip items without story_order in narrative view
              continue;
            }
          }
          
          calendarEvents.push({
            id: element.id,
            title: elementData.title,
            start: startTime,
            end: endTime,
            allDay: true, // For better visibility
            resource: {
              type: element.element_type,
              elementId: element.element_id,
              description: elementData.description || '',
            },
            color: color,
          });
        }
        
        setEvents(calendarEvents);
      } catch (error) {
        console.error('Error fetching timeline data:', error);
        setError('Failed to load timeline data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTimelineData();
  }, [activeStoryId, view, storylines, showEventTypes]);
  
  // Custom event component to show colored events
  const EventComponent = ({ event }: { event: TimelineEvent }) => {
    return (
      <div
        style={{
          backgroundColor: event.color,
          color: 'white',
          borderRadius: '4px',
          padding: '2px 5px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          height: '100%',
        }}
      >
        <strong>{event.title}</strong>
      </div>
    );
  };
  
  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Timeline View</h2>
          <p className="text-gray-600">
            Visualize your story's timeline in {view === 'chronological' ? 'chronological' : 'narrative'} order
          </p>
        </div>
        
        <div className="flex space-x-4">
          {/* Story selector */}
          <div>
            <label htmlFor="story-select" className="block text-sm font-medium text-gray-700 mb-1">
              Story
            </label>
            <select
              id="story-select"
              value={activeStoryId || ''}
              onChange={(e) => setActiveStoryId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {stories.map((story) => (
                <option key={story.id} value={story.id}>
                  {story.title}
                </option>
              ))}
            </select>
          </div>
          
          {/* View switcher */}
          <div>
            <label htmlFor="view-select" className="block text-sm font-medium text-gray-700 mb-1">
              View Mode
            </label>
            <select
              id="view-select"
              value={view}
              onChange={(e) => setView(e.target.value as 'chronological' | 'narrative')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="chronological">Chronological</option>
              <option value="narrative">Narrative Order</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex space-x-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="show-events"
            checked={showEventTypes.events}
            onChange={() => setShowEventTypes(prev => ({ ...prev, events: !prev.events }))}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="show-events" className="ml-2 block text-sm text-gray-900">
            Show Events
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="show-scenes"
            checked={showEventTypes.scenes}
            onChange={() => setShowEventTypes(prev => ({ ...prev, scenes: !prev.scenes }))}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="show-scenes" className="ml-2 block text-sm text-gray-900">
            Show Scenes
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="show-structural"
            checked={showEventTypes.structuralElements}
            onChange={() => setShowEventTypes(prev => ({ ...prev, structuralElements: !prev.structuralElements }))}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="show-structural" className="ml-2 block text-sm text-gray-900">
            Show Structural Elements
          </label>
        </div>
      </div>
      
      {/* Storyline Legend */}
      {storylines.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Storylines</h3>
          <div className="flex flex-wrap gap-2">
            {storylines.map((storyline, index) => (
              <div 
                key={storyline.id} 
                className="flex items-center"
              >
                <div 
                  className="w-4 h-4 mr-1 rounded-full" 
                  style={{ backgroundColor: storyline.color || storylineColors[index % storylineColors.length] }}
                ></div>
                <span className="text-sm">{storyline.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : (
        <div className="h-[800px] bg-white rounded-lg shadow">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={['month', 'week', 'day', 'agenda']}
            defaultView={view === 'chronological' ? 'week' : 'month'}
            defaultDate={events[0]?.start || new Date()}
            components={{
              event: EventComponent,
            }}
            eventPropGetter={(event) => {
              return {
                style: {
                  backgroundColor: 'transparent', // Make the default background transparent
                },
              };
            }}
          />
        </div>
      )}
    </div>
  );
};

export default TimelinePage;

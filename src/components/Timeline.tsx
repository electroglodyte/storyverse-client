import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Scene } from '../types/scene';
import { useSupabase } from '../contexts/SupabaseContext';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';

const localizer = momentLocalizer(moment);

interface TimelineEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Scene;
}

interface TimelineProps {
  storyId: string;
}

export const Timeline: React.FC<TimelineProps> = ({ storyId }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { supabase } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    fetchScenes();
  }, [storyId]);

  const fetchScenes = async () => {
    try {
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('story_id', storyId)
        .order('sequence_number', { ascending: true });

      if (error) throw error;

      // Convert scenes to timeline events
      const timelineEvents = (data || []).map((scene: Scene) => {
        // For now, we'll create arbitrary start/end dates based on sequence number
        // Later, we can add actual timeline dates to the scene schema
        const baseDate = new Date();
        baseDate.setHours(0, 0, 0, 0);
        const start = new Date(baseDate.getTime() + (scene.sequence_number * 24 * 60 * 60 * 1000));
        const end = new Date(start.getTime() + (24 * 60 * 60 * 1000));

        return {
          id: scene.id,
          title: scene.title,
          start,
          end,
          resource: scene,
        };
      });

      setEvents(timelineEvents);
    } catch (error) {
      toast.error('Failed to fetch scenes');
      console.error('Error fetching scenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: TimelineEvent) => {
    router.push(`/scenes/${event.id}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-[600px] w-full">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        onSelectEvent={handleSelectEvent}
        views={['month', 'week', 'day']}
        defaultView="month"
        toolbar={true}
        eventPropGetter={(event) => ({
          className: `status-${(event.resource as Scene).status}`,
        })}
      />
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { WritingSession, Scene, Story } from '../../supabase-tables';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Slider } from '../ui/slider';

// Form validation schema
const formSchema = z.object({
  story_id: z.string().optional(),
  scene_id: z.string().optional(),
  session_date: z.string().default(() => new Date().toISOString()),
  duration_minutes: z.number().min(1, 'Duration must be at least 1 minute').max(1440, 'Duration cannot exceed 24 hours'),
  word_count: z.number().min(0, 'Word count must be 0 or greater'),
  words_added: z.number().min(0, 'Words added must be 0 or greater'),
  words_deleted: z.number().min(0, 'Words deleted must be 0 or greater'),
  mood: z.number().min(1, 'Mood must be at least 1').max(10, 'Mood cannot exceed 10'),
  focus: z.number().min(1, 'Focus must be at least 1').max(10, 'Focus cannot exceed 10'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewSessionFormProps {
  onSessionCreated: (session: WritingSession) => void;
  onCancel: () => void;
}

export default function NewSessionForm({ onSessionCreated, onCancel }: NewSessionFormProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const supabase = useSupabaseClient();
  
  // Set up form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      session_date: new Date().toISOString(),
      duration_minutes: 30,
      word_count: 0,
      words_added: 0,
      words_deleted: 0,
      mood: 7,
      focus: 7,
      notes: '',
    },
  });
  
  // Fetch stories
  useEffect(() => {
    const fetchStories = async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('id, title, name, created_at, updated_at')
        .order('title');
        
      if (error) {
        console.error('Error fetching stories:', error);
      } else if (data) {
        setStories(data);
      }
    };
    
    fetchStories();
  }, [supabase]);
  
  // Fetch scenes for selected story
  const selectedStory = form.watch('story_id');
  
  useEffect(() => {
    if (!selectedStory) {
      setScenes([]);
      return;
    }
    
    const fetchScenes = async () => {
      const { data, error } = await supabase
        .from('scenes')
        .select('id, title, type, status, created_at, updated_at')
        .eq('story_id', selectedStory)
        .order('title');
        
      if (error) {
        console.error('Error fetching scenes:', error);
      } else if (data) {
        setScenes(data);
      }
    };
    
    fetchScenes();
  }, [supabase, selectedStory]);
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Create new session record
      const sessionData: Partial<WritingSession> = {
        story_id: values.story_id || null,
        scene_id: values.scene_id || null,
        session_date: values.session_date,
        duration_minutes: values.duration_minutes,
        word_count: values.word_count,
        words_added: values.words_added,
        words_deleted: values.words_deleted,
        mood: values.mood,
        focus: values.focus,
        notes: values.notes,
      };
      
      const { data, error } = await supabase
        .from('writing_sessions')
        .insert(sessionData)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating session:', error);
        // Handle error
      } else if (data) {
        // Update story word count if story is selected
        if (values.story_id) {
          // Get current word count
          const { data: storyData } = await supabase
            .from('stories')
            .select('word_count')
            .eq('id', values.story_id)
            .single();
          
          if (storyData) {
            const currentWordCount = storyData.word_count || 0;
            const newWordCount = currentWordCount + values.words_added - values.words_deleted;
            
            await supabase
              .from('stories')
              .update({ word_count: newWordCount })
              .eq('id', values.story_id);
          }
        }
        
        // Notify parent component
        onSessionCreated(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="story_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Story (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a story" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {stories.map((story) => (
                      <SelectItem key={story.id} value={story.id}>
                        {story.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The story you worked on during this session
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="scene_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scene (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedStory || scenes.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedStory 
                          ? "Select a story first" 
                          : scenes.length === 0 
                            ? "No scenes available" 
                            : "Select a scene"
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {scenes.map((scene) => (
                      <SelectItem key={scene.id} value={scene.id}>
                        {scene.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The specific scene you worked on
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  How long you spent writing
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="words_added"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Words Added</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  New words written
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="words_deleted"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Words Deleted</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Words removed or edited out
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="mood"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mood (1-10): {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    defaultValue={[field.value]}
                    onValueChange={(vals) => field.onChange(vals[0])}
                  />
                </FormControl>
                <FormDescription>
                  How you felt during this writing session
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="focus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Focus (1-10): {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    defaultValue={[field.value]}
                    onValueChange={(vals) => field.onChange(vals[0])}
                  />
                </FormControl>
                <FormDescription>
                  How focused you were during this session
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Session Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What you accomplished, challenges faced, etc."
                  className="resize-none h-24"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Any thoughts or reflections on this writing session
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Session'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
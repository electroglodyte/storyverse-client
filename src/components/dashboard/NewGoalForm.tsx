import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { WritingGoal, Story } from '../../supabase-tables';
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
import { Switch } from '../ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

// Form validation schema
const formSchema = z.object({
  story_id: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  goal_type: z.enum(['word_count', 'scene_count', 'time_spent', 'custom']),
  target_value: z.number().min(1, 'Target value must be at least 1'),
  time_period: z.enum(['daily', 'weekly', 'monthly', 'project']),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  is_recurring: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface NewGoalFormProps {
  onGoalCreated: (goal: WritingGoal) => void;
  onCancel: () => void;
}

// Define a type for the story data we receive from the database
interface StoryData {
  id: string;
  title: string;
}

export default function NewGoalForm({ onGoalCreated, onCancel }: NewGoalFormProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const supabase = useSupabaseClient();
  
  // Set up form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      goal_type: 'word_count',
      target_value: 500,
      time_period: 'daily',
      is_recurring: true,
    },
  });
  
  // Watch form values for conditional rendering
  const timePeriod = form.watch('time_period');
  const isRecurring = form.watch('is_recurring');
  
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
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Format dates to ISO strings
      const startDate = values.start_date ? values.start_date.toISOString() : new Date().toISOString();
      let endDate = null;
      
      if (values.end_date) {
        endDate = values.end_date.toISOString();
      } else if (values.time_period !== 'project') {
        // Set default end dates based on time period
        const end = new Date();
        switch (values.time_period) {
          case 'daily':
            end.setDate(end.getDate() + 1);
            endDate = end.toISOString();
            break;
          case 'weekly':
            end.setDate(end.getDate() + 7);
            endDate = end.toISOString();
            break;
          case 'monthly':
            end.setMonth(end.getMonth() + 1);
            endDate = end.toISOString();
            break;
        }
      }
      
      // Create goal data
      const goalData: Partial<WritingGoal> = {
        story_id: values.story_id || null,
        title: values.title,
        description: values.description || null,
        goal_type: values.goal_type,
        target_value: values.target_value,
        time_period: values.time_period,
        start_date: startDate,
        end_date: endDate,
        is_recurring: values.is_recurring,
        is_completed: false,
      };
      
      const { data, error } = await supabase
        .from('writing_goals')
        .insert(goalData)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating goal:', error);
        // Handle error
      } else if (data) {
        // Notify parent component
        onGoalCreated(data);
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
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Goal Title</FormLabel>
                <FormControl>
                  <Input placeholder="Write 500 words daily" {...field} />
                </FormControl>
                <FormDescription>
                  A clear name for your writing goal
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
                      <SelectValue placeholder="Any story" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Any story</SelectItem>
                    {stories.map((story) => (
                      <SelectItem key={story.id} value={story.id}>
                        {story.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Specific story this goal applies to
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="goal_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Goal Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="word_count">Word Count</SelectItem>
                    <SelectItem value="scene_count">Scene Count</SelectItem>
                    <SelectItem value="time_spent">Time Spent</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  What you're tracking
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="target_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Value</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  {form.watch('goal_type') === 'word_count' && 'Number of words to write'}
                  {form.watch('goal_type') === 'scene_count' && 'Number of scenes to complete'}
                  {form.watch('goal_type') === 'time_spent' && 'Minutes to spend writing'}
                  {form.watch('goal_type') === 'custom' && 'Target value to achieve'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="time_period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Period</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="project">Project (One-time)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  How often this goal repeats
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="is_recurring"
            render={({ field }) => (
              <FormItem className={`flex flex-row items-center justify-between rounded-lg border p-4 ${timePeriod === 'project' ? 'opacity-50' : ''}`}>
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Recurring Goal
                  </FormLabel>
                  <FormDescription>
                    Goal will reset each {timePeriod === 'daily' ? 'day' : timePeriod === 'weekly' ? 'week' : 'month'}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={timePeriod === 'project' ? false : field.value}
                    onCheckedChange={field.onChange}
                    disabled={timePeriod === 'project'}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Today</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When to start tracking this goal
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Select date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={(date) => {
                        // Can't select dates before start date
                        const startDate = form.getValues('start_date');
                        return startDate ? date < startDate : false;
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  {timePeriod === 'project' 
                    ? 'Target completion date' 
                    : isRecurring 
                      ? 'When to stop counting this recurring goal' 
                      : 'When this goal expires'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional details about this goal..."
                  className="resize-none h-24"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Any additional context or motivation for this goal
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
            {isSubmitting ? 'Saving...' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
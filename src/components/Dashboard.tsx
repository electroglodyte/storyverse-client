import { useState, useEffect } from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { WritingDashboard } from './dashboard/WritingDashboard'
import { DailyProgressChart } from './dashboard/DailyProgressChart'
import { SessionHistory } from './dashboard/SessionHistory'
import { GoalTracker } from './dashboard/GoalTracker'
import { transformResponse } from '@/lib/supabase'
import type { Story } from '@/types/database'
import { supabase } from '@/lib/supabase'

export function Dashboard() {
  const [stories, setStories] = useState<Story[]>([])
  const [loadingStories, setLoadingStories] = useState(true)

  useEffect(() => {
    const loadStories = async () => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        if (data) {
          setStories(data.map(story => transformResponse.transformObject(story)))
        }
      } catch (err) {
        console.error('Error loading stories:', err)
      } finally {
        setLoadingStories(false)
      }
    }

    loadStories()
  }, [])

  return (
    <div className="space-y-8">
      <TabsContent value="writing" className="space-y-4">
        <WritingDashboard stories={stories} isLoading={loadingStories} />
      </TabsContent>

      <TabsContent value="progress" className="space-y-4">
        <DailyProgressChart />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <SessionHistory className="lg:col-span-4" />
          <GoalTracker className="lg:col-span-3" />
        </div>
      </TabsContent>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataGrid } from '@/components/DataGrid'
import { supabase } from '@/lib/supabase'
import { transformResponse } from '@/lib/supabase'
import type { Story } from '@/types/database'
import { formatDate, formatTimeAgo } from '@/utils/formatters'
import { GridColDef } from '@mui/x-data-grid'

const statusColors: Record<string, string> = {
  'concept': 'bg-gray-100',
  'outline': 'bg-blue-100',
  'draft': 'bg-yellow-100',
  'revision': 'bg-green-100',
  'completed': 'bg-purple-100'
}

interface ExtendedStory extends Story {
  createdTimeAgo: string
  targetDateFormatted: string
  statusClass: string
}

interface Props {
  storyWorldId?: string
  seriesId?: string
}

export function StoryTable({ storyWorldId, seriesId }: Props) {
  const [stories, setStories] = useState<ExtendedStory[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadStories = async () => {
      try {
        let query = supabase.from('stories').select('*')

        if (storyWorldId) {
          query = query.eq('story_world_id', storyWorldId)
        }

        if (seriesId) {
          query = query.eq('series_id', seriesId)
        }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        if (data) {
          const extendedStories = data.map(story => {
            const transformed = transformResponse.transformObject(story)
            return {
              ...transformed,
              createdTimeAgo: formatTimeAgo(transformed.created_at),
              targetDateFormatted: transformed.target_date ? formatDate(transformed.target_date) : '',
              statusClass: statusColors[transformed.status || ''] || 'bg-gray-100'
            }
          })
          setStories(extendedStories)
        }
      } catch (err) {
        console.error('Error loading stories:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStories()
  }, [storyWorldId, seriesId])

  const handleStoryClick = (params: any) => {
    navigate(`/stories/${params.row.id}`)
  }

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Title',
      width: 200,
      renderCell: (params) => (
        <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
          {params.row.title}
        </span>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <span className={`px-2 py-1 rounded ${params.row.statusClass}`}>
          {params.row.status}
        </span>
      )
    },
    {
      field: 'word_count',
      headerName: 'Words',
      width: 100,
      type: 'number'
    },
    {
      field: 'target_date',
      headerName: 'Target Date',
      width: 120,
      renderCell: (params) => (
        <span>{params.row.targetDateFormatted}</span>
      )
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      renderCell: (params) => (
        <span>{params.row.createdTimeAgo}</span>
      )
    }
  ]

  return (
    <DataGrid<ExtendedStory>
      rows={stories}
      columns={columns}
      loading={loading}
      getRowId={(row) => row.id}
      onRowClick={handleStoryClick}
    />
  )
}

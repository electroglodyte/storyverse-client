import React from 'react'
import { type Series, type Story, type StoryWorld } from '@/types/database'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
import DataGrid from '@/components/DataGrid'
import { useNavigate } from 'react-router-dom'
import { timeAgo } from '@/utils/formatters'

const SeriesTable = () => {
  const [series, setSeries] = useState<Series[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchSeries()
  }, [])

  const fetchSeries = async () => {
    try {
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select(`
          *,
          stories:stories(*)
        `)
        .order('created_at', { ascending: false })

      if (seriesError) throw seriesError

      if (seriesData) {
        const enhancedSeriesData = seriesData.map(series => ({
          ...series,
          storiesCount: series.stories?.length || 0,
          createdTimeAgo: timeAgo(series.created_at)
        }))
        setSeries(enhancedSeriesData)
      }
    } catch (error) {
      console.error('Error fetching series:', error)
    }
  }

  const handleRowClick = (id: string) => {
    navigate(`/series/${id}`)
  }

  const columns = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    { field: 'storiesCount', headerName: 'Stories', width: 100 },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'createdTimeAgo', headerName: 'Created', width: 120 }
  ]

  return (
    <div className="w-full h-full">
      <DataGrid
        rows={series}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
      />
    </div>
  )
}

export default SeriesTable
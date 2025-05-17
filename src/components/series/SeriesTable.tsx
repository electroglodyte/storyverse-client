import { type Series } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { DataGrid } from '@/components/DataGrid'
import { useNavigate } from 'react-router-dom'
import { formatTimeAgo } from '@/utils/formatters'
import { GridColDef } from '@mui/x-data-grid'

interface EnhancedSeries extends Series {
  storiesCount: number;
  createdTimeAgo: string;
}

const SeriesTable = () => {
  const [series, setSeries] = useState<EnhancedSeries[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchSeries()
  }, [])

  const fetchSeries = async () => {
    setLoading(true)
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
          createdTimeAgo: formatTimeAgo(series.created_at)
        }))
        setSeries(enhancedSeriesData)
      }
    } catch (error) {
      console.error('Error fetching series:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRowClick = (params: any) => {
    navigate(`/series/${params.row.id}`)
  }

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    { field: 'storiesCount', headerName: 'Stories', width: 100, type: 'number' },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'createdTimeAgo', headerName: 'Created', width: 120 }
  ]

  return (
    <div className="w-full h-full">
      <DataGrid<EnhancedSeries>
        rows={series}
        columns={columns}
        loading={loading}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
      />
    </div>
  )
}

export default SeriesTable

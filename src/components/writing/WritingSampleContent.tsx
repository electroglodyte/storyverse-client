import { useEffect, useState } from 'react'
import type { WritingSample } from '@/types/database'
import { transformResponse } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

interface Props {
  sampleId: string
}

export const WritingSampleContent: React.FC<Props> = ({ sampleId }) => {
  const [sample, setSample] = useState<WritingSample | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSample = async () => {
      try {
        const { data, error } = await supabase
          .from('writing_samples')
          .select('*')
          .eq('id', sampleId)
          .single()

        if (error) {
          throw error
        }

        if (data) {
          setSample(transformResponse.transformObject(data))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred loading the sample')
      } finally {
        setLoading(false)
      }
    }

    loadSample()
  }, [sampleId])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!sample) {
    return <div>No sample found</div>
  }

  return (
    <div>
      <h2>{sample.title}</h2>
      {sample.author && <p>By {sample.author}</p>}
      {sample.content && (
        <div className="writing-sample">
          {sample.content}
        </div>
      )}
    </div>
  )
}

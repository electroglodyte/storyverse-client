import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaArrowLeft, FaUndo } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { SceneVersion } from '../../supabase-tables';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
}

const SceneVersionCompare: React.FC = () => {
  const { id, version1Id, version2Id } = useParams<{ 
    id: string;
    version1Id: string;
    version2Id: string;
  }>();
  
  const [oldVersion, setOldVersion] = useState<SceneVersion | null>(null);
  const [newVersion, setNewVersion] = useState<SceneVersion | null>(null);
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchVersions = async () => {
      if (!id || !version1Id || !version2Id) return;
      
      try {
        setLoading(true);
        
        // Fetch both versions
        const { data: versions, error } = await supabase
          .from('scene_versions')
          .select('*')
          .in('id', [version1Id, version2Id]);
        
        if (error) throw error;
        
        if (!versions || versions.length !== 2) {
          throw new Error('Could not find both versions');
        }
        
        // Determine which is newer based on version_number
        const [v1, v2] = versions.sort((a, b) => a.version_number - b.version_number);
        setOldVersion(v1);
        setNewVersion(v2);
        
        // Generate diff
        generateDiff(v1.content, v2.content);
        
      } catch (error) {
        console.error('Error fetching versions:', error);
        toast.error('Failed to load versions for comparison');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVersions();
  }, [id, version1Id, version2Id]);
  
  // Simple diff algorithm (line by line)
  const generateDiff = (oldText: string, newText: string) => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const result: DiffLine[] = [];
    
    let oldIndex = 0;
    let newIndex = 0;
    
    // Simple line-by-line comparison
    // This is a basic implementation; a real app might use a more sophisticated diff algorithm
    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      if (oldIndex >= oldLines.length) {
        // All remaining lines in new are added
        result.push({
          type: 'added',
          content: newLines[newIndex],
          lineNumber: newIndex + 1
        });
        newIndex++;
      } else if (newIndex >= newLines.length) {
        // All remaining lines in old are removed
        result.push({
          type: 'removed',
          content: oldLines[oldIndex],
          lineNumber: oldIndex + 1
        });
        oldIndex++;
      } else if (oldLines[oldIndex] === newLines[newIndex]) {
        // Lines are the same
        result.push({
          type: 'unchanged',
          content: oldLines[oldIndex],
          lineNumber: oldIndex + 1
        });
        oldIndex++;
        newIndex++;
      } else {
        // Lines are different
        result.push({
          type: 'removed',
          content: oldLines[oldIndex],
          lineNumber: oldIndex + 1
        });
        result.push({
          type: 'added',
          content: newLines[newIndex],
          lineNumber: newIndex + 1
        });
        oldIndex++;
        newIndex++;
      }
    }
    
    setDiffLines(result);
  };
  
  const handleRestoreVersion = async (version: SceneVersion) => {
    if (!version || !id) return;
    
    try {
      setIsRestoring(true);
      
      // Update the scene content
      const { error: updateError } = await supabase
        .from('scenes')
        .update({ content: version.content })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Get the latest version number
      const { data: versions, error: versionError } = await supabase
        .from('scene_versions')
        .select('version_number')
        .eq('scene_id', id)
        .order('version_number', { ascending: false })
        .limit(1);
      
      if (versionError) throw versionError;
      
      const nextVersionNumber = versions && versions.length > 0 
        ? versions[0].version_number + 1 
        : 1;
      
      // Create a new version that records this restoration
      const { error: newVersionError } = await supabase
        .from('scene_versions')
        .insert({
          scene_id: id,
          content: version.content,
          version_number: nextVersionNumber,
          notes: `Restored from version ${version.version_number}`,
        });
      
      if (newVersionError) throw newVersionError;
      
      toast.success(`Restored to version ${version.version_number}`);
      
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    } finally {
      setIsRestoring(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }
  
  if (!oldVersion || !newVersion) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-red-600 mb-4">Error: Could not find the specified versions.</p>
          <Link to={`/scenes/${id}/versions`} className="btn btn-primary">
            Back to Version History
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link to={`/scenes/${id}/versions`} className="btn btn-ghost mr-4">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">
            Compare Versions
          </h1>
        </div>
        <div className="flex space-x-2">
          <button 
            className="btn btn-outline btn-warning flex items-center"
            onClick={() => handleRestoreVersion(oldVersion)}
            disabled={isRestoring}
          >
            <FaUndo className="mr-2" /> Restore Older Version
          </button>
          <button 
            className="btn btn-outline btn-success flex items-center"
            onClick={() => handleRestoreVersion(newVersion)}
            disabled={isRestoring}
          >
            <FaUndo className="mr-2" /> Restore Newer Version
          </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Version {oldVersion.version_number}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Created: {new Date(oldVersion.created_at).toLocaleString()}
              {oldVersion.notes && <span className="block mt-1">Notes: {oldVersion.notes}</span>}
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Version {newVersion.version_number}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Created: {new Date(newVersion.created_at).toLocaleString()}
              {newVersion.notes && <span className="block mt-1">Notes: {newVersion.notes}</span>}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow overflow-auto">
        <pre className="font-mono text-sm">
          {diffLines.map((line, index) => (
            <div 
              key={index} 
              className={`py-1 ${
                line.type === 'added' ? 'bg-green-100 text-green-800' :
                line.type === 'removed' ? 'bg-red-100 text-red-800' : ''
              }`}
            >
              <span className="inline-block w-8 text-gray-400 select-none">
                {line.lineNumber}
              </span>
              <span className="inline-block w-4 text-gray-400 select-none">
                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
              </span>
              {line.content}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};

export default SceneVersionCompare;
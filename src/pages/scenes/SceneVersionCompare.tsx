import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaArrowLeft, FaUndo, FaExchangeAlt, FaEdit, FaDownload, FaTimes, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { SceneVersion } from '../../supabase-tables';
import { getTextDiff } from '../../utils/formatters';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
}

// Function to calculate the percentage of changes
const calculateChangePercentage = (diffLines: DiffLine[]) => {
  const added = diffLines.filter(line => line.type === 'added').length;
  const removed = diffLines.filter(line => line.type === 'removed').length;
  const unchanged = diffLines.filter(line => line.type === 'unchanged').length;
  
  const totalChanges = added + removed;
  const totalLines = totalChanges + unchanged;
  
  return totalLines > 0 ? Math.round((totalChanges / totalLines) * 100) : 0;
};

const SceneVersionCompare: React.FC = () => {
  const { id, version1Id, version2Id } = useParams<{ 
    id: string;
    version1Id: string;
    version2Id: string;
  }>();
  const navigate = useNavigate();
  
  const [oldVersion, setOldVersion] = useState<SceneVersion | null>(null);
  const [newVersion, setNewVersion] = useState<SceneVersion | null>(null);
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [sceneTitle, setSceneTitle] = useState<string>('');
  const [lineNumbers, setLineNumbers] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [changePercentage, setChangePercentage] = useState<number>(0);
  
  useEffect(() => {
    const fetchVersions = async () => {
      if (!id || !version1Id || !version2Id) return;
      
      try {
        setLoading(true);
        
        // Fetch scene title
        const { data: sceneData, error: sceneError } = await supabase
          .from('scenes')
          .select('title')
          .eq('id', id)
          .single();
        
        if (!sceneError && sceneData) {
          setSceneTitle(sceneData.title);
        }
        
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
        const diff = getTextDiff(v1.content, v2.content);
        setDiffLines(diff);
        
        // Calculate change percentage
        setChangePercentage(calculateChangePercentage(diff));
        
      } catch (error) {
        console.error('Error fetching versions:', error);
        toast.error('Failed to load versions for comparison');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVersions();
  }, [id, version1Id, version2Id]);
  
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
      navigate(`/scenes/${id}`);
      
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    } finally {
      setIsRestoring(false);
    }
  };
  
  // Generate a unified diff for download
  const generateUnifiedDiff = () => {
    if (!oldVersion || !newVersion) return '';
    
    let output = `--- Scene: ${sceneTitle} (Version ${oldVersion.version_number})\n`;
    output += `+++ Scene: ${sceneTitle} (Version ${newVersion.version_number})\n\n`;
    
    diffLines.forEach(line => {
      if (line.type === 'added') {
        output += `+ ${line.content}\n`;
      } else if (line.type === 'removed') {
        output += `- ${line.content}\n`;
      } else {
        output += `  ${line.content}\n`;
      }
    });
    
    return output;
  };
  
  // Download the diff
  const downloadDiff = () => {
    const diffText = generateUnifiedDiff();
    const blob = new Blob([diffText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `scene-${id}-diff-v${oldVersion?.version_number}-v${newVersion?.version_number}.diff`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
  
  // Split the diffLines for side-by-side view
  const oldLines = diffLines.filter(line => line.type !== 'added');
  const newLines = diffLines.filter(line => line.type !== 'removed');
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Link to={`/scenes/${id}/versions`} className="btn btn-ghost mr-4">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">
            Compare Versions: {sceneTitle}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Link to={`/scenes/${id}`} className="btn btn-outline btn-primary">
            <FaEdit className="mr-2" /> Edit Scene
          </Link>
          <button 
            className="btn btn-outline btn-secondary"
            onClick={downloadDiff}
          >
            <FaDownload className="mr-2" /> Download Diff
          </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Version {oldVersion.version_number}
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              Created: {new Date(oldVersion.created_at).toLocaleString()}
              {oldVersion.notes && <span className="block mt-1">Notes: {oldVersion.notes}</span>}
            </p>
            <button 
              className="btn btn-sm btn-outline btn-warning"
              onClick={() => handleRestoreVersion(oldVersion)}
              disabled={isRestoring}
            >
              <FaUndo className="mr-2" /> Restore This Version
            </button>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Version {newVersion.version_number}
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              Created: {new Date(newVersion.created_at).toLocaleString()}
              {newVersion.notes && <span className="block mt-1">Notes: {newVersion.notes}</span>}
            </p>
            <button 
              className="btn btn-sm btn-outline btn-success"
              onClick={() => handleRestoreVersion(newVersion)}
              disabled={isRestoring}
            >
              <FaUndo className="mr-2" /> Restore This Version
            </button>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Changes</div>
              <div className="stat-value text-primary">{changePercentage}%</div>
              <div className="stat-desc">
                {diffLines.filter(line => line.type === 'added').length} added, {diffLines.filter(line => line.type === 'removed').length} removed
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text mr-2">Line Numbers</span>
                <input
                  type="checkbox"
                  className="toggle toggle-sm"
                  checked={lineNumbers}
                  onChange={() => setLineNumbers(!lineNumbers)}
                />
              </label>
            </div>
            
            <div className="btn-group">
              <button 
                className={`btn btn-sm ${viewMode === 'side-by-side' ? 'btn-active' : ''}`}
                onClick={() => setViewMode('side-by-side')}
              >
                Split
              </button>
              <button 
                className={`btn btn-sm ${viewMode === 'unified' ? 'btn-active' : ''}`}
                onClick={() => setViewMode('unified')}
              >
                Unified
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {viewMode === 'side-by-side' ? (
        // Side-by-side diff view
        <div className="bg-white p-6 rounded-lg shadow overflow-auto">
          <div className="grid grid-cols-2 gap-0 border rounded overflow-hidden">
            <div className="border-r">
              <div className="bg-gray-100 font-bold p-2 border-b text-center">
                Version {oldVersion.version_number}
              </div>
              <div className="p-0 overflow-auto max-h-[70vh]">
                <pre className="font-mono text-sm">
                  {oldLines.map((line, index) => (
                    <div 
                      key={`old-${index}`} 
                      className={`py-1 px-2 ${
                        line.type === 'removed' ? 'bg-red-100 text-red-800' : ''
                      }`}
                    >
                      {lineNumbers && (
                        <span className="inline-block w-8 text-gray-400 select-none">
                          {line.lineNumber}
                        </span>
                      )}
                      <span className="inline-block w-4 text-gray-400 select-none">
                        {line.type === 'removed' ? '-' : ' '}
                      </span>
                      {line.content}
                    </div>
                  ))}
                </pre>
              </div>
            </div>
            <div>
              <div className="bg-gray-100 font-bold p-2 border-b text-center">
                Version {newVersion.version_number}
              </div>
              <div className="p-0 overflow-auto max-h-[70vh]">
                <pre className="font-mono text-sm">
                  {newLines.map((line, index) => (
                    <div 
                      key={`new-${index}`} 
                      className={`py-1 px-2 ${
                        line.type === 'added' ? 'bg-green-100 text-green-800' : ''
                      }`}
                    >
                      {lineNumbers && (
                        <span className="inline-block w-8 text-gray-400 select-none">
                          {line.lineNumber}
                        </span>
                      )}
                      <span className="inline-block w-4 text-gray-400 select-none">
                        {line.type === 'added' ? '+' : ' '}
                      </span>
                      {line.content}
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Unified diff view
        <div className="bg-white p-6 rounded-lg shadow overflow-auto">
          <div className="border rounded overflow-hidden">
            <div className="bg-gray-100 font-bold p-2 border-b">
              Unified Diff
            </div>
            <div className="p-0 overflow-auto max-h-[70vh]">
              <pre className="font-mono text-sm">
                {diffLines.map((line, index) => (
                  <div 
                    key={index} 
                    className={`py-1 px-2 ${
                      line.type === 'added' ? 'bg-green-100 text-green-800' : 
                      line.type === 'removed' ? 'bg-red-100 text-red-800' : ''
                    }`}
                  >
                    {lineNumbers && (
                      <span className="inline-block w-8 text-gray-400 select-none">
                        {line.lineNumber}
                      </span>
                    )}
                    <span className="inline-block w-4 text-gray-600 select-none font-bold">
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    {line.content}
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4 flex justify-end">
        <Link to={`/scenes/${id}`} className="btn btn-outline">
          Back to Scene
        </Link>
      </div>
    </div>
  );
};

export default SceneVersionCompare;
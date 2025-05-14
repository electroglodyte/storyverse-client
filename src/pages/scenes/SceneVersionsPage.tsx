import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaArrowLeft, FaHistory, FaExchangeAlt, FaUndo, FaEdit, FaEye, FaCodeBranch, FaCalendarAlt, FaList, FaInfoCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Scene, SceneVersion } from '../../supabase-tables';
import { format, formatDistanceToNow } from 'date-fns';

// Get user-friendly time format
const getTimeAgo = (date: string): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

const SceneVersionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [scene, setScene] = useState<Scene | null>(null);
  const [versions, setVersions] = useState<SceneVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [viewVersion, setViewVersion] = useState<SceneVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline');
  const [showVersionDetails, setShowVersionDetails] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchSceneAndVersions = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch the scene
        const { data: sceneData, error: sceneError } = await supabase
          .from('scenes')
          .select('*')
          .eq('id', id)
          .single();
        
        if (sceneError) throw sceneError;
        setScene(sceneData);
        
        // Fetch all versions
        const { data: versionsData, error: versionsError } = await supabase
          .from('scene_versions')
          .select('*')
          .eq('scene_id', id)
          .order('version_number', { ascending: false });
        
        if (versionsError) throw versionsError;
        setVersions(versionsData || []);
        
      } catch (error) {
        console.error('Error fetching scene versions:', error);
        toast.error('Failed to load scene versions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSceneAndVersions();
  }, [id]);
  
  const handleVersionSelection = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      // Remove from selection
      setSelectedVersions(prev => prev.filter(id => id !== versionId));
    } else {
      // Add to selection (maximum 2)
      if (selectedVersions.length < 2) {
        setSelectedVersions(prev => [...prev, versionId]);
      } else {
        // Replace the oldest selection
        setSelectedVersions(prev => [prev[1], versionId]);
      }
    }
  };
  
  const handleViewVersion = (version: SceneVersion) => {
    setViewVersion(version);
  };
  
  const handleCompareVersions = () => {
    if (selectedVersions.length !== 2) {
      toast.error('Please select exactly two versions to compare');
      return;
    }
    
    navigate(`/scenes/${id}/compare/${selectedVersions[0]}/${selectedVersions[1]}`);
  };
  
  const handleRestoreVersion = async (version: SceneVersion) => {
    if (!scene || !version) return;
    
    try {
      setIsRestoring(true);
      
      // Update the scene content
      const { error: updateError } = await supabase
        .from('scenes')
        .update({ content: version.content })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Create a new version that records this restoration
      const { error: versionError } = await supabase
        .from('scene_versions')
        .insert({
          scene_id: id,
          content: version.content,
          version_number: versions.length > 0 ? versions[0].version_number + 1 : 1,
          notes: `Restored from version ${version.version_number}`,
        });
      
      if (versionError) throw versionError;
      
      toast.success(`Restored to version ${version.version_number}`);
      navigate(`/scenes/${id}`);
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    } finally {
      setIsRestoring(false);
    }
  };
  
  // Timeline visualization of versions
  const renderTimeline = () => {
    return (
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute h-full w-0.5 bg-gray-300 left-6 top-0 z-0"></div>
        
        {/* Version timeline items */}
        <div className="space-y-8 relative z-10">
          {versions.map((version, index) => (
            <div key={version.id} className="flex items-start relative">
              {/* Timeline indicator */}
              <div 
                className={`flex items-center justify-center w-12 h-12 rounded-full border-4 z-10 ${
                  index === 0 ? 'bg-green-100 border-green-500' : 
                  'bg-blue-100 border-blue-400'
                } flex-shrink-0`}
              >
                <FaHistory className={index === 0 ? 'text-green-600' : 'text-blue-600'} />
              </div>
              
              {/* Version details card */}
              <div className="ml-4 flex-1">
                <div 
                  className={`border rounded-lg shadow-sm p-4 ${
                    selectedVersions.includes(version.id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center">
                        Version {version.version_number}
                        {index === 0 && (
                          <span className="ml-2 badge badge-success">Current</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {getTimeAgo(version.created_at)} 
                        <span className="mx-1">•</span>
                        {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    
                    <div className="flex space-x-1">
                      <div className="tooltip tooltip-left" data-tip="Select for comparison">
                        <input 
                          type="checkbox" 
                          className="checkbox checkbox-sm"
                          checked={selectedVersions.includes(version.id)}
                          onChange={() => handleVersionSelection(version.id)}
                        />
                      </div>
                      <button 
                        className="btn btn-sm btn-ghost text-blue-600"
                        onClick={() => handleViewVersion(version)}
                      >
                        <FaEye />
                      </button>
                      <button 
                        className="btn btn-sm btn-ghost text-amber-600"
                        onClick={() => handleRestoreVersion(version)}
                        disabled={isRestoring || index === 0}
                      >
                        <FaUndo />
                      </button>
                      <button 
                        className="btn btn-sm btn-ghost text-gray-600"
                        onClick={() => setShowVersionDetails(showVersionDetails === version.id ? null : version.id)}
                      >
                        <FaInfoCircle />
                      </button>
                    </div>
                  </div>
                  
                  {version.notes && (
                    <div className="mt-2 text-gray-700">
                      <p>{version.notes}</p>
                    </div>
                  )}
                  
                  {showVersionDetails === version.id && (
                    <div className="mt-3 pt-3 border-t text-sm">
                      <div className="bg-gray-100 p-3 rounded font-mono overflow-auto max-h-60">
                        <pre className="whitespace-pre-wrap">
                          {version.content.length > 500 
                            ? version.content.substring(0, 500) + '...' 
                            : version.content}
                        </pre>
                      </div>
                      {version.content.length > 500 && (
                        <div className="text-center mt-2">
                          <button 
                            className="btn btn-xs btn-outline"
                            onClick={() => handleViewVersion(version)}
                          >
                            View Full Content
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }
  
  // Determine if we're viewing a specific version
  if (viewVersion) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button onClick={() => setViewVersion(null)} className="btn btn-ghost mr-4">
              <FaArrowLeft />
            </button>
            <h1 className="text-2xl font-bold">
              Version {viewVersion.version_number}
              {viewVersion.notes && `: ${viewVersion.notes}`}
            </h1>
          </div>
          <div className="flex space-x-2">
            <button 
              className="btn btn-primary flex items-center"
              onClick={() => handleRestoreVersion(viewVersion)}
              disabled={isRestoring || (versions.length > 0 && viewVersion.version_number === versions[0].version_number)}
            >
              <FaUndo className="mr-2" /> {isRestoring ? 'Restoring...' : 'Restore This Version'}
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4 text-sm text-gray-500">
            Created on {new Date(viewVersion.created_at).toLocaleString()}
          </div>
          <div className="bg-gray-50 p-4 rounded border font-mono whitespace-pre-wrap overflow-auto max-h-[70vh]">
            {viewVersion.content}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link to={`/scenes/${id}`} className="btn btn-ghost mr-4">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">
            Version History: {scene?.title}
          </h1>
        </div>
        <div className="flex space-x-2">
          <div className="btn-group">
            <button 
              className={`btn btn-sm ${viewMode === 'timeline' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              <FaCalendarAlt className="mr-1" /> Timeline
            </button>
            <button 
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <FaList className="mr-1" /> List
            </button>
          </div>
          
          {selectedVersions.length === 2 && (
            <button 
              className="btn btn-secondary flex items-center"
              onClick={handleCompareVersions}
            >
              <FaExchangeAlt className="mr-2" /> Compare Selected
            </button>
          )}
          
          <Link to={`/scenes/${id}`} className="btn btn-primary flex items-center">
            <FaEdit className="mr-2" /> Edit Scene
          </Link>
        </div>
      </div>
      
      {versions.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-600 mb-4">No version history found for this scene.</p>
          <Link to={`/scenes/${id}`} className="btn btn-primary">
            Back to Scene
          </Link>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          {viewMode === 'timeline' ? (
            renderTimeline()
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Version</th>
                    <th>Created</th>
                    <th>Notes</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((version) => (
                    <tr key={version.id} className={`hover:bg-gray-50 ${
                      selectedVersions.includes(version.id) ? 'bg-blue-50' : ''
                    }`}>
                      <td>
                        <input 
                          type="checkbox" 
                          className="checkbox"
                          checked={selectedVersions.includes(version.id)}
                          onChange={() => handleVersionSelection(version.id)}
                        />
                      </td>
                      <td>
                        <span className="font-medium">v{version.version_number}</span>
                        {version === versions[0] && (
                          <span className="ml-2 badge badge-sm badge-success">Current</span>
                        )}
                      </td>
                      <td>
                        <div>{format(new Date(version.created_at), 'MMM d, yyyy')}</div>
                        <div className="text-xs text-gray-500">{format(new Date(version.created_at), 'h:mm a')}</div>
                      </td>
                      <td>
                        {version.notes || <span className="text-gray-400">No notes</span>}
                      </td>
                      <td>
                        {version.created_by || <span className="text-gray-400">System</span>}
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewVersion(version)}
                            className="btn btn-sm btn-ghost text-blue-600"
                            title="View version"
                          >
                            <FaEye />
                          </button>
                          <button 
                            onClick={() => handleRestoreVersion(version)}
                            className="btn btn-sm btn-ghost text-amber-600"
                            disabled={isRestoring || version === versions[0]}
                            title="Restore version"
                          >
                            <FaUndo />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {selectedVersions.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-semibold">Selected versions: </span>
              {selectedVersions.map(id => {
                const version = versions.find(v => v.id === id);
                return version ? `v${version.version_number}` : '';
              }).join(' and ')}
            </div>
            
            {selectedVersions.length === 2 && (
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleCompareVersions}
              >
                <FaExchangeAlt className="mr-2" /> Compare Selected
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SceneVersionsPage;
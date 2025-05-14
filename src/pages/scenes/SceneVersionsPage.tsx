import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaArrowLeft, FaHistory, FaExchangeAlt, FaUndo, FaEdit, FaEye, FaCode } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Scene, SceneVersion } from '../../supabase-tables';

const SceneVersionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [scene, setScene] = useState<Scene | null>(null);
  const [versions, setVersions] = useState<SceneVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [viewVersion, setViewVersion] = useState<SceneVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  
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
              disabled={isRestoring}
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
                  <tr key={version.id} className="hover:bg-gray-50">
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
                    </td>
                    <td>{new Date(version.created_at).toLocaleString()}</td>
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
                        >
                          <FaEye />
                        </button>
                        <button 
                          onClick={() => handleRestoreVersion(version)}
                          className="btn btn-sm btn-ghost text-amber-600"
                          disabled={isRestoring}
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
        </div>
      )}
    </div>
  );
};

export default SceneVersionsPage;
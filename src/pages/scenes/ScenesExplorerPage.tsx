import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaEdit, FaTrash, FaHistory, FaComments, FaEye, FaPlus, FaFilter, FaSort, FaFileImport, FaFileExport } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Scene } from '../../supabase-tables';
import SceneNav from '../../components/scenes/SceneNav';

const ScenesExplorerPage: React.FC = () => {
  const [scenes, setScenes] = useState<(Scene & { commentCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [filterVisible, setFilterVisible] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('sequence_number');
  const [sortDirection, setSortDirection] = useState<string>('asc');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScenes = async () => {
      try {
        setLoading(true);
        
        // Fetch scenes with filters
        let query = supabase
          .from('scenes')
          .select(`
            *,
            scene_comments(count)
          `);

        // Apply filters
        if (filterType !== 'all') {
          query = query.eq('type', filterType);
        }
        
        if (filterFormat !== 'all') {
          query = query.eq('format', filterFormat);
        }
        
        if (filterVisible !== 'all') {
          query = query.eq('is_visible', filterVisible === 'visible');
        }

        // Apply sorting
        query = query.order(sortField, { ascending: sortDirection === 'asc' });

        const { data, error } = await query;

        if (error) throw error;

        // Process the data to include comment counts
        const processedData = data.map(scene => ({
          ...scene,
          commentCount: scene.scene_comments?.[0]?.count || 0
        }));

        setScenes(processedData);
      } catch (error) {
        console.error('Error fetching scenes:', error);
        setError('Failed to load scenes. Please try again later.');
        toast.error('Failed to load scenes');
      } finally {
        setLoading(false);
      }
    };

    fetchScenes();
  }, [filterType, filterFormat, filterVisible, sortField, sortDirection]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this scene? This action cannot be undone.')) {
      try {
        const { error } = await supabase.from('scenes').delete().eq('id', id);
        
        if (error) throw error;
        
        setScenes(scenes.filter(scene => scene.id !== id));
        toast.success('Scene deleted successfully');
      } catch (error) {
        console.error('Error deleting scene:', error);
        toast.error('Failed to delete scene');
      }
    }
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Add SceneNav component */}
      <SceneNav />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Scene Explorer</h1>
        <div className="flex space-x-2">
          <Link to="/scenes/import" className="btn btn-primary flex items-center">
            <FaFileImport className="mr-2" /> Import
          </Link>
          <Link to="/scenes/new" className="btn btn-primary flex items-center">
            <FaPlus className="mr-2" /> Create New Scene
          </Link>
          <Link to="/scenes/export" className="btn btn-secondary flex items-center">
            <FaFileExport className="mr-2" /> Export
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <label className="mr-2 font-medium"><FaFilter className="inline mr-1" /> Type:</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="select select-bordered w-40"
            >
              <option value="all">All Types</option>
              <option value="scene">Scene</option>
              <option value="chapter">Chapter</option>
              <option value="outline_element">Outline Element</option>
              <option value="summary">Summary</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="mr-2 font-medium">Format:</label>
            <select 
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="select select-bordered w-40"
            >
              <option value="all">All Formats</option>
              <option value="plain">Plain Text</option>
              <option value="fountain">Fountain</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="mr-2 font-medium">Visibility:</label>
            <select 
              value={filterVisible}
              onChange={(e) => setFilterVisible(e.target.value)}
              className="select select-bordered w-40"
            >
              <option value="all">All</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scenes List */}
      {loading ? (
        <div className="flex justify-center my-8">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : scenes.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <h3 className="text-xl font-semibold mb-4">No scenes found</h3>
          <p className="mb-4">Get started by creating your first scene or importing existing content.</p>
          <div className="flex justify-center gap-4">
            <Link to="/scenes/new" className="btn btn-primary">
              <FaPlus className="mr-2" /> Create New Scene
            </Link>
            <Link to="/scenes/import" className="btn btn-secondary">
              <FaFileImport className="mr-2" /> Import Content
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th 
                  className="cursor-pointer" 
                  onClick={() => toggleSort('sequence_number')}
                >
                  <div className="flex items-center">
                    # 
                    {sortField === 'sequence_number' && (
                      <FaSort className="ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="cursor-pointer" 
                  onClick={() => toggleSort('title')}
                >
                  <div className="flex items-center">
                    Title
                    {sortField === 'title' && (
                      <FaSort className="ml-1" />
                    )}
                  </div>
                </th>
                <th>Type</th>
                <th>Format</th>
                <th 
                  className="cursor-pointer"
                  onClick={() => toggleSort('updated_at')}
                >
                  <div className="flex items-center">
                    Last Updated
                    {sortField === 'updated_at' && (
                      <FaSort className="ml-1" />
                    )}
                  </div>
                </th>
                <th>Comments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map((scene) => (
                <tr key={scene.id} className="hover:bg-gray-50">
                  <td>{scene.sequence_number || '-'}</td>
                  <td>
                    <Link to={`/scenes/${scene.id}`} className="font-medium text-blue-600 hover:underline">
                      {scene.title}
                    </Link>
                  </td>
                  <td>
                    <span className="badge badge-sm">
                      {scene.type === 'scene' ? 'Scene' : 
                       scene.type === 'chapter' ? 'Chapter' :
                       scene.type === 'outline_element' ? 'Outline' : 
                       scene.type === 'summary' ? 'Summary' : scene.type}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-outline badge-sm">
                      {scene.format === 'plain' ? 'Plain Text' :
                       scene.format === 'fountain' ? 'Fountain' :
                       scene.format === 'markdown' ? 'Markdown' : scene.format}
                    </span>
                  </td>
                  <td>{new Date(scene.updated_at).toLocaleString()}</td>
                  <td>
                    {scene.commentCount > 0 ? (
                      <span className="badge badge-warning badge-sm">
                        {scene.commentCount}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <Link to={`/scenes/${scene.id}`} className="btn btn-sm btn-ghost text-blue-600">
                        <FaEye />
                      </Link>
                      <Link to={`/scenes/edit/${scene.id}`} className="btn btn-sm btn-ghost text-green-600">
                        <FaEdit />
                      </Link>
                      <Link to={`/scenes/${scene.id}/versions`} className="btn btn-sm btn-ghost text-purple-600">
                        <FaHistory />
                      </Link>
                      <Link to={`/scenes/${scene.id}/comments`} className="btn btn-sm btn-ghost text-amber-600">
                        <FaComments />
                      </Link>
                      <button 
                        onClick={() => handleDelete(scene.id)} 
                        className="btn btn-sm btn-ghost text-red-600"
                      >
                        <FaTrash />
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
  );
};

export default ScenesExplorerPage;
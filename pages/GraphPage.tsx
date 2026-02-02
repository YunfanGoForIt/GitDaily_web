import React, { useState, useMemo, useEffect } from 'react';
import { ZoomIn, ZoomOut, MoreHorizontal, Search, Home, X, GitBranch, CheckCircle } from 'lucide-react';
import GraphRenderer from '../components/GraphRenderer';
import { Task, Branch, TimeGranularity } from '../types';
import branchAddIcon from '../private_icons/branch_add.svg';

interface GraphPageProps {
  tasks: Task[];
  branches: Branch[];
  onTaskClick: (task: Task) => void;
  onNewBranch: () => void;
  onBranchClick: (branchId: string) => void;
  branchSpacing: number;
  granularity: TimeGranularity;
  setGranularity: (g: TimeGranularity) => void;
}

const GraphPage: React.FC<GraphPageProps> = ({ tasks, branches, onTaskClick, onNewBranch, onBranchClick, branchSpacing, granularity, setGranularity }) => {
  const [scale, setScale] = useState(1);
  const [showGranularityMenu, setShowGranularityMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle ESC key to close search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSearch) {
          setShowSearch(false);
          setSearchQuery('');
        }
        if (showGranularityMenu) {
          setShowGranularityMenu(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch, showGranularityMenu]);

  // Show active AND merged branches. Only hide archived ones.
  const visibleBranches = branches.filter(b => b.status !== 'archived');

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { branches: [], tasks: [] };

    const query = searchQuery.toLowerCase();
    const matchedBranches = visibleBranches.filter(b =>
      b.name.toLowerCase().includes(query) ||
      b.description?.toLowerCase().includes(query)
    );
    const matchedTasks = tasks.filter(t =>
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );

    return { branches: matchedBranches, tasks: matchedTasks };
  }, [searchQuery, visibleBranches, tasks]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.6));

  const handleHome = () => {
      setScale(1.0);
      setTimeout(() => {
          const todayEl = document.getElementById('today-marker');
          if (todayEl) {
              todayEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          }
      }, 100);
  };

  const handleResultClick = (type: 'branch' | 'task', id: string) => {
    setShowSearch(false);
    setSearchQuery('');
    if (type === 'branch') {
      onBranchClick(id);
    } else {
      const task = tasks.find(t => t.id === id);
      if (task) onTaskClick(task);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex justify-between items-center shadow-sm sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="bg-slate-900 text-white p-1 rounded">
             <span className="font-bold text-lg">Git</span>
          </div>
          <span className="font-bold text-lg text-slate-800">Graph</span>
        </div>
        <div className="flex items-center space-x-3">
            <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            >
                <Search size={20} />
            </button>
            <div className="relative">
                <button 
                    onClick={() => setShowGranularityMenu(!showGranularityMenu)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full flex items-center bg-gray-50"
                >
                    <span className="text-xs font-semibold mr-1 text-gray-600 hidden md:block">{granularity}</span>
                    <MoreHorizontal size={20} />
                </button>
                {/* Dropdown for Granularity */}
                {showGranularityMenu && (
                    <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowGranularityMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {Object.values(TimeGranularity).map((g) => (
                            <button
                                key={g}
                                onClick={() => { setGranularity(g); setShowGranularityMenu(false); }}
                                className={`block w-full text-left px-4 py-2 text-sm ${granularity === g ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                    </>
                )}
            </div>
        </div>
      </div>

      {/* Main Content: Graph Canvas */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative no-scrollbar bg-slate-50">
        {/* Branch Labels (Sticky Top within scroll) */}
        {/* On mobile: left aligned. On desktop: center aligned (md:justify-center) */}
        <div className="sticky top-0 z-30 flex md:justify-center pl-12 md:pl-0 pt-2 pb-2 bg-slate-50/90 backdrop-blur-sm border-b border-gray-200 overflow-x-auto no-scrollbar">
             {visibleBranches.filter(b => b.id !== 'main').map(b => (
                 <button 
                    key={b.id} 
                    onClick={() => onBranchClick(b.id)}
                    className={`text-xs font-bold mr-4 px-3 py-1.5 rounded-full text-white whitespace-nowrap shadow-sm hover:opacity-90 active:scale-95 transition-all ${b.status === 'merged' ? 'opacity-50 grayscale' : ''}`} 
                    style={{backgroundColor: b.color}}
                 >
                     {b.name} {b.status === 'merged' && '(Merged)'}
                 </button>
             ))}
        </div>

        <div className="p-4 pb-24">
            <GraphRenderer 
                branches={visibleBranches}
                tasks={tasks}
                scale={scale}
                onNodeClick={onTaskClick}
                width={window.innerWidth}
                height={window.innerHeight}
                alignment="center"
                granularity={granularity}
                branchSpacing={branchSpacing}
            />
        </div>
      </div>

      {/* Floating Controls */}
      <div className="fixed bottom-24 left-4 flex flex-col space-y-2 z-40">
        <button onClick={handleHome} className="bg-white p-3 rounded-full shadow-lg text-blue-600 border border-blue-100 active:scale-95 transition-transform">
            <Home size={20} />
        </button>
        <button onClick={handleZoomIn} className="bg-white p-3 rounded-full shadow-lg text-gray-700 border border-gray-100 active:scale-95 transition-transform">
            <ZoomIn size={20} />
        </button>
        <button onClick={handleZoomOut} className="bg-white p-3 rounded-full shadow-lg text-gray-700 border border-gray-100 active:scale-95 transition-transform">
            <ZoomOut size={20} />
        </button>
      </div>

      {/* FAB: Add Branch */}
      <button
        onClick={onNewBranch}
        className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-600/30 active:scale-95 transition-transform z-40 hover:bg-blue-700"
      >
        <img src={branchAddIcon} alt="Add Branch" className="w-6 h-6 filter brightness-0 invert" />
      </button>

      {/* Search Modal */}
      {showSearch && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => { setShowSearch(false); setSearchQuery(''); }} />
          <div className="fixed inset-x-0 top-0 bg-white z-50 shadow-xl animate-in slide-in-from-top duration-200">
            <div className="max-w-2xl mx-auto">
              {/* Search Input */}
              <div className="flex items-center px-4 py-3 border-b border-gray-100">
                <Search size={20} className="text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Search branches and tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-lg outline-none"
                  autoFocus
                />
                <button
                  onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Search Results */}
              <div className="max-h-[60vh] overflow-y-auto p-4">
                {searchQuery.trim() === 0 && (
                  <p className="text-center text-gray-400 py-8">Type to search branches and tasks</p>
                )}

                {searchQuery.trim() && searchResults.branches.length === 0 && searchResults.tasks.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No results found</p>
                )}

                {/* Branches Section */}
                {searchResults.branches.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Branches</h3>
                    <div className="space-y-1">
                      {searchResults.branches.map(branch => (
                        <button
                          key={branch.id}
                          onClick={() => handleResultClick('branch', branch.id)}
                          className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
                        >
                          <GitBranch size={16} className="mr-3" style={{ color: branch.color }} />
                          <div>
                            <div className="font-medium text-gray-800">{branch.name}</div>
                            {branch.description && (
                              <div className="text-xs text-gray-400 truncate max-w-xs">{branch.description}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks Section */}
                {searchResults.tasks.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tasks</h3>
                    <div className="space-y-1">
                      {searchResults.tasks.map(task => {
                        const branch = branches.find(b => b.id === task.branchId);
                        return (
                          <button
                            key={task.id}
                            onClick={() => handleResultClick('task', task.id)}
                            className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
                          >
                            <CheckCircle size={16} className="mr-3" style={{ color: branch?.color || '#999' }} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-800 truncate">{task.title}</div>
                              <div className="text-xs text-gray-400 flex items-center">
                                <span>{branch?.name || 'Unknown'}</span>
                                <span className="mx-1">·</span>
                                <span>{task.date}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default GraphPage;
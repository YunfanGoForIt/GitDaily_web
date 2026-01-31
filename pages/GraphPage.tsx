import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Plus, MoreHorizontal, Search, Home } from 'lucide-react';
import GraphRenderer from '../components/GraphRenderer';
import { Task, Branch, TimeGranularity } from '../types';

interface GraphPageProps {
  tasks: Task[];
  branches: Branch[];
  onTaskClick: (task: Task) => void;
  onNewBranch: () => void;
  onBranchClick: (branchId: string) => void;
  branchSpacing: number;
}

const GraphPage: React.FC<GraphPageProps> = ({ tasks, branches, onTaskClick, onNewBranch, onBranchClick, branchSpacing }) => {
  const [scale, setScale] = useState(1);
  const [granularity, setGranularity] = useState<TimeGranularity>(TimeGranularity.DAY);
  const [showGranularityMenu, setShowGranularityMenu] = useState(false);

  // Show active AND merged branches. Only hide archived ones.
  const visibleBranches = branches.filter(b => b.status !== 'archived');

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.6));

  const handleHome = () => {
      // 1. Reset Scale
      setScale(1.0);
      
      // 2. Scroll to "today-marker"
      setTimeout(() => {
          const todayEl = document.getElementById('today-marker');
          if (todayEl) {
              todayEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          }
      }, 100);
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
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
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
        className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-600/30 active:scale-95 transition-transform z-40"
      >
        <div className="flex items-center space-x-1">
            <div className="relative">
                <Plus size={24} />
            </div>
        </div>
      </button>

    </div>
  );
};

export default GraphPage;
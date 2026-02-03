import React, { useMemo, useState } from 'react';
import { ArrowLeft, GitMerge, Archive, CheckCircle2, Circle, MoreHorizontal, Trash2, List, Table as TableIcon } from 'lucide-react';
import GraphRenderer from '../components/GraphRenderer';
import TaskTable from '../components/TaskTable';
import { Task, Branch, TaskStatus } from '../types';

interface BranchDetailPageProps {
  branchId: string;
  tasks: Task[];
  branches: Branch[];
  onBack: () => void;
  onTaskClick: (task: Task) => void;
  onToggleTask: (taskId: string) => void;
  onArchive: (branchId: string) => void;
  onDelete: (branchId: string) => void;
  onMerge: (branchId: string) => void;
  onNewTask: () => void;
  onCreateTask: (task: { title: string; date: string; description?: string; branchId: string }) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  branchSpacing: number;
}

type ViewMode = 'list' | 'table';

const BranchDetailPage: React.FC<BranchDetailPageProps> = ({
    branchId, tasks, branches, onBack, onTaskClick, onToggleTask, onArchive, onDelete, onMerge, onNewTask, onCreateTask, onUpdateTask, branchSpacing
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const branch = branches.find(b => b.id === branchId);

  // Helper to recursively find all sub-branches
  const getBranchLineage = (rootId: string, allBranches: Branch[]): Branch[] => {
      const root = allBranches.find(b => b.id === rootId);
      if (!root) return [];
      
      const children = allBranches.filter(b => b.parentId === rootId);
      let descendants: Branch[] = [];
      children.forEach(child => {
          descendants = [...descendants, ...getBranchLineage(child.id, allBranches)];
      });
      
      return [root, ...descendants];
  };

  const visibleBranches = useMemo(() => {
      return getBranchLineage(branchId, branches);
  }, [branchId, branches]);

  const visibleBranchIds = useMemo(() => visibleBranches.map(b => b.id), [visibleBranches]);

  // Filter tasks: Only tasks belonging to the visible branches (Including Merge Commits for Graph)
  const visibleTasksForGraph = useMemo(() => {
      return tasks.filter(t => visibleBranchIds.includes(t.branchId));
  }, [tasks, visibleBranchIds]);

  // Specific tasks for the list on the right (Selected Branch Only)
  // FILTER OUT Merge Commits here so they don't clog the list
  const currentBranchTasks = tasks
      .filter(t => t.branchId === branchId && !t.isMergeCommit)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!branch) return null;

  const handleCreateTaskWrapper = async (task: { title: string; date: string; description?: string; branchId: string }) => {
    await onCreateTask(task);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex justify-between items-center shadow-sm sticky top-0 z-40">
        <div className="flex items-center">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full mr-2">
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="font-bold text-lg text-gray-900">{branch.name}</h1>
                <p className="text-xs text-gray-500">Branch Details</p>
            </div>
        </div>
        <div className="flex items-center space-x-2 relative">
            {branch.status !== 'merged' && (
                <button 
                    onClick={() => onMerge(branch.id)}
                    className="flex items-center bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-blue-100"
                >
                    <GitMerge size={14} className="mr-1" />
                    Merge
                </button>
            )}
            
            <div className="relative">
                <button 
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-full relative z-50"
                >
                    <MoreHorizontal size={20} />
                </button>
                
                {/* Dropdown Menu Overlay & Content */}
                {showMenu && (
                    <>
                        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowMenu(false)} />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 overflow-hidden">
                            <button 
                                onClick={() => {
                                    onArchive(branch.id);
                                    setShowMenu(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                            >
                                <Archive size={16} className="mr-2" />
                                Archive Branch
                            </button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button 
                                onClick={() => {
                                    if(window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
                                        onDelete(branch.id);
                                    }
                                    setShowMenu(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center"
                            >
                                <Trash2 size={16} className="mr-2" />
                                Delete Branch
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 overflow-y-auto no-scrollbar lg:flex">
         {/* Left: Focused Graph */}
         <div className="h-[400px] lg:h-auto lg:w-1/2 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white relative overflow-hidden">
             <div className="absolute inset-0 overflow-auto no-scrollbar p-4">
                 {visibleBranches.length > 0 ? (
                    <GraphRenderer 
                        branches={visibleBranches}
                        tasks={visibleTasksForGraph}
                        scale={0.9}
                        onNodeClick={onTaskClick}
                        width={window.innerWidth}
                        height={window.innerHeight}
                        alignment="left"
                        granularity="Day"
                        branchSpacing={branchSpacing}
                    />
                 ) : (
                     <div className="flex items-center justify-center h-full text-gray-400">
                         No data to display
                     </div>
                 )}
             </div>
         </div>

         {/* Right: Task List */}
         <div className="p-4 lg:w-1/2 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Tasks ({currentBranchTasks.length})
                </h2>
                <div className="flex items-center space-x-2">
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center px-2 py-1 rounded-md text-xs transition-all ${
                                viewMode === 'list'
                                    ? 'bg-white text-gray-800 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <List size={14} className="mr-1" />
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`flex items-center px-2 py-1 rounded-md text-xs transition-all ${
                                viewMode === 'table'
                                    ? 'bg-white text-gray-800 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <TableIcon size={14} className="mr-1" />
                            Table
                        </button>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">
                        {branch.status}
                    </span>
                </div>
            </div>

            {/* Task Content based on View Mode */}
            {viewMode === 'list' ? (
                <div className="space-y-3 flex-1 overflow-auto">
                    {currentBranchTasks.map(task => {
                        const isCompleted = task.status === TaskStatus.COMPLETED;
                        return (
                            <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start">
                                <button
                                    onClick={() => onToggleTask(task.id)}
                                    className="mt-1 mr-3 flex-shrink-0 transition-transform active:scale-90"
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 size={24} color={branch.color} className="fill-current bg-white rounded-full" />
                                    ) : (
                                        <Circle size={24} className="text-gray-300" />
                                    )}
                                </button>
                                <div className="flex-1">
                                    <h3 className={`text-base font-medium ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                        {task.title}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">{task.date}</p>
                                </div>
                            </div>
                        );
                    })}
                    <button
                        onClick={onNewTask}
                        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium hover:border-gray-300 hover:text-gray-500 transition-colors"
                    >
                        + Add Task to {branch.name}
                    </button>
                </div>
            ) : (
                <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <TaskTable
                        tasks={currentBranchTasks}
                        branchId={branchId}
                        branchColor={branch.color}
                        onCreateTask={handleCreateTaskWrapper}
                        onUpdateTask={onUpdateTask}
                        onTaskClick={onTaskClick}
                        onToggleTask={onToggleTask}
                    />
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default BranchDetailPage;
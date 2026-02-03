import React, { useState } from 'react';
import { CheckCircle2, Circle, Calendar, MoreHorizontal, Search, X, List, Table as TableIcon } from 'lucide-react';
import MultiBranchTaskTable from '../components/MultiBranchTaskTable';
import { TaskStatus, Task, Branch, TimeGranularity } from '../types';
import taskAddIcon from '../private_icons/task_add.svg';

type ViewMode = 'list' | 'table';

interface TasksPageProps {
  tasks: Task[];
  branches: Branch[];
  onNewTask: () => void;
  onToggleTask: (taskId: string) => void;
  onTaskClick: (task: Task) => void;
  onCreateTask: (task: { title: string; date: string; description?: string; branchId: string }) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  granularity: TimeGranularity;
  setGranularity: (g: TimeGranularity) => void;
}

const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Helper to get week date range (Monday to Sunday)
const getWeekDateRange = (date: Date): string => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7; // 1-7 (Mon-Sun)

  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - dayNum + 1);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const startStr = monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endStr = sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return `${startStr} - ${endStr}`;
};

const TasksPage: React.FC<TasksPageProps> = ({ tasks, branches, onNewTask, onToggleTask, onTaskClick, onCreateTask, onUpdateTask, granularity, setGranularity }) => {
  const [showGranularityMenu, setShowGranularityMenu] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Handle ESC key to clear search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchQuery('');
        if (showGranularityMenu) {
          setShowGranularityMenu(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGranularityMenu]);

  // Filter out Merge Commits from the list view
  const visibleTasks = tasks.filter(t => !t.isMergeCommit);

  // Filter by search query
  const filteredTasks = React.useMemo(() => {
    if (!searchQuery.trim()) return visibleTasks;
    const query = searchQuery.toLowerCase();
    return visibleTasks.filter(t =>
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );
  }, [visibleTasks, searchQuery]);

  const getBranch = (id: string) => branches.find(b => b.id === id);

  // Grouping Logic
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const d = new Date(task.date);
    let key = '';
    let label = '';
    let sortKey = 0;

    if (granularity === TimeGranularity.DAY) {
        key = task.date;
        label = d.toDateString();
        sortKey = d.getTime();
    } else if (granularity === TimeGranularity.WEEK || granularity === TimeGranularity.BIWEEK) {
        const week = getWeekNumber(d);
        const year = d.getFullYear();
        const weekRange = getWeekDateRange(d);
        key = `${year}-W${week}`;
        label = `W${week} (${weekRange})`;
        sortKey = d.getTime();
    } else if (granularity === TimeGranularity.MONTH) {
        const month = d.getMonth();
        const year = d.getFullYear();
        key = `${year}-${month}`;
        label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        sortKey = new Date(year, month, 1).getTime();
    }

    if (!acc[key]) {
        acc[key] = { label, tasks: [], sortKey };
    }
    acc[key].tasks.push(task);
    return acc;
  }, {} as Record<string, { label: string, tasks: Task[], sortKey: number }>);

  // Sort groups descending
  const sortedGroups = (Object.values(groupedTasks) as { label: string, tasks: Task[], sortKey: number }[]).sort((a, b) => b.sortKey - a.sortKey);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white px-6 py-4 pb-2 shadow-sm z-10 sticky top-0">
        <div className="flex justify-between items-center mb-2">
             <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>

             <div className="flex items-center space-x-2">
               {/* View Mode Toggle */}
               <div className="flex items-center bg-gray-100 rounded-lg p-0.5 mr-2">
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

               {/* Search Input */}
               <div className="relative">
                 <input
                   type="text"
                   placeholder="Search tasks..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-32 md:w-48 pl-8 pr-3 py-1.5 text-sm bg-gray-100 border-none rounded-full focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                 />
                 <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                 {searchQuery && (
                   <button
                     onClick={() => setSearchQuery('')}
                     className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                   >
                     <X size={14} />
                   </button>
                 )}
               </div>
             </div>

             {/* Granularity Selector */}
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
        <p className="text-xs text-gray-400">Manage your timeline</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 no-scrollbar">
        {viewMode === 'list' ? (
          // List View
          <>
            {sortedGroups.map((group) => (
              <div key={group.label} className="mb-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1 flex items-center bg-gray-50 sticky top-0 py-1 z-0">
                  <Calendar size={12} className="mr-1.5"/>
                  {group.label}
                </h2>
                <div className="space-y-2">
                  {group.tasks.map(task => {
                    const branch = getBranch(task.branchId);
                    const isCompleted = task.status === TaskStatus.COMPLETED;
                    const branchColor = branch?.color || '#999';
                    const dateDisplay = new Date(task.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });

                    return (
                      <div
                        key={task.id}
                        className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-start cursor-pointer hover:bg-gray-50 transition-all active:scale-[0.99]"
                        onClick={() => onTaskClick(task)}
                      >
                        <button
                          className="mt-0.5 mr-3 flex-shrink-0 transition-transform active:scale-90 focus:outline-none"
                          onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={20} color={branchColor} className="fill-current bg-white rounded-full" />
                          ) : (
                            <Circle size={20} className="text-gray-300 hover:text-gray-400" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                              <h3 className={`text-sm font-semibold truncate pr-2 ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                {task.title}
                              </h3>
                              <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap bg-gray-50 px-1.5 py-0.5 rounded ml-1">
                                  {dateDisplay}
                              </span>
                          </div>

                          <div className="flex items-center mt-1">
                              <div className="flex items-center px-1.5 py-0.5 rounded bg-gray-50 mr-2 border border-gray-100 max-w-[100px]">
                                <div className="w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0" style={{ backgroundColor: branchColor }}></div>
                                <span className="text-[10px] font-medium text-gray-500 truncate">{branch?.name}</span>
                              </div>
                              {task.description && (
                                 <p className="text-xs text-gray-400 truncate flex-1">{task.description}</p>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {sortedGroups.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                {searchQuery ? 'No tasks match your search' : 'No tasks found. Click + to create one.'}
              </div>
            )}
          </>
        ) : (
          // Table View
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden h-full">
            <MultiBranchTaskTable
              tasks={filteredTasks}
              branches={branches}
              onCreateTask={onCreateTask}
              onUpdateTask={onUpdateTask}
              onTaskClick={onTaskClick}
              onToggleTask={onToggleTask}
            />
          </div>
        )}
      </div>

      {/* FAB New Task */}
      <button
        onClick={onNewTask}
        className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-600/30 active:scale-95 transition-transform z-40 hover:bg-blue-700"
      >
        <img src={taskAddIcon} alt="Add Task" className="w-6 h-6 filter brightness-0 invert" />
      </button>
    </div>
  );
};

export default TasksPage;
import React, { useState } from 'react';
import { Plus, CheckCircle2, Circle, Calendar, ChevronDown } from 'lucide-react';
import { TaskStatus, Task, Branch, TimeGranularity } from '../types';

interface TasksPageProps {
  tasks: Task[];
  branches: Branch[];
  onNewTask: () => void;
  onToggleTask: (taskId: string) => void;
  onTaskClick: (task: Task) => void;
}

const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const TasksPage: React.FC<TasksPageProps> = ({ tasks, branches, onNewTask, onToggleTask, onTaskClick }) => {
  const [granularity, setGranularity] = useState<TimeGranularity>(TimeGranularity.DAY);

  // Filter out Merge Commits from the list view
  const visibleTasks = tasks.filter(t => !t.isMergeCommit);

  const getBranch = (id: string) => branches.find(b => b.id === id);

  // Grouping Logic
  const groupedTasks = visibleTasks.reduce((acc, task) => {
    const d = new Date(task.date);
    let key = '';
    let label = '';
    let sortKey = 0;

    if (granularity === TimeGranularity.DAY) {
        key = task.date;
        label = d.toDateString();
        sortKey = d.getTime();
    } else if (granularity === TimeGranularity.WEEK || granularity === TimeGranularity.BIWEEK) {
        // BiWeek treated as Week for simple list viewing, or we can combine
        const week = getWeekNumber(d);
        const year = d.getFullYear();
        key = `${year}-W${week}`;
        label = `Week ${week}, ${year}`;
        sortKey = d.getTime(); // rough sort
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
             
             {/* Granularity Selector */}
             <div className="relative group">
                 <button className="flex items-center space-x-1 text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">
                     <span>{granularity}</span>
                     <ChevronDown size={14} />
                 </button>
                 <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <button onClick={() => setGranularity(TimeGranularity.DAY)} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700">Day</button>
                    <button onClick={() => setGranularity(TimeGranularity.WEEK)} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700">Week</button>
                    <button onClick={() => setGranularity(TimeGranularity.MONTH)} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700">Month</button>
                 </div>
             </div>
        </div>
        <p className="text-xs text-gray-400">Manage your timeline</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 no-scrollbar">
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
            No tasks found. Click + to create one.
          </div>
        )}
      </div>

      {/* FAB New Task */}
      <button 
        onClick={onNewTask}
        className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-600/30 active:scale-95 transition-transform z-40"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default TasksPage;
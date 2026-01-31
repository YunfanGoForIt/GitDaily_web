import React from 'react';
import { Plus, CheckCircle2, Circle, Calendar } from 'lucide-react';
import { TaskStatus, Task, Branch } from '../types';

interface TasksPageProps {
  tasks: Task[];
  branches: Branch[];
  onNewTask: () => void;
  onToggleTask: (taskId: string) => void;
  onTaskClick: (task: Task) => void;
}

const TasksPage: React.FC<TasksPageProps> = ({ tasks, branches, onNewTask, onToggleTask, onTaskClick }) => {
  // Filter out Merge Commits from the list view
  const visibleTasks = tasks.filter(t => !t.isMergeCommit);

  // Group tasks by Date
  const groupedTasks = visibleTasks.reduce((acc, task) => {
    const date = task.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedTasks).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const getBranch = (id: string) => branches.find(b => b.id === id);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white px-6 py-8 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-500 mt-1">Your commit history and plans</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 no-scrollbar">
        {sortedDates.map(date => (
          <div key={date} className="mb-6">
            <h2 className="text-sm font-bold text-gray-500 mb-3 ml-1 flex items-center">
              <Calendar size={14} className="mr-2"/>
              {new Date(date).toDateString()}
            </h2>
            <div className="space-y-3">
              {groupedTasks[date].map(task => {
                const branch = getBranch(task.branchId);
                const isCompleted = task.status === TaskStatus.COMPLETED;
                const branchColor = branch?.color || '#999';

                return (
                  <div 
                    key={task.id} 
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => onTaskClick(task)}
                  >
                    <button 
                      className="mt-1 mr-3 flex-shrink-0 transition-transform active:scale-90 focus:outline-none"
                      onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={24} color={branchColor} className="fill-current bg-white rounded-full" />
                      ) : (
                        <Circle size={24} className="text-gray-300 hover:text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span 
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider"
                            style={{ backgroundColor: branchColor }}
                        >
                            {branch?.name}
                        </span>
                      </div>
                      <h3 className={`text-base font-medium transition-colors duration-200 ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                         <p className="text-sm text-gray-400 mt-1 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {sortedDates.length === 0 && (
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
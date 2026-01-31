import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, GitBranch, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Task, Branch, TaskStatus } from '../types';

interface TaskDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  branches: Branch[];
  onSave: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ isOpen, onClose, task, branches, onSave, onDelete }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PLANNED);
  
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDate(task.date);
      setStatus(task.status);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const branch = branches.find(b => b.branchId === task.branchId) || branches.find(b => b.id === task.branchId);
  const isCompleted = status === TaskStatus.COMPLETED;

  const handleToggleStatus = () => {
      const newStatus = isCompleted ? TaskStatus.PLANNED : TaskStatus.COMPLETED;
      setStatus(newStatus);
      onSave(task.id, { status: newStatus });
  };

  const handleBlurSave = () => {
      onSave(task.id, { title, description, date });
  };

  // Generate a pseudo-hash based on ID for visual effect
  const pseudoHash = task.id.substring(0, 7) + (isCompleted ? 'c' : 'p');

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity duration-300 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className={`w-full max-w-md bg-white h-full shadow-2xl transform transition-transform duration-300 ease-in-out pointer-events-auto flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center text-sm text-gray-500">
                <GitBranch size={16} className="mr-2" />
                <span className="font-medium" style={{ color: branch?.color }}>{branch?.name || 'Unknown Branch'}</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
            
            {/* Status Toggle */}
            <div className="mb-6 flex items-center">
                <button 
                    onClick={handleToggleStatus}
                    className={`flex items-center px-4 py-2 rounded-full border transition-all ${isCompleted ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                >
                    {isCompleted ? <CheckCircle2 size={20} className="mr-2 fill-green-500 text-white" /> : <Circle size={20} className="mr-2" />}
                    <span className="font-semibold">{isCompleted ? 'Completed' : 'Planned'}</span>
                </button>
            </div>

            {/* Title */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Task Name</label>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleBlurSave}
                    className="w-full text-2xl font-bold text-gray-900 border-none focus:ring-0 p-0 bg-transparent placeholder-gray-300"
                    placeholder="Enter task name"
                />
            </div>

            {/* Date */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Due Date</label>
                <div className="flex items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <Calendar size={18} className="text-gray-400 mr-3" />
                    <input 
                        type="date" 
                        value={date}
                        onChange={(e) => { setDate(e.target.value); handleBlurSave(); }}
                        className="bg-transparent border-none focus:ring-0 text-gray-700 font-medium w-full p-0"
                    />
                </div>
            </div>

            {/* Description */}
            <div className="mb-8">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleBlurSave}
                    rows={6}
                    className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none"
                    placeholder="Add details, notes, or subtasks..."
                />
            </div>

            {/* Metadata (Read only) */}
            <div className="border-t border-gray-100 pt-6">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>{isCompleted ? 'Commit Hash' : 'Status'}</span>
                    <span className="font-mono">
                        {isCompleted ? pseudoHash : 'Pending (Staged)'}
                    </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                    <span>Created</span>
                    <span>{new Date().toLocaleDateString()}</span>
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/30">
            <button 
                onClick={() => { if(window.confirm('Are you sure you want to delete this task?')) { onDelete(task.id); onClose(); } }}
                className="flex items-center text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
            >
                <Trash2 size={16} className="mr-2" />
                Delete Task
            </button>
        </div>

      </div>
    </div>
  );
};

export default TaskDetailPanel;
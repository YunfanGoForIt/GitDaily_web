import React, { useState, useEffect } from 'react';
import { ChevronRight, X, AlertCircle } from 'lucide-react';
import { Branch, Task, TaskStatus } from '../types';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  currentBranchId?: string;
  onSave: (task: Omit<Task, 'id'>) => void;
}

const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, branches, currentBranchId, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('12:00');
  const [selectedBranchId, setSelectedBranchId] = useState(currentBranchId || (branches[0]?.id || 'main'));
  const [error, setError] = useState<string | null>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('12:00');
      setSelectedBranchId(currentBranchId || (branches[0]?.id || 'main'));
      setError(null);
    }
  }, [isOpen, currentBranchId, branches]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
        setError('Task name is required');
        return;
    }
    if (!date) {
        setError('Completion date is required');
        return;
    }
    
    onSave({
      branchId: selectedBranchId,
      title,
      description,
      date, 
      status: TaskStatus.PLANNED
    });
    onClose();
  };

  const selectedBranch = branches.find(b => b.id === selectedBranchId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" 
        onClick={onClose}
      />
      
      {/* Added relative and z-10 to ensure content is above the backdrop blur */}
      <div className="relative z-10 bg-white w-full sm:w-[400px] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl pointer-events-auto">
        <div className="flex justify-between items-center mb-6">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">Cancel</button>
            <h2 className="text-lg font-bold text-gray-900">Add Task</h2>
            <div className="w-10"></div>
        </div>

        {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg flex items-center text-sm">
                <AlertCircle size={16} className="mr-2"/>
                {error}
            </div>
        )}

        <div className="space-y-5">
            <input 
                type="text" 
                value={title}
                onChange={(e) => { setTitle(e.target.value); setError(null); }}
                placeholder="Task Name" 
                className="w-full text-2xl font-bold placeholder-gray-300 border-none focus:ring-0 p-0 text-gray-900" 
                autoFocus
            />

            <div className="border border-gray-200 rounded-xl p-3">
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Notes/Description" 
                    rows={3}
                    className="w-full border-none focus:ring-0 resize-none text-gray-600 p-0 text-base"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Completion Time <span className="text-red-500">*</span></label>
                <div className="flex space-x-2">
                    <input 
                        type="date" 
                        required
                        value={date}
                        onChange={(e) => { setDate(e.target.value); setError(null); }}
                        className={`flex-1 bg-gray-50 border rounded-lg px-3 py-2 text-gray-700 ${!date && error ? 'border-red-500' : 'border-gray-200'}`} 
                    />
                    <input 
                        type="time" 
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-28 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700" 
                    />
                </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 group relative">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-900">Target Branch:</label>
                    <div className="flex items-center mt-1">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center mr-2" style={{ backgroundColor: selectedBranch?.color || '#999' }}>
                            <span className="text-white text-[10px] font-bold">git</span>
                        </div>
                        <span className="text-gray-800 font-medium">{selectedBranch?.name || 'Select Branch'}</span>
                    </div>
                </div>
                <ChevronRight className="text-gray-400" size={20} />
                
                {/* Simple dropdown for branches */}
                <select 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                >
                    {branches.filter(b => b.status === 'active').map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>

            <button 
                onClick={handleSave}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-full shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform mt-4"
            >
                Add Task
            </button>
        </div>
      </div>
    </div>
  );
};

export default NewTaskModal;
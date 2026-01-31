import React, { useState, useEffect } from 'react';
import { THEME_COLORS } from '../constants';
import { Branch } from '../types';

interface NewBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (branch: Omit<Branch, 'id' | 'status' | 'parentId'>) => void;
}

const NewBranchModal: React.FC<NewBranchModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedColor, setSelectedColor] = useState(THEME_COLORS.branches[0]);

  useEffect(() => {
    if (isOpen) {
        setName('');
        setDescription('');
        setTargetDate('');
        setSelectedColor(THEME_COLORS.branches[Math.floor(Math.random() * THEME_COLORS.branches.length)]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
        name,
        description,
        color: selectedColor,
        startDate: new Date().toISOString().split('T')[0],
        targetDate
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" 
        onClick={onClose}
      />
      
      {/* Modal Content - Added relative z-10 */}
      <div className="relative z-10 bg-white w-full sm:w-[400px] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl pointer-events-auto transform transition-transform duration-300 ease-out translate-y-0">
        <div className="flex justify-between items-center mb-6">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">Cancel</button>
            <h2 className="text-lg font-bold text-gray-900">New Branch</h2>
            <div className="w-10"></div>
        </div>

        <div className="space-y-5">
            <div>
                <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Branch Name" 
                    className="w-full text-2xl font-bold placeholder-gray-300 border-none focus:ring-0 p-0 text-gray-900" 
                    autoFocus
                />
            </div>

            <div className="border border-gray-200 rounded-xl p-3">
                <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Description" 
                    rows={3}
                    className="w-full border-none focus:ring-0 resize-none text-gray-600 p-0 text-base"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Completion Date</label>
                <div className="flex space-x-2">
                    <input 
                        type="date" 
                        value={targetDate}
                        onChange={e => setTargetDate(e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-blue-500" 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color Selection</label>
                <div className="flex space-x-3">
                    {THEME_COLORS.branches.map(c => (
                        <button 
                            key={c}
                            onClick={() => setSelectedColor(c)}
                            className={`w-10 h-10 rounded-full transition-transform ${selectedColor === c ? 'scale-110 ring-2 ring-offset-2 ring-gray-400' : ''}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
            </div>

            <button 
                onClick={handleSave}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-full shadow-lg shadow-green-500/30 active:scale-95 transition-transform mt-4"
            >
                Create Branch
            </button>
        </div>
      </div>
    </div>
  );
};

export default NewBranchModal;
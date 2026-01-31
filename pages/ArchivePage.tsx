import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Archive as ArchiveIcon, Calendar, X, Check } from 'lucide-react';
import { Branch, AppView } from '../types';

interface ArchivePageProps {
  branches: Branch[];
  onNavigate: (view: AppView) => void;
  onRestore: (branchId: string, restoreDate: string) => void;
}

const ArchivePage: React.FC<ArchivePageProps> = ({ branches, onNavigate, onRestore }) => {
  const archivedBranches = branches.filter(b => b.status === 'archived');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  
  // Date selection state
  const today = new Date().toISOString().split('T')[0];
  const [restoreDate, setRestoreDate] = useState(today);

  // Generate a list of dates for the horizontal selector (e.g., Today + next 14 days)
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
  });

  const handleConfirmRestore = () => {
      if (selectedBranchId) {
          onRestore(selectedBranchId, restoreDate);
          setSelectedBranchId(null);
      }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col relative overflow-hidden">
       {/* Scrollable Content */}
       <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-32">
            {/* Header */}
            <div className="flex items-center mb-6">
                <button 
                onClick={() => onNavigate('me')}
                className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full mr-2"
                >
                <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Archived Projects</h1>
            </div>

            <div className="space-y-4">
                {archivedBranches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <ArchiveIcon size={48} className="mb-4 opacity-50" />
                    <p>No archived projects.</p>
                </div>
                ) : (
                archivedBranches.map(branch => (
                    <div key={branch.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: branch.color }}></div>
                        <div className="flex justify-between items-start pl-2">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{branch.name}</h3>
                                <p className="text-gray-500 text-sm mt-1">{branch.description}</p>
                                <div className="mt-3 flex items-center text-xs text-gray-400">
                                    <Calendar size={12} className="mr-1"/>
                                    Started {branch.startDate}
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setSelectedBranchId(branch.id)}
                                className="flex flex-col items-center text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors active:scale-95"
                            >
                                <RotateCcw size={20} />
                                <span className="text-[10px] font-bold mt-1">RESTORE</span>
                            </button>
                        </div>
                    </div>
                ))
                )}
            </div>
       </div>

       {/* Restore Bottom Sheet / Modal - Fixed Position ensures visibility */}
       {selectedBranchId && (
           <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:items-center">
               {/* Backdrop */}
               <div 
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  onClick={() => setSelectedBranchId(null)}
               ></div>

               {/* Sheet Content */}
               <div className="bg-white w-full sm:w-[450px] sm:rounded-2xl rounded-t-3xl p-6 shadow-2xl relative z-10 animate-slide-up transform transition-all duration-300 max-h-[90vh] flex flex-col">
                   <div className="flex justify-between items-center mb-6 flex-shrink-0">
                       <h3 className="text-lg font-bold text-gray-900">Select Restart Date</h3>
                       <button onClick={() => setSelectedBranchId(null)} className="p-2 hover:bg-gray-100 rounded-full">
                           <X size={20} className="text-gray-500" />
                       </button>
                   </div>

                   <div className="mb-8 flex-1 overflow-y-auto">
                       <p className="text-sm text-gray-500 mb-4">
                           Choose when you want to resume this project. Past progress will be preserved as history.
                       </p>
                       
                       {/* Horizontal Date Scroller */}
                       <div className="flex space-x-3 overflow-x-auto no-scrollbar py-2 px-1">
                           {dateOptions.map(date => {
                               const dateStr = date.toISOString().split('T')[0];
                               const isSelected = dateStr === restoreDate;
                               const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                               const dayNum = date.getDate();

                               return (
                                   <button 
                                        key={dateStr}
                                        onClick={() => setRestoreDate(dateStr)}
                                        className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-md' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                                   >
                                       <span className="text-xs font-medium uppercase">{dayName}</span>
                                       <span className="text-xl font-bold">{dayNum}</span>
                                   </button>
                               );
                           })}
                       </div>
                   </div>

                   <button 
                        onClick={handleConfirmRestore}
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
                   >
                       <Check size={20} className="mr-2" />
                       Confirm Restart
                   </button>
               </div>
           </div>
       )}
    </div>
  );
};

export default ArchivePage;
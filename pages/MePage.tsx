import React, { useState, useMemo } from 'react';
import { Settings, Archive, Star, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { Task, AppView } from '../types';

interface MePageProps {
  user: any;
  tasks: Task[];
  onNavigate: (view: AppView) => void;
  heatmapCellSize?: number;
}

// Sub-component for a single month's grid
const MonthGrid: React.FC<{ year: number; month: number; tasks: Task[]; cellSize: number }> = ({ year, month, tasks, cellSize }) => {
    // Calculate grid data
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

    // Process tasks: Only COMPLETED tasks count
    const dailyCounts = useMemo(() => {
        const counts: Record<number, number> = {};

        tasks.forEach(t => {
            if (t.status !== 'COMPLETED') return;

            const [tYear, tMonth, tDay] = t.date.split('-').map(Number);

            // Note: tMonth is 1-indexed in the string (01..12), but JS getMonth is 0-indexed (0..11)
            if (tYear === year && (tMonth - 1) === month) {
                counts[tDay] = (counts[tDay] || 0) + 1;
            }
        });
        return counts;
    }, [tasks, year, month]);

    const getIntensityClass = (count: number) => {
        if (!count) return 'bg-gray-100';
        if (count === 1) return 'bg-green-200';
        if (count === 2) return 'bg-green-300';
        if (count === 3) return 'bg-green-400';
        return 'bg-green-600';
    };

    const cellClass = `rounded-sm relative group cursor-default`;
    const sizeStyle = { width: `${cellSize}px`, height: `${cellSize}px` };
    const gapSize = Math.max(1, cellSize / 8);

    // Generate grid cells
    const cells = [];
    // 1. Empty padding cells for start of month
    for (let i = 0; i < firstDayOfWeek; i++) {
        cells.push(<div key={`pad-${i}`} style={sizeStyle}></div>);
    }
    // 2. Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const count = dailyCounts[day] || 0;
        cells.push(
            <div
                key={`day-${day}`}
                style={sizeStyle}
                className={`${cellClass} ${getIntensityClass(count)}`}
            >
                {/* Tooltip */}
                {count > 0 && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity shadow-lg">
                        {day}: {count} commit{count !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        );
    }

    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

    return (
        <div className="flex flex-col">
             <div className="text-sm font-bold text-gray-800 mb-2 ml-0.5">{monthName}</div>

             {/* Weekday Headers */}
             <div className="grid grid-cols-7 mb-1" style={{ gap: `${gapSize}px` }}>
                {['S','M','T','W','T','F','S'].map((d, i) => (
                    <div key={i} style={{ width: `${cellSize}px` }} className="text-[8px] text-gray-400 text-center font-medium flex items-center justify-center">
                        {d}
                    </div>
                ))}
             </div>

             {/* Days Grid */}
             <div className="grid grid-cols-7" style={{ gap: `${gapSize}px` }}>
                {cells}
             </div>
        </div>
    );
};

const HeatMap: React.FC<{ tasks: Task[]; cellSize: number }> = ({ tasks, cellSize }) => {
    const [anchorDate, setAnchorDate] = useState(new Date()); // Represents the first visible month

    const handlePrev = () => {
        const newDate = new Date(anchorDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setAnchorDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(anchorDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setAnchorDate(newDate);
    };

    // Current Month
    const year1 = anchorDate.getFullYear();
    const month1 = anchorDate.getMonth();

    // Next Month (for desktop view)
    const nextDate = new Date(year1, month1 + 1, 1);
    const year2 = nextDate.getFullYear();
    const month2 = nextDate.getMonth();

    return (
        <div className="relative max-w-md mx-auto">
             {/* Navigation Overlay */}
             <div className="absolute top-0 right-0 flex space-x-1 z-10">
                <button
                    onClick={handlePrev}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    onClick={handleNext}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Month 1 */}
                <MonthGrid year={year1} month={month1} tasks={tasks} cellSize={cellSize} />

                {/* Month 2 - Hidden on mobile, Visible on Desktop */}
                <div className="hidden md:block opacity-50 md:opacity-100">
                    <MonthGrid year={year2} month={month2} tasks={tasks} cellSize={cellSize} />
                </div>
            </div>
        </div>
    )
}

const MePage: React.FC<MePageProps> = ({ user, tasks, onNavigate, heatmapCellSize = 18 }) => {
  const totalCommits = tasks.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="h-full bg-gray-50 flex flex-col p-6 overflow-y-auto no-scrollbar">
      
      {/* Profile Header */}
      <div className="flex flex-col items-center mt-8 mb-8">
        <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md mb-4 overflow-hidden">
            <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
        <p className="text-blue-500 font-medium">{user.handle}</p>
        
        <button 
            onClick={() => onNavigate('edit-profile')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold shadow-md active:scale-95 transition-transform"
        >
            Edit Profile
        </button>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-gray-800">Contribution Graph</h2>
             <div className="text-xs text-gray-400 font-medium">
                 {totalCommits} Total Commits
             </div>
        </div>
        
        <HeatMap tasks={tasks} cellSize={heatmapCellSize} />
        
        <div className="flex justify-center items-center mt-4 space-x-1 text-[10px] text-gray-500">
            <span>Less</span>
            <div className="rounded-sm bg-gray-100" style={{ width: `${heatmapCellSize * 0.75}px`, height: `${heatmapCellSize * 0.75}px` }}></div>
            <div className="rounded-sm bg-green-200" style={{ width: `${heatmapCellSize * 0.75}px`, height: `${heatmapCellSize * 0.75}px` }}></div>
            <div className="rounded-sm bg-green-400" style={{ width: `${heatmapCellSize * 0.75}px`, height: `${heatmapCellSize * 0.75}px` }}></div>
            <div className="rounded-sm bg-green-600" style={{ width: `${heatmapCellSize * 0.75}px`, height: `${heatmapCellSize * 0.75}px` }}></div>
            <span>More</span>
        </div>
      </div>

      {/* Menu Options */}
      <div className="space-y-3 pb-24">
        <button 
            onClick={() => onNavigate('archive')}
            className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center hover:bg-gray-50 transition-colors"
        >
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600 mr-4">
                <Archive size={20} />
            </div>
            <span className="text-gray-700 font-medium flex-1 text-left">Archived Projects (Stash)</span>
        </button>

        <button 
            onClick={() => onNavigate('settings')}
            className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center hover:bg-gray-50 transition-colors"
        >
            <div className="bg-purple-100 p-2 rounded-lg text-purple-600 mr-4">
                <Settings size={20} />
            </div>
            <span className="text-gray-700 font-medium flex-1 text-left">Settings</span>
        </button>

        <button className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center hover:bg-gray-50 transition-colors">
            <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600 mr-4">
                <MessageSquare size={20} />
            </div>
            <span className="text-gray-700 font-medium flex-1 text-left">Feedback</span>
        </button>

         <button className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center hover:bg-gray-50 transition-colors">
            <div className="bg-pink-100 p-2 rounded-lg text-pink-600 mr-4">
                <Star size={20} />
            </div>
            <span className="text-gray-700 font-medium flex-1 text-left">Support GitDaily</span>
        </button>
      </div>

    </div>
  );
};

export default MePage;
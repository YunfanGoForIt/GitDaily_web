import React, { useMemo } from 'react';
import { Branch, Task, TaskStatus, TimeGranularity } from '../types';

interface GraphRendererProps {
  branches: Branch[];
  tasks: Task[];
  scale: number;
  onNodeClick: (task: Task) => void;
  width: number;
  height: number;
  alignment?: 'center' | 'left';
  granularity: TimeGranularity;
  branchSpacing?: number; // New prop for multiplier
}

// Visual Constants
const NODE_RADIUS = 7;
const MINI_NODE_RADIUS = 3;

// Helper to get week number
const getWeekNumber = (d: Date) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Helper to get week date range (Monday to Sunday)
const getWeekDateRange = (date: Date): { start: Date; end: Date; label: string } => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7; // 1-7 (Mon-Sun)

  // Get Monday of this week
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - dayNum + 1);

  // Get Sunday of this week
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const startStr = monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endStr = sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return {
    start: monday,
    end: sunday,
    label: `${startStr} - ${endStr}`
  };
};

// Helper to generate a range of dates
const getDatesInRange = (startDate: Date, endDate: Date) => {
    const dates = [];
    const theDate = new Date(startDate);
    theDate.setHours(0,0,0,0);
    const stopDate = new Date(endDate);
    stopDate.setHours(0,0,0,0);

    while (theDate >= stopDate) {
        dates.push(new Date(theDate).toISOString().split('T')[0]);
        theDate.setDate(theDate.getDate() - 1);
    }
    return dates;
};

// Helper to calculate branch depth (0 = main, 1 = direct child, etc.)
const getBranchDepth = (branchId: string, allBranches: Branch[]): number => {
    if (branchId === 'main') return 0;
    const branch = allBranches.find(b => b.id === branchId);
    if (!branch || !branch.parentId) return 1; 
    return 1 + getBranchDepth(branch.parentId, allBranches);
};

// Helper to determine spacing gap based on hierarchy level
const getHierarchyGap = (depth: number, isMini: boolean, spacingMultiplier: number) => {
    if (isMini) return 20 * spacingMultiplier; // Very compact for mini branches

    let baseGap = 24;
    if (depth <= 1) baseGap = 80; // Main -> Level 1
    else if (depth === 2) baseGap = 40; // Level 1 -> Level 2
    
    return baseGap * spacingMultiplier;
};

// Helper to check if branch should be mini based on granularity
const checkIsMini = (depth: number, granularity: TimeGranularity) => {
    if (granularity === TimeGranularity.DAY) return false;
    if (granularity === TimeGranularity.WEEK || granularity === TimeGranularity.BIWEEK) {
        return depth >= 3; // Show L1(1), L2(2). Hide L3+(3+)
    }
    if (granularity === TimeGranularity.MONTH) {
        return depth >= 2; // Show L1(1). Hide L2+(2+)
    }
    return false;
};

// Helper for stroke width based on depth
const getStrokeWidth = (depth: number, isMini: boolean) => {
    if (isMini) return 1.5;
    if (depth <= 1) return 3; // Main (0) and L1 (1) are thick
    if (depth === 2) return 2.2; // L2 is thinner
    return 1.5; // L3+ are thinnest
};

const GraphRenderer: React.FC<GraphRendererProps> = ({ 
    branches, 
    tasks, 
    scale, 
    onNodeClick, 
    width, 
    height,
    alignment = 'center',
    granularity,
    branchSpacing = 1.0 
}) => {
  
  const isDesktop = width >= 768; 
  const useCenteredLayout = alignment === 'center' && isDesktop;
  const centerX = useCenteredLayout ? width / 2 : 50;

  // 1. Determine Row Height based on Granularity
  const ROW_HEIGHT = useMemo(() => {
      switch (granularity) {
          case TimeGranularity.MONTH: return 12; 
          case TimeGranularity.BIWEEK:
          case TimeGranularity.WEEK: return 28; 
          case TimeGranularity.DAY: 
          default: return 60; 
      }
  }, [granularity]);

  // 2. Organize Data & Generate Time Rows
  const { rows, rowMap } = useMemo(() => {
    const todayTs = new Date().getTime();
    const dates = tasks.map(t => new Date(t.date).getTime());
    dates.push(todayTs);

    const maxDate = new Date(Math.max(...dates));
    const minDate = new Date(Math.min(...dates));
    
    maxDate.setDate(maxDate.getDate() + 5); 
    minDate.setDate(minDate.getDate() - 5);

    const allDates = getDatesInRange(maxDate, minDate);

    const generatedRows: { date: string, y: number, tasks: Task[] }[] = [];
    const dateToYMap = new Map<string, number>();
    
    const startY = 60;

    allDates.forEach((dateStr, index) => {
        const y = (index * ROW_HEIGHT) + startY;
        const tasksForDay = tasks.filter(t => t.date === dateStr);
        generatedRows.push({
            date: dateStr,
            y,
            tasks: tasksForDay
        });
        dateToYMap.set(dateStr, y);
    });

    return { rows: generatedRows, rowMap: dateToYMap };
  }, [tasks, ROW_HEIGHT]);

  // 3. Determine X Coordinates (Hierarchical Layout Logic)
  const branchXMap = useMemo(() => {
      const map = new Map<string, number>();
      map.set('main', 0);

      const activeBranches = branches.filter(b => b.id !== 'main');
      activeBranches.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      if (useCenteredLayout) {
          let currentRight = 0;
          let currentLeft = 0;

          // Recursive layout
          const layoutFamily = (branch: Branch, side: 'left' | 'right') => {
             const depth = getBranchDepth(branch.id, branches);
             const isMini = checkIsMini(depth, granularity);
             const gap = getHierarchyGap(depth, isMini, branchSpacing);

             let x = 0;
             if (side === 'right') {
                 currentRight += gap;
                 x = currentRight;
             } else {
                 currentLeft -= gap; 
                 x = currentLeft;
             }
             
             map.set(branch.id, x);

             // Process children
             const children = activeBranches.filter(b => b.parentId === branch.id);
             children.forEach(child => layoutFamily(child, side));
          };

          // Find roots (Level 1)
          const roots = activeBranches.filter(b => 
              b.parentId === 'main' || !branches.find(p => p.id === b.parentId)
          );

          roots.forEach((root, index) => {
              const side = index % 2 === 0 ? 'right' : 'left';
              layoutFamily(root, side);
          });
          
          // Handle orphans
          activeBranches.forEach(b => {
              if (!map.has(b.id)) {
                   const depth = getBranchDepth(b.id, branches);
                   const isMini = checkIsMini(depth, granularity);
                   currentRight += getHierarchyGap(depth, isMini, branchSpacing);
                   map.set(b.id, currentRight);
              }
          });

      } else {
          // Linear Layout (Mobile)
          let currentX = 0;
          
          const layoutLinear = (branch: Branch) => {
              const depth = getBranchDepth(branch.id, branches);
              const isMini = checkIsMini(depth, granularity);
              // Scale down gaps slightly for mobile
              const gap = getHierarchyGap(depth, isMini, branchSpacing) * 0.7; 
              
              currentX += gap;
              map.set(branch.id, currentX);

              const children = activeBranches.filter(b => b.parentId === branch.id);
              children.forEach(child => layoutLinear(child));
          }

           const roots = activeBranches.filter(b => 
              b.parentId === 'main' || !branches.find(p => p.id === b.parentId)
          );
          roots.forEach(root => layoutLinear(root));
          
           activeBranches.forEach(b => {
              if (!map.has(b.id)) {
                   currentX += 40 * branchSpacing;
                   map.set(b.id, currentX);
              }
          });
      }
      return map;
  }, [branches, useCenteredLayout, granularity, branchSpacing]);

  const getBranchX = (branchId: string) => branchXMap.get(branchId) || 0;
  
  // 4. Calculate Node Coordinates with collision detection
  const nodes = useMemo(() => {
      if (!rows) return [];

      // 首先按日期分组
      const tasksByDate = new Map<string, Task[]>();
      tasks.forEach(task => {
          const existing = tasksByDate.get(task.date) || [];
          existing.push(task);
          tasksByDate.set(task.date, existing);
      });

      // 计算节点位置，同日期同分支的任务垂直错开
      const nodesWithOffset = tasks.map(task => {
          const rowY = rowMap.get(task.date) || 0;
          const x = centerX + getBranchX(task.branchId);

          const depth = getBranchDepth(task.branchId, branches);
          const isMini = checkIsMini(depth, granularity);

          // 计算同日期同分支的偏移
          const sameDateTasks = tasksByDate.get(task.date) || [];
          const sameBranchTasks = sameDateTasks.filter(t => t.branchId === task.branchId);
          const taskIndex = sameBranchTasks.indexOf(task);

          // 同一分支同日期有多个任务时，以当天为中心上下错开
          let yOffset = 0;
          if (sameBranchTasks.length > 1) {
              const spacing = 16; // 节点垂直间距
              const totalHeight = (sameBranchTasks.length - 1) * spacing;
              yOffset = (taskIndex * spacing) - (totalHeight / 2);

              // 限制偏移范围，确保不跨越日期边界（以当天为中心 ±45% 行高）
              const maxOffset = ROW_HEIGHT * 0.45;
              yOffset = Math.max(-maxOffset, Math.min(maxOffset, yOffset));
          }

          return {
              ...task,
              x,
              y: rowY + yOffset,
              isMini,
              depth,
              groupIndex: taskIndex
          };
      });

      return nodesWithOffset;
  }, [tasks, rowMap, branchXMap, centerX, granularity, branches, ROW_HEIGHT]);

  const nodeCoordMap = useMemo(() => {
      const map = new Map<string, {x: number, y: number}>();
      nodes.forEach(n => map.set(n.id, {x: n.x, y: n.y}));
      return map;
  }, [nodes]);

  const getYForDate = (dateStr: string): number => {
      if (rowMap.has(dateStr)) return rowMap.get(dateStr)!;
      const targetTime = new Date(dateStr).getTime();
      const closestRow = rows.reduce((prev, curr) => {
          return (Math.abs(new Date(curr.date).getTime() - targetTime) < Math.abs(new Date(prev.date).getTime() - targetTime) ? curr : prev);
      }, rows[0]);
      return closestRow ? closestRow.y : 0;
  };

  // 5. Generate SVG Paths
  const paths: React.ReactNode[] = [];

  // Time Guide Line
  paths.push(
    <line 
        key="time-guide"
        x1={centerX} y1={20} 
        x2={centerX} y2={(rows.length * ROW_HEIGHT) + 100} 
        stroke="#e5e7eb" 
        strokeWidth={3} 
        strokeDasharray="4 4"
    />
  );

  branches.forEach(branch => {
      const branchNodes = nodes
        .filter(n => n.branchId === branch.id)
        .sort((a, b) => {
            // 首先按日期降序
            const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateDiff !== 0) return dateDiff;
            // 同一天按完成状态排序（completed 在前）
            if (a.status !== b.status) {
                return a.status === 'COMPLETED' ? -1 : 1;
            }
            return 0;
        });
      
      const branchColor = branch.color;
      const restoreDateObj = branch.restoredDate ? new Date(branch.restoredDate) : null;
      
      const depth = getBranchDepth(branch.id, branches);
      const isMiniBranch = checkIsMini(depth, granularity);
      
      const strokeWidth = getStrokeWidth(depth, isMiniBranch);

      // Connect nodes
      for (let i = 0; i < branchNodes.length - 1; i++) {
          const current = branchNodes[i];
          const next = branchNodes[i+1];
          const isGhost = restoreDateObj && new Date(current.date) < restoreDateObj;
          const strokeColor = isGhost ? '#e5e7eb' : branchColor;

          paths.push(
            <path
              key={`line-${branch.id}-${i}`}
              d={`M ${current.x} ${current.y} L ${next.x} ${next.y}`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
            />
          );
      }

      // Connect to Start (Fork)
      if (branch.parentId) {
          const firstNode = branchNodes[branchNodes.length - 1]; 
          const startY = getYForDate(branch.startDate);
          
          const parentX = centerX + getBranchX(branch.parentId);
          
          const isGhostFork = restoreDateObj && firstNode && new Date(firstNode.date) < restoreDateObj;
          const forkColor = isGhostFork ? '#e5e7eb' : branchColor;
          
          if (firstNode) {
             const cp1Y = startY - (startY - firstNode.y) * 0.5;
             const cp2Y = firstNode.y + (startY - firstNode.y) * 0.5;

             paths.push(
                <path
                  key={`branch-fork-${branch.id}`}
                  d={`M ${parentX} ${startY} C ${parentX} ${cp1Y}, ${firstNode.x} ${cp2Y}, ${firstNode.x} ${firstNode.y}`}
                  stroke={forkColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray="4 3"
                  opacity={isGhostFork ? 0.4 : 0.8}
                />
             );
          } else {
             // Stub
             const myX = centerX + getBranchX(branch.id);
             paths.push(
                <path
                  key={`branch-stub-${branch.id}`}
                  d={`M ${parentX} ${startY} Q ${parentX} ${startY-20}, ${myX} ${startY-40}`}
                  stroke={forkColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray="4 3"
                  opacity={0.5}
                />
             );
          }
          paths.push(
            <circle key={`fork-dot-${branch.id}`} cx={parentX} cy={startY} r={isMiniBranch ? 2 : 4} fill={forkColor} />
          );
      }

      // Connect End (Merge)
      if (branch.status === 'merged' && branch.mergeTargetNodeId && branchNodes.length > 0) {
          const lastNode = branchNodes[0]; 
          const targetCoords = nodeCoordMap.get(branch.mergeTargetNodeId);
          
          if (targetCoords) {
              const midY = (lastNode.y + targetCoords.y) / 2;
              paths.push(
                <path
                    key={`branch-merge-${branch.id}`}
                    d={`M ${lastNode.x} ${lastNode.y} C ${lastNode.x} ${midY}, ${targetCoords.x} ${midY}, ${targetCoords.x} ${targetCoords.y}`}
                    stroke={branchColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
            );
          }
      }
  });

  // 6. Render Time Markers (Axis)
  const timeMarkers: React.ReactNode[] = [];
  let lastWeekNum = -1;
  let lastYear = -1;
  let lastMonth = -1;
  const todayStr = new Date().toISOString().split('T')[0];

  rows.forEach((row) => {
      const date = new Date(row.date);
      const weekNum = getWeekNumber(date);
      const month = date.getMonth();
      const year = date.getFullYear();
      const day = date.getDate();
      const dayOfWeek = date.getDay(); // 0-6
      const isToday = row.date === todayStr;
      
      const groupProps = isToday ? { id: "today-marker" } : {};

      if (granularity === TimeGranularity.DAY) {
          if (weekNum !== lastWeekNum || year !== lastYear) {
             const markerY = row.y - (ROW_HEIGHT / 2);
             const weekRange = getWeekDateRange(date);
             timeMarkers.push(
                <g key={`week-${year}-${weekNum}`}>
                    <text x={centerX} y={markerY + 4} textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="bold">
                        W{weekNum} <tspan fontSize="8" fill="#94a3b8" fontWeight="normal">({weekRange.label})</tspan>
                    </text>
                </g>
             );
          }
          timeMarkers.push(
            <g key={`tick-${row.date}`} {...groupProps}>
                <line x1={centerX - 6} y1={row.y} x2={centerX + 6} y2={row.y} stroke={isToday ? "#3b82f6" : "#e2e8f0"} strokeWidth={isToday ? 2 : 1} />
                <text x={centerX - 12} y={row.y + 3} textAnchor="end" fontSize="9" fill={isToday ? "#3b82f6" : "#94a3b8"} fontWeight={isToday ? "bold" : "normal"} className="font-mono">
                  {day}
                </text>
            </g>
          );

      } else if (granularity === TimeGranularity.WEEK || granularity === TimeGranularity.BIWEEK) {
          if (weekNum !== lastWeekNum || year !== lastYear) {
              const markerY = row.y;
              const weekRange = getWeekDateRange(date);
              timeMarkers.push(
                  <g key={`week-lg-${year}-${weekNum}`}>
                      <line x1={centerX - 15} y1={markerY} x2={centerX + 15} y2={markerY} stroke="#cbd5e1" strokeWidth={2} />
                      <text x={centerX - 20} y={markerY + 4} textAnchor="end" fontSize="11" fill="#64748b" fontWeight="bold">
                          W{weekNum} <tspan fontSize="9" fill="#94a3b8" fontWeight="normal">{weekRange.label}</tspan>
                      </text>
                  </g>
              );
          } else {
              timeMarkers.push(
                <g key={`tick-${row.date}`} {...groupProps}>
                   <line x1={centerX - 4} y1={row.y} x2={centerX + 4} y2={row.y} stroke={isToday ? "#3b82f6" : "#f1f5f9"} strokeWidth={1} />
                </g>
              );
          }

      } else if (granularity === TimeGranularity.MONTH) {
          if (month !== lastMonth || year !== lastYear) {
              const markerY = row.y;
              const monthName = date.toLocaleString('default', { month: 'short' });
              timeMarkers.push(
                  <g key={`month-lg-${year}-${month}`}>
                      <line x1={centerX - 20} y1={markerY} x2={centerX + 20} y2={markerY} stroke="#94a3b8" strokeWidth={2} />
                      <text x={centerX - 25} y={markerY + 4} textAnchor="end" fontSize="12" fill="#475569" fontWeight="bold">
                          {monthName}
                      </text>
                  </g>
              );
          } else if (dayOfWeek === 1) { 
              timeMarkers.push(
                <g key={`tick-week-${row.date}`}>
                   <line x1={centerX - 4} y1={row.y} x2={centerX + 4} y2={row.y} stroke="#e2e8f0" strokeWidth={1} />
                </g>
              );
          }
      }

      lastWeekNum = weekNum;
      lastYear = year;
      lastMonth = month;
  });

  return (
    <div className="relative overflow-visible" style={{ width: '100%', height: rows.length * ROW_HEIGHT + 200 }}>
       <svg 
        width="100%" 
        height="100%" 
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.3s ease' }}
        className="overflow-visible"
       >
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#f1f5f9" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {timeMarkers}
          {paths}
          {nodes.map(node => {
            const branch = branches.find(b => b.id === node.branchId);
            const branchColor = branch?.color || '#9ca3af';
            const isCompleted = node.status === TaskStatus.COMPLETED;
            const isMerge = node.isMergeCommit;
            
            const restoreDateObj = branch?.restoredDate ? new Date(branch.restoredDate) : null;
            const isGhost = restoreDateObj && new Date(node.date) < restoreDateObj;

            const isLeftOfCenter = node.x < centerX;
            const labelX = isLeftOfCenter ? node.x - 12 : node.x + 12;
            const textAnchor = isLeftOfCenter ? "end" : "start";
            
            // Adaptive Label Background
            const charWidth = 7; 
            const padding = 16;
            const titleLength = node.title.length > 20 ? 21 : node.title.length;
            const adaptiveWidth = Math.max(40, titleLength * charWidth + padding);
            
            // If left aligned, box should extend to the left of 0. If right aligned, extend to right.
            const rectX = isLeftOfCenter ? -(adaptiveWidth + 4) : -4;

            const displayColor = isGhost ? '#d1d5db' : branchColor;
            const opacity = isGhost ? 0.6 : 1;
            
            const r = node.isMini ? MINI_NODE_RADIUS : (isMerge ? NODE_RADIUS + 2 : NODE_RADIUS);
            
            const depth = getBranchDepth(node.branchId, branches);
            const isMini = checkIsMini(depth, granularity);
            const strokeWidth = getStrokeWidth(depth, isMini);

            return (
              <g key={node.id} onClick={() => onNodeClick(node)} className="cursor-pointer group" style={{ opacity }}>
                <circle cx={node.x} cy={node.y} r={15} fill="transparent" />
                
                <circle 
                  cx={node.x} 
                  cy={node.y} 
                  r={r} 
                  fill={isCompleted ? (isMerge ? '#fff' : displayColor) : '#f8fafc'} 
                  stroke={displayColor}
                  strokeWidth={strokeWidth}
                  className="transition-all duration-200"
                />
                {isMerge && !node.isMini && <circle cx={node.x} cy={node.y} r={3} fill={displayColor} />}
                
                {!node.isMini && (
                    <>
                        {/* 标题 - 在圆圈一侧 */}
                        <g transform={`translate(${labelX}, ${node.y + 4})`}>
                            <rect x={rectX} y="-10" width={adaptiveWidth} height="20" rx="4" fill="white" fillOpacity="0.9" className="shadow-sm" />
                            <text
                                fontWeight="600"
                                fontSize="11"
                                fill={isGhost ? "#9ca3af" : "#1f2937"}
                                textAnchor={textAnchor}
                                className="truncate"
                            >
                            {node.title.length > 20 ? node.title.substring(0, 18) + '...' : node.title}
                            </text>
                        </g>
                        {/* 日期 - 在圆圈另一侧 */}
                        <g transform={`translate(${isLeftOfCenter ? node.x + 12 : node.x - 12}, ${node.y + 4})`}>
                            <text
                                fontSize="9"
                                fill={isGhost ? "#9ca3af" : "#6b7280"}
                                className="font-mono uppercase"
                                textAnchor={isLeftOfCenter ? "start" : "end"}
                            >
                            {new Date(node.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </text>
                        </g>
                    </>
                )}
              </g>
            );
          })}
       </svg>
    </div>
  );
};

export default GraphRenderer;
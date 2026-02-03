import React, { useState, useRef, useCallback } from 'react';
import { CheckCircle2, Circle, Trash2, ChevronDown } from 'lucide-react';
import { Task, TaskStatus, Branch } from '../types';

interface TaskTableRow {
  id: string;
  title: string;
  date: string;
  description: string;
  branchId: string;
  isNew: boolean;
}

interface MultiBranchTaskTableProps {
  tasks: Task[];
  branches: Branch[];
  onCreateTask: (task: { title: string; date: string; description?: string; branchId: string }) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
  onToggleTask: (taskId: string) => void;
}

const getTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

const MultiBranchTaskTable: React.FC<MultiBranchTaskTableProps> = ({
  tasks,
  branches,
  onCreateTask,
  onUpdateTask,
  onTaskClick,
  onToggleTask,
}) => {
  const [newRows, setNewRows] = useState<TaskTableRow[]>([]);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [showBranchDropdown, setShowBranchDropdown] = useState<string | null>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const getDefaultBranchId = () => {
    const activeBranch = branches.find(b => b.status === 'active');
    return activeBranch?.id || branches[0]?.id || '';
  };

  const addNewRow = useCallback((afterIndex?: number) => {
    const newRow: TaskTableRow = {
      id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: '',
      date: getTomorrow(),
      description: '',
      branchId: getDefaultBranchId(),
      isNew: true,
    };

    setNewRows((prev) => {
      const insertIndex = afterIndex !== undefined ? afterIndex + 1 : prev.length;
      const newRows = [...prev];
      newRows.splice(insertIndex, 0, newRow);
      return newRows;
    });

    setTimeout(() => {
      const input = inputRefs.current.get(`${newRow.id}-title`);
      input?.focus();
    }, 0);
  }, [getDefaultBranchId]);

  const updateNewRow = useCallback((id: string, field: keyof TaskTableRow, value: string) => {
    setNewRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  }, []);

  const deleteNewRow = useCallback((id: string) => {
    setNewRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const saveNewRow = useCallback(async (row: TaskTableRow) => {
    if (!row.title.trim()) return false;

    setSavingIds((prev) => new Set(prev).add(row.id));

    try {
      await onCreateTask({
        title: row.title.trim(),
        date: row.date,
        description: row.description.trim() || undefined,
        branchId: row.branchId,
      });
      setNewRows((prev) => prev.filter((r) => r.id !== row.id));
      return true;
    } catch (err) {
      console.error('Failed to save task:', err);
      return false;
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
    }
  }, [onCreateTask]);

  const handleDateChange = useCallback((task: Task, newDate: string) => {
    onUpdateTask(task.id, { date: newDate });
  }, [onUpdateTask]);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent, row: TaskTableRow, field: string, index: number) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();

        if (field === 'title') {
          if (row.title.trim()) {
            const saved = await saveNewRow(row);
            if (saved) {
              addNewRow(index);
            }
          } else {
            const dateInput = inputRefs.current.get(`${row.id}-date`);
            dateInput?.focus();
          }
        } else if (field === 'date') {
          const descInput = inputRefs.current.get(`${row.id}-description`);
          descInput?.focus();
        } else if (field === 'description') {
          if (row.title.trim()) {
            await saveNewRow(row);
          }
          addNewRow(index);
        }
      } else if (e.key === 'Tab' && !e.shiftKey && field === 'description') {
        if (index === newRows.length - 1) {
          e.preventDefault();
          if (row.title.trim()) {
            await saveNewRow(row);
          }
          addNewRow(index);
        }
      }
    },
    [addNewRow, saveNewRow, newRows.length]
  );

  const setInputRef = useCallback((el: HTMLInputElement | null, key: string) => {
    if (el) {
      inputRefs.current.set(key, el);
    } else {
      inputRefs.current.delete(key);
    }
  }, []);

  const getBranch = (id: string) => branches.find((b) => b.id === id);
  const getBranchColor = (id: string) => getBranch(id)?.color || '#999';

  const allRows: (Task | TaskTableRow)[] = [...tasks, ...newRows];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                Date
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                Branch
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allRows.map((row, index) => {
              const isNewRow = 'isNew' in row;
              const task = isNewRow ? null : row;
              const isCompleted = task?.status === TaskStatus.COMPLETED;
              const isSaving = savingIds.has(row.id);

              if (isNewRow) {
                const branchColor = getBranchColor(row.branchId);
                const branch = getBranch(row.branchId);

                return (
                  <tr key={row.id} className="bg-blue-50/30">
                    <td className="px-3 py-2">
                      <span className="inline-block w-5 h-5 rounded-full border-2 border-dashed border-gray-300" />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        ref={(el) => setInputRef(el, `${row.id}-title`)}
                        type="text"
                        value={row.title}
                        onChange={(e) => updateNewRow(row.id, 'title', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, row, 'title', index)}
                        onBlur={() => row.title.trim() && saveNewRow(row)}
                        disabled={isSaving}
                        placeholder="Enter task name..."
                        className="w-full px-2 py-1 rounded border-0 bg-transparent focus:ring-2 focus:ring-blue-200 focus:bg-white text-gray-800 placeholder:text-gray-400"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        ref={(el) => setInputRef(el, `${row.id}-date`)}
                        type="date"
                        value={row.date}
                        onChange={(e) => updateNewRow(row.id, 'date', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, row, 'date', index)}
                        disabled={isSaving}
                        className="w-full px-2 py-1 rounded border-0 bg-transparent focus:ring-2 focus:ring-blue-200 focus:bg-white text-sm text-gray-600"
                      />
                    </td>
                    <td className="px-3 py-2 relative">
                      <button
                        onClick={() => setShowBranchDropdown(showBranchDropdown === row.id ? null : row.id)}
                        className="flex items-center w-full px-2 py-1 rounded hover:bg-gray-100 text-left"
                      >
                        <div
                          className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                          style={{ backgroundColor: branchColor }}
                        />
                        <span className="text-xs text-gray-700 truncate flex-1">
                          {branch?.name || 'Select'}
                        </span>
                        <ChevronDown size={12} className="text-gray-400 ml-1" />
                      </button>

                      {showBranchDropdown === row.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowBranchDropdown(null)}
                          />
                          <div className="absolute left-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 max-h-48 overflow-auto">
                            {branches
                              .filter((b) => b.status === 'active')
                              .map((b) => (
                                <button
                                  key={b.id}
                                  onClick={() => {
                                    updateNewRow(row.id, 'branchId', b.id);
                                    setShowBranchDropdown(null);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center ${
                                    row.branchId === b.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                  }`}
                                >
                                  <div
                                    className="w-2 h-2 rounded-full mr-2"
                                    style={{ backgroundColor: b.color }}
                                  />
                                  {b.name}
                                </button>
                              ))}
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        ref={(el) => setInputRef(el, `${row.id}-description`)}
                        type="text"
                        value={row.description}
                        onChange={(e) => updateNewRow(row.id, 'description', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, row, 'description', index)}
                        onBlur={() => row.title.trim() && saveNewRow(row)}
                        disabled={isSaving}
                        placeholder="Optional description..."
                        className="w-full px-2 py-1 rounded border-0 bg-transparent focus:ring-2 focus:ring-blue-200 focus:bg-white text-sm text-gray-500 placeholder:text-gray-300"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => deleteNewRow(row.id)}
                        disabled={isSaving}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <button
                      onClick={() => onToggleTask(task!.id)}
                      className="transition-transform active:scale-90"
                    >
                      {isCompleted ? (
                        <CheckCircle2
                          size={20}
                          color={getBranchColor(task!.branchId)}
                          className="fill-current bg-white rounded-full"
                        />
                      ) : (
                        <Circle size={20} className="text-gray-300 hover:text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      onClick={() => onTaskClick(task!)}
                      className={`cursor-pointer ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                    >
                      {task!.title}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={task!.date}
                      onChange={(e) => handleDateChange(task!, e.target.value)}
                      className="w-full px-2 py-1 rounded border-0 bg-transparent focus:ring-2 focus:ring-blue-200 focus:bg-white text-sm text-gray-600"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center">
                      <div
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: getBranchColor(task!.branchId) }}
                      />
                      <span className="text-xs text-gray-700 truncate">
                        {getBranch(task!.branchId)?.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-sm text-gray-500">
                      {task!.description || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {/* No action for existing tasks */}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <button
          onClick={() => addNewRow()}
          className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors text-sm flex items-center justify-center mt-2"
        >
          + Add Task (Press Enter to save and add next)
        </button>
      </div>

      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 border-t">
        Tip: Enter task name and press Enter to auto-save. Date defaults to tomorrow.
      </div>
    </div>
  );
};

export default MultiBranchTaskTable;

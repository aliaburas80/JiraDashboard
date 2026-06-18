// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Drag-and-drop column reordering for the issue table.
// Uses the HTML5 drag-and-drop API — no extra library required.
// Column order is persisted to localStorage.
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface ColDef {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

interface Props {
  columns: ColDef[];
  rows: any[];
  emptyMessage: string;
  storageKey?: string;
  rowClassName?: (row: any) => string;
}

const STORAGE_PREFIX = 'dc_col_order_';

function loadOrder(storageKey: string, keys: string[]): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_PREFIX + storageKey) ?? '[]') as string[];
    // Only use saved order if it contains the same keys (handles schema changes)
    if (saved.length === keys.length && keys.every(k => saved.includes(k))) return saved;
  } catch {}
  return keys;
}

function saveOrder(storageKey: string, order: string[]): void {
  try { localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(order)); } catch {}
}

export default function DraggableMetricTable({ columns, rows, emptyMessage, storageKey = 'default', rowClassName }: Props) {
  const defaultOrder = columns.map(c => c.key);
  const [order, setOrder] = useState<string[]>(defaultOrder);
  const [dragKey, setDragKey]     = useState<string | null>(null);
  const [overKey, setOverKey]     = useState<string | null>(null);
  const [isReordered, setIsReordered] = useState(false);
  const initialized = useRef(false);

  // Load persisted order on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const saved = loadOrder(storageKey, defaultOrder);
    setOrder(saved);
    setIsReordered(JSON.stringify(saved) !== JSON.stringify(defaultOrder));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build ordered columns
  const orderedColumns = order.map(k => columns.find(c => c.key === k)!).filter(Boolean);

  const handleDragStart = useCallback((key: string) => setDragKey(key), []);
  const handleDragEnd   = useCallback(() => { setDragKey(null); setOverKey(null); }, []);

  const handleDragOver = useCallback((e: React.DragEvent, key: string) => {
    e.preventDefault();
    setOverKey(key);
  }, []);

  const handleDrop = useCallback((targetKey: string) => {
    if (!dragKey || dragKey === targetKey) return;
    setOrder(prev => {
      const next = [...prev];
      const fromIdx = next.indexOf(dragKey);
      const toIdx   = next.indexOf(targetKey);
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, dragKey);
      saveOrder(storageKey, next);
      setIsReordered(JSON.stringify(next) !== JSON.stringify(defaultOrder));
      return next;
    });
    setDragKey(null);
    setOverKey(null);
  }, [dragKey, storageKey, defaultOrder]);

  function resetOrder() {
    setOrder(defaultOrder);
    saveOrder(storageKey, defaultOrder);
    setIsReordered(false);
  }

  if (!rows?.length) return <p className="text-sm text-slate-500 italic py-2">{emptyMessage}</p>;

  return (
    <div>
      {/* Reorder hint + reset */}
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[10px] flex items-center gap-1" style={{ color: 'var(--dc-p3, #505050)' }}>
          <span>⠿</span> Drag column headers to reorder
        </p>
        {isReordered && (
          <button type="button" onClick={resetOrder}
            className="text-[10px] font-semibold hover:underline" style={{ color: 'var(--dc-acc2, #FF8A4C)' }}>
            Reset columns
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="flow-table w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))', background: 'var(--dc-s1, #141414)' }}>
              {orderedColumns.map(c => (
                <th
                  key={c.key}
                  draggable
                  onDragStart={() => handleDragStart(c.key)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => handleDragOver(e, c.key)}
                  onDrop={() => handleDrop(c.key)}
                  className={[
                    'px-3 py-2 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap',
                    'cursor-grab active:cursor-grabbing select-none transition-all',
                    dragKey === c.key  ? 'opacity-40' : '',
                    overKey === c.key && dragKey !== c.key ? 'border-l-2 border-orange-500' : '',
                  ].join(' ')}
                  style={{ color: 'var(--dc-p3, #505050)' }}
                >
                  <span className="flex items-center gap-1">
                    <span className="text-slate-300 text-base leading-none">⠿</span>
                    {c.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id || row.key || row.name || row.assignee || row.epic || idx}
                className={[rowClassName?.(row) ?? ''].join(' ')}
                style={{
                  borderBottom: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))',
                  background: idx % 2 === 1 ? 'var(--dc-s1, #141414)' : 'transparent',
                }}
              >
                {orderedColumns.map(c => (
                  <td key={c.key} className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>
                    {c.render ? c.render(row) : (row as any)[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

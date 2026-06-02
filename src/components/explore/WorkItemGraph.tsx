// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';

import { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { RelationGraph, RelationNode, RelationEdge } from '@/types/relations';
import { NODE_TYPE_CONFIG, EDGE_TYPE_CONFIG, ORPHAN_STYLE } from './nodeStyles';
import RelationLegend from './RelationLegend';

// ── Dagre layout (async to avoid SSR) ────────────────────────────────────────

async function applyDagreLayout(
  rfNodes: Node[],
  rfEdges: Edge[],
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const dagreLib = await import('@dagrejs/dagre');
  const dagre = dagreLib.default ?? dagreLib;
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', ranksep: 90, nodesep: 50 });

  rfNodes.forEach(n => g.setNode(n.id, { width: n.data._w ?? 220, height: n.data._h ?? 100 }));
  rfEdges.forEach(e => { try { g.setEdge(e.source, e.target); } catch {} });
  dagre.layout(g);

  const nodes = rfNodes.map(n => {
    const pos = g.node(n.id);
    if (!pos) return n;
    return { ...n, position: { x: pos.x - (n.data._w ?? 220) / 2, y: pos.y - (n.data._h ?? 100) / 2 } };
  });

  return { nodes, edges: rfEdges };
}

// ── Custom node card ───────────────────────────────────────────────────────────

function IssueNodeCard({ data }: { data: RelationNode & { _w: number; _h: number; onToggle?: (id: string) => void } }) {
  const cfg      = NODE_TYPE_CONFIG[data.type] ?? NODE_TYPE_CONFIG['Unknown'];
  const isOrphan = data.isOrphan;
  const isRiskPath    = data.isOnRiskPath && !data.isFocusNode;
  const isBranchRoot  = data.isLargestBranch && !data.isOnRiskPath && !data.isFocusNode && !data.isDone;
  const border   = isOrphan
    ? `2px dashed ${ORPHAN_STYLE.badgeColor}`
    : isRiskPath && !data.isDone
    ? `2px solid #dc2626`
    : isBranchRoot
    ? `2px solid #7c3aed`
    : `2px solid ${data.isFocusNode ? cfg.color : cfg.border}`;
  const bg = isOrphan ? ORPHAN_STYLE.bg
    : isRiskPath && !data.isDone ? '#fff5f5'
    : isBranchRoot ? '#faf5ff'
    : cfg.bg;
  const w  = data._w;

  return (
    <div style={{
      width: w, border, background: bg, borderRadius: 12,
      padding: '10px 12px', cursor: 'pointer',
      boxShadow: data.isFocusNode
        ? `0 0 0 3px ${cfg.color}40, 0 2px 8px rgba(0,0,0,.12)`
        : isRiskPath && !data.isDone
        ? '0 0 0 3px rgba(220,38,38,0.15), 0 2px 8px rgba(220,38,38,0.10)'
        : '0 1px 4px rgba(0,0,0,.08)',
    }}>
      {/* Type + badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13 }}>{cfg.icon}</span>
        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: cfg.color, flex: 1 }}>
          {data.type}
        </span>
        {data.isFocusNode && (
          <span style={{ fontSize: 9, background: cfg.color, color: '#fff', borderRadius: 999, padding: '1px 6px', fontWeight: 700 }}>FOCUS</span>
        )}
        {isRiskPath && !data.isDone && !data.isFocusNode && (
          <span style={{ fontSize: 9, background: '#dc2626', color: '#fff', borderRadius: 999, padding: '1px 6px', fontWeight: 700 }}>⚠ RISK PATH</span>
        )}
        {isBranchRoot && (
          <span style={{ fontSize: 9, background: '#7c3aed', color: '#fff', borderRadius: 999, padding: '1px 6px', fontWeight: 700 }}>📊 MOST WORK</span>
        )}
        {isOrphan && (
          <span style={{ fontSize: 9, background: ORPHAN_STYLE.badgeColor, color: '#fff', borderRadius: 999, padding: '1px 6px', fontWeight: 700 }}>ORPHAN</span>
        )}
      </div>

      {/* Key */}
      <p style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: cfg.color, margin: '0 0 3px' }}>
        {data.issueKey}
      </p>

      {/* Summary */}
      <p style={{
        fontSize: 11, color: '#334155', lineHeight: 1.4, margin: '0 0 6px',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {data.summary}
      </p>

      {/* Chips */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{
          fontSize: 9, borderRadius: 999, padding: '1px 6px', fontWeight: 600,
          background: data.isDone ? '#dcfce7' : '#f1f5f9',
          color:      data.isDone ? '#15803d' : '#475569',
          border:     '1px solid ' + (data.isDone ? '#bbf7d0' : '#e2e8f0'),
        }}>{data.status}</span>
        {data.isBlocked && (
          <span style={{ fontSize: 9, background: '#fef2f2', color: '#b91c1c', borderRadius: 999, padding: '1px 6px', fontWeight: 700, border: '1px solid #fecaca' }}>
            🚫 Blocked
          </span>
        )}
        {(data.storyPoints ?? 0) > 0 && (
          <span style={{ fontSize: 9, background: '#f5f3ff', color: '#7c3aed', borderRadius: 999, padding: '1px 6px', fontWeight: 600, border: '1px solid #ddd6fe' }}>
            {data.storyPoints}pt
          </span>
        )}
      </div>

      {/* Assignee */}
      {data.assignee && data.assignee !== 'Unassigned' && (
        <p style={{ fontSize: 10, color: '#94a3b8', margin: '4px 0 0' }}>👤 {data.assignee}</p>
      )}

      {/* Expand badge */}
      {data.childCount > 0 && !data.isExpanded && (
        <button
          onClick={e => { e.stopPropagation(); data.onToggle?.(data.id); }}
          style={{
            marginTop: 6, width: '100%', fontSize: 10, fontWeight: 700,
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6,
            padding: '2px 0', color: '#475569', cursor: 'pointer',
          }}
        >
          +{data.childCount} children
        </button>
      )}
    </div>
  );
}

const nodeTypes = { issueNode: IssueNodeCard };

// ── Conversion helpers ────────────────────────────────────────────────────────

function toRFNode(node: RelationNode, onToggle: (id: string) => void): Node {
  const cfg = NODE_TYPE_CONFIG[node.type] ?? NODE_TYPE_CONFIG['Unknown'];
  const w   = cfg.size === 'lg' ? 240 : cfg.size === 'sm' ? 180 : 210;
  const h   = 110;
  return {
    id:       node.id,
    type:     'issueNode',
    data:     { ...node, _w: w, _h: h, onToggle },
    position: { x: 0, y: 0 },
  };
}

function toRFEdge(edge: RelationEdge): Edge {
  const cfg = EDGE_TYPE_CONFIG[edge.type] ?? EDGE_TYPE_CONFIG['relates-to'];
  // Risk-path edges: thicker red, animated
  const isRisk = edge.isOnRiskPath && edge.type !== 'blocks';
  const strokeColor = isRisk ? '#dc2626' : cfg.strokeColor;
  const strokeWidth = isRisk ? Math.max(cfg.strokeWidth, 2.5) : cfg.strokeWidth;
  return {
    id:        edge.id,
    source:    edge.sourceId,
    target:    edge.targetId,
    label:     edge.label,
    animated:  isRisk ? true : cfg.animated,
    style:     { stroke: strokeColor, strokeWidth, strokeDasharray: isRisk ? '0' : (cfg.strokeDasharray ?? '0') },
    markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
  };
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  graph: RelationGraph;
  focusNodeId?: string;
  onNodeFocus?: (key: string) => void;
}

export default function WorkItemGraph({ graph, onNodeFocus }: Props) {
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const prevFocusKey = useRef('');

  const handleToggle = useCallback((id: string) => {
    setRfNodes(prev =>
      prev.map(n => n.id === id ? { ...n, data: { ...n.data, isExpanded: !n.data.isExpanded } } : n),
    );
  }, [setRfNodes]);

  useEffect(() => {
    if (graph.focusKey === prevFocusKey.current) return;
    prevFocusKey.current = graph.focusKey;

    const nodes = [
      ...graph.nodes.map(n  => toRFNode(n, handleToggle)),
      ...graph.orphanNodes.map(n => toRFNode(n, handleToggle)),
    ];
    const edges = graph.edges.map(toRFEdge);

    applyDagreLayout(nodes, edges).then(({ nodes: ln, edges: le }) => {
      setRfNodes(ln);
      setRfEdges(le);
    });
  }, [graph, handleToggle, setRfNodes, setRfEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onNodeFocus?.(node.data.issueKey);
  }, [onNodeFocus]);

  return (
    <div className="relative w-full" style={{ height: 540, background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.15}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={n => {
            const cfg = NODE_TYPE_CONFIG[n.data?.type as keyof typeof NODE_TYPE_CONFIG];
            return cfg?.color ?? '#94a3b8';
          }}
          maskColor="rgba(248,250,252,0.7)"
        />
      </ReactFlow>
      <RelationLegend />
    </div>
  );
}

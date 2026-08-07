// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { RelationGraph, RelationNode, RelationEdge, NodeTypeConfig } from '@/types/relations';
import type { IssueTypeDefinition } from '@/types/issueTypeHierarchy';
import { DEFAULT_ISSUE_TYPES } from '@/types/issueTypeHierarchy';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { buildNodeTypeConfig, EDGE_TYPE_CONFIG } from './nodeStyles';
import RelationLegend from './RelationLegend';
import styles from './WorkItemGraph.module.scss';

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

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

function IssueNodeCard({ data }: { data: RelationNode & { _w: number; _h: number; _cfg: NodeTypeConfig; onToggle?: (id: string) => void } }) {
  const cfg      = data._cfg;
  const isOrphan = data.isOrphan;
  const isRiskPath    = data.isOnRiskPath && !data.isFocusNode;
  const isBranchRoot  = data.isLargestBranch && !data.isOnRiskPath && !data.isFocusNode && !data.isDone;
  const tone = isOrphan ? 'orphan' : isRiskPath && !data.isDone ? 'risk' : isBranchRoot ? 'branch' : undefined;

  // DYNAMIC CSS VARIABLE:
  // Card width is per-node-size-tier; border/background/badge colors come
  // from the admin-configured issue-type palette (cfg), which is arbitrary
  // per type and cannot be expressed as a fixed class.
  const cardVars: CSSVars = {
    '--node-width': `${data._w}px`,
    '--node-border-color': data.isFocusNode ? cfg.color : cfg.border,
    '--node-bg': cfg.bg,
    '--node-type-color': cfg.color,
    '--node-focus-shadow': `${cfg.color}40`,
  };

  return (
    <div className={styles.card} data-tone={tone} data-focus={data.isFocusNode} style={cardVars}>
      {/* Connection points — required for React Flow to anchor edge paths to this node */}
      <Handle type="target" position={Position.Top} isConnectable={false} className={styles.handle} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} className={styles.handle} />

      {/* Type + badges */}
      <div className={styles.badgeRow}>
        <SvgIcon name={cfg.icon} size={13} style={{ color: cfg.color }} />
        <span className={styles.typeLabel}>
          {data.type}
        </span>
        {data.isFocusNode && (
          <span className={styles.focusBadge}>FOCUS</span>
        )}
        {isRiskPath && !data.isDone && !data.isFocusNode && (
          <span className={styles.riskBadge}>
            <SvgIcon name="warning" size={9} />
            RISK PATH
          </span>
        )}
        {isBranchRoot && (
          <span className={styles.branchBadge}>
            <SvgIcon name="chartBar" size={9} />
            MOST WORK
          </span>
        )}
        {isOrphan && (
          <span className={styles.orphanBadge}>ORPHAN</span>
        )}
      </div>

      {/* Key */}
      <p className={styles.issueKey}>
        {data.issueKey}
      </p>

      {/* Summary */}
      <p className={styles.summary}>
        {data.summary}
      </p>

      {/* Chips */}
      <div className={styles.chipsRow}>
        <span className={styles.statusChip} data-done={data.isDone}>{data.status}</span>
        {data.isBlocked && (
          <span className={styles.blockedChip}>
            <SvgIcon name="priorityBlocker" size={9} style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: 3 }} />
            Blocked
          </span>
        )}
        {(data.storyPoints ?? 0) > 0 && (
          <span className={styles.pointsChip}>
            {data.storyPoints}pt
          </span>
        )}
      </div>

      {/* Assignee */}
      {data.assignee && data.assignee !== 'Unassigned' && (
        <p className={styles.assigneeRow}>
          <SvgIcon name="person" size={10} />
          {data.assignee}
        </p>
      )}

      {/* Expand badge */}
      {data.childCount > 0 && !data.isExpanded && (
        <button
          onClick={e => { e.stopPropagation(); data.onToggle?.(data.id); }}
          className={styles.expandBtn}
        >
          +{data.childCount} children
        </button>
      )}
    </div>
  );
}

const nodeTypes = { issueNode: IssueNodeCard };

// ── Conversion helpers ────────────────────────────────────────────────────────

function toRFNode(
  node: RelationNode,
  onToggle: (id: string) => void,
  nodeTypeConfig: Record<string, NodeTypeConfig>,
  dimNonRisk = false,
): Node {
  const cfg = nodeTypeConfig[node.type] ?? nodeTypeConfig['Unknown'];
  const w   = cfg.size === 'lg' ? 240 : cfg.size === 'sm' ? 180 : 210;
  const h   = 110;
  const shouldDim = dimNonRisk && !node.isOnRiskPath && !node.isFocusNode;
  return {
    id:       node.id,
    type:     'issueNode',
    data:     { ...node, _w: w, _h: h, _cfg: cfg, onToggle },
    position: { x: 0, y: 0 },
    style:    shouldDim ? { opacity: 0.2, filter: 'grayscale(1)' } : undefined,
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
  dimNonRiskPath?: boolean;  // when true, non-risk-path nodes appear faded
  issueTypes?: IssueTypeDefinition[]; // admin-configured types; falls back to defaults
}

export default function WorkItemGraph({ graph, onNodeFocus, dimNonRiskPath = false, issueTypes = DEFAULT_ISSUE_TYPES }: Props) {
  const nodeTypeConfig = useMemo(() => buildNodeTypeConfig(issueTypes), [issueTypes]);
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const prevFocusKey = useRef('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleToggle = useCallback((id: string) => {
    setRfNodes(prev =>
      prev.map(n => n.id === id ? { ...n, data: { ...n.data, isExpanded: !n.data.isExpanded } } : n),
    );
  }, [setRfNodes]);

  useEffect(() => {
    prevFocusKey.current = graph.focusKey;

    const nodes = [
      ...graph.nodes.map(n  => toRFNode(n, handleToggle, nodeTypeConfig, dimNonRiskPath)),
      ...graph.orphanNodes.map(n => toRFNode(n, handleToggle, nodeTypeConfig, dimNonRiskPath)),
    ];
    const edges = graph.edges.map(e => {
      const rf = toRFEdge(e);
      if (dimNonRiskPath && !e.isOnRiskPath) {
        return { ...rf, style: { ...rf.style, opacity: 0.1 }, animated: false };
      }
      return rf;
    });

    applyDagreLayout(nodes, edges).then(({ nodes: ln, edges: le }) => {
      setRfNodes(ln);
      setRfEdges(le);
    });
  }, [graph, dimNonRiskPath, handleToggle, setRfNodes, setRfEdges, nodeTypeConfig]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onNodeFocus?.(node.data.issueKey);
  }, [onNodeFocus]);

  return (
    <div className={styles.graphWrap}>
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
        <Background color="var(--color-border)" gap={20} />
        <Controls showInteractive={false} />
        {!isMobile && (
          <MiniMap
            nodeColor={n => {
              const cfg = nodeTypeConfig[n.data?.type as string];
              return cfg?.color ?? 'var(--color-text-muted)';
            }}
            maskColor="color-mix(in srgb, var(--dc-bg) 70%, transparent)"
          />
        )}
      </ReactFlow>
      <RelationLegend />
    </div>
  );
}

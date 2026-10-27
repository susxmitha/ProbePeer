import React, { useState, useEffect } from 'react';
import {
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Info,
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ResearchProject, GraphNode, GraphEdge, GraphNodeType } from '../../types';
import { api } from '../../services/api';
import { hasGraphChanged, getDebouncedSyncActivityHistory } from '../../services/graphSync';
import { useTheme } from '../../context/ThemeContext';

interface DecisionGraphViewProps {
  project: ResearchProject;
  onUpdateProject: (updated: Partial<ResearchProject>) => void;
}

export const DecisionGraphView: React.FC<DecisionGraphViewProps> = ({
  project,
  onUpdateProject
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync graph on mount or when upstream scientific objects change, but ONLY if the graph actually changed
  useEffect(() => {
    const updatedGraph = api.syncDecisionGraph(project);
    const hasExistingNodes = Boolean(project.decisionGraph?.nodes && project.decisionGraph.nodes.length > 0);
    const changed = hasGraphChanged(project.decisionGraph, updatedGraph);

    // Only sync if there are actual structural or status changes, or if graph is uninitialized
    if (changed || !hasExistingNodes) {
      performSync(false, updatedGraph);
    }
  }, [
    project.id,
    project.researchQuestion,
    project.hypothesis,
    project.candidateGaps,
    project.sources,
    project.dataset?.rowCount,
    project.dataset?.missingnessRate,
    project.dataset?.columns?.length,
    project.dataset?.dataQualityWarnings?.length,
    project.methodPlan?.primaryMethod,
    project.methodPlan?.frozenAt,
    project.executionRuns?.length,
    project.manuscript?.sections
  ]);

  const performSync = (
    isManual: boolean = false,
    precomputedGraph?: { nodes: GraphNode[]; edges: GraphEdge[] }
  ) => {
    setIsSyncing(true);
    const updatedGraph = precomputedGraph || api.syncDecisionGraph(project);
    const changed = hasGraphChanged(project.decisionGraph, updatedGraph);

    // Calculate debounced and deduplicated history
    const { updatedHistory, wasAppended, wasUpdated } = getDebouncedSyncActivityHistory(
      project.activityHistory || [],
      updatedGraph.nodes.length,
      updatedGraph.edges.length,
      changed,
      isManual
    );

    // If there were no graph changes and not a manual request, do not trigger project update
    if (!changed && !isManual && project.decisionGraph?.nodes?.length) {
      setIsSyncing(false);
      return;
    }

    const payload: Partial<ResearchProject> = {
      decisionGraph: updatedGraph
    };

    if (wasAppended || wasUpdated) {
      payload.activityHistory = updatedHistory;
    }

    onUpdateProject(payload);

    if (isManual) {
      if (changed) {
        setSyncNotice(`Graph re-indexed: ${updatedGraph.nodes.length} nodes, ${updatedGraph.edges.length} edges.`);
      } else {
        setSyncNotice(`Graph is already up to date (${updatedGraph.nodes.length} nodes).`);
      }
      setTimeout(() => setSyncNotice(null), 3000);
    }
    setIsSyncing(false);
  };

  const handleManualSync = () => {
    performSync(true);
  };

  const nodes = project.decisionGraph?.nodes || [];
  const edges = project.decisionGraph?.edges || [];

  // Downstream dependency propagation helper
  const handlePropagateImpact = (nodeId: string) => {
    const affected = new Set<string>();
    affected.add(nodeId);

    let changed = true;
    while (changed) {
      changed = false;
      edges.forEach((edge) => {
        if (affected.has(edge.source) && !affected.has(edge.target)) {
          affected.add(edge.target);
          changed = true;
        }
      });
    }

    setHighlightedNodes(affected);
  };

  const getNodeColor = (type: GraphNodeType, status?: string) => {
    if (status === 'flagged' || status === 'failed') {
      return isDark
        ? { fill: '#331b20', stroke: '#d47b85', text: '#fca5a5' }
        : { fill: '#faedef', stroke: '#8c3946', text: '#68222d' };
    }
    switch (type) {
      case 'research_question':
      case 'hypothesis':
        return isDark
          ? { fill: '#2a1f2e', stroke: '#c4a4cd', text: '#f3e8f7' }
          : { fill: '#f5eff8', stroke: '#5c4a6b', text: '#402e4d' };
      case 'literature_source':
      case 'evidence_statement':
      case 'candidate_gap':
        return isDark
          ? { fill: '#271e2c', stroke: '#b99bc7', text: '#e7d8ed' }
          : { fill: '#f8f2f9', stroke: '#7d5e90', text: '#503560' };
      case 'dataset':
      case 'variable':
        return isDark
          ? { fill: '#1b2821', stroke: '#7a9c8a', text: '#d1e7db' }
          : { fill: '#eef4f0', stroke: '#4a6b5a', text: '#2e4a3b' };
      case 'analysis_plan':
      case 'method':
        return isDark
          ? { fill: '#2c2317', stroke: '#cca36d', text: '#fde8cc' }
          : { fill: '#faf3e8', stroke: '#8c6239', text: '#5c3e1e' };
      case 'execution_run':
      case 'result':
        return isDark
          ? { fill: '#1c2432', stroke: '#8ba3c7', text: '#d9e7f8' }
          : { fill: '#edf4fb', stroke: '#658ab8', text: '#284670' };
      case 'manuscript_section':
      case 'conclusion':
        return isDark
          ? { fill: '#301f2d', stroke: '#d69ac2', text: '#fbe4f3' }
          : { fill: '#faf0f7', stroke: '#864f77', text: '#582d4d' };
      default:
        return isDark
          ? { fill: '#241c22', stroke: '#3a2e38', text: '#eae6eb' }
          : { fill: '#ffffff', stroke: '#e6dfdc', text: '#2e2a2b' };
    }
  };

  // Compute clean layout coordinates for nodes in tiered vertical layers
  const layoutNodes = () => {
    const typeLayers: Record<string, number> = {
      candidate_gap: 0,
      literature_source: 0,
      research_question: 1,
      hypothesis: 1,
      dataset: 2,
      variable: 2,
      analysis_plan: 3,
      method: 3,
      execution_run: 4,
      result: 5,
      manuscript_section: 6,
      conclusion: 6
    };

    const layerBuckets: Record<number, GraphNode[]> = {};
    nodes.forEach((n) => {
      if (filterType !== 'all' && n.type !== filterType) return;
      const layer = typeLayers[n.type] ?? 3;
      if (!layerBuckets[layer]) layerBuckets[layer] = [];
      layerBuckets[layer].push(n);
    });

    const positioned: (GraphNode & { cx: number; cy: number })[] = [];
    const sortedLayers = Object.keys(layerBuckets).map(Number).sort((a, b) => a - b);

    sortedLayers.forEach((layerIdx) => {
      const bucket = layerBuckets[layerIdx];
      const count = bucket.length;
      const y = 80 + layerIdx * 110;
      bucket.forEach((node, i) => {
        const x = 120 + ((i + 1) * 760) / (count + 1);
        positioned.push({ ...node, cx: x, cy: y });
      });
    });

    return positioned;
  };

  const positionedNodes = layoutNodes();
  const nodePositionMap = new Map(positionedNodes.map((n) => [n.id, { x: n.cx, y: n.cy }]));

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#1c1917] tracking-tight">
            The Research Decision Graph
          </h1>
          <p className="text-xs text-[#78716c] mt-1 max-w-2xl leading-relaxed">
            Every scientific object is versioned and interconnected. If an upstream dataset, method, or result changes, downstream evidence statements and manuscript claims are automatically flagged for review.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {syncNotice && (
            <span className="text-[11px] text-emerald-800 font-mono bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
              {syncNotice}
            </span>
          )}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-xs font-medium text-[#44403c] bg-white border border-[#d6d3cb] hover:bg-[#f2efe9] px-3 py-1.5 rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Re-sync Graph'}</span>
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white border border-[#e7e5e0] rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Node Filter */}
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-[#78716c]" />
          <span className="font-semibold text-[#78716c] uppercase text-[10px]">Filter View:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#faf9f5] border border-[#d6d3cb] text-[#1c1917] rounded px-2 py-1 text-xs"
          >
            <option value="all">All Graph Nodes ({nodes.length})</option>
            <option value="research_question">Research Questions & Hypotheses</option>
            <option value="literature_source">Literature Sources</option>
            <option value="candidate_gap">Research Gaps</option>
            <option value="dataset">Datasets & Variables</option>
            <option value="analysis_plan">Analysis Protocols</option>
            <option value="execution_run">Execution Runs & Results</option>
            <option value="manuscript_section">Manuscript Sections</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)]"></span> Questions/Hypotheses
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#b99bc7]"></span> Evidence/Gaps
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--status-success)]"></span> Datasets
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-chart)]"></span> Runs/Results
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border border-[#d6d3cb] rounded bg-[#faf9f5] p-0.5">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
            className="p-1 hover:bg-white rounded text-[#44403c]"
            title="Zoom out"
          >
            <ZoomOut size={13} />
          </button>
          <span className="text-[10px] font-mono px-1.5 text-[#78716c]">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
            className="p-1 hover:bg-white rounded text-[#44403c]"
            title="Zoom in"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1);
              setHighlightedNodes(new Set());
            }}
            className="p-1 hover:bg-white rounded text-[#44403c]"
            title="Reset view"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Graph Viewport */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-2 overflow-auto shadow-none min-h-[550px] relative">
          <svg
            viewBox="0 0 960 760"
            className="w-full h-auto transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill={isDark ? '#9a8f9b' : '#a8a29e'} />
              </marker>
              <marker
                id="arrowhead-highlight"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill={isDark ? '#c4a4cd' : '#5c4a6b'} />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map((edge) => {
              const srcPos = nodePositionMap.get(edge.source);
              const tgtPos = nodePositionMap.get(edge.target);
              if (!srcPos || !tgtPos) return null;

              const isHighlighted =
                highlightedNodes.has(edge.source) && highlightedNodes.has(edge.target);

              return (
                <g key={edge.id}>
                  <line
                    x1={srcPos.x}
                    y1={srcPos.y}
                    x2={tgtPos.x}
                    y2={tgtPos.y}
                    stroke={isHighlighted ? 'var(--accent-primary)' : 'var(--border)'}
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    strokeDasharray={edge.relationship === 'depends_on' ? '4,3' : undefined}
                    markerEnd={isHighlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                  />
                  {edge.label && (
                    <text
                      x={(srcPos.x + tgtPos.x) / 2}
                      y={(srcPos.y + tgtPos.y) / 2 - 4}
                      fill="var(--text-muted)"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {positionedNodes.map((node) => {
              const colors = getNodeColor(node.type, node.status);
              const isSelected = selectedNode?.id === node.id;
              const isHighlighted = highlightedNodes.has(node.id);

              return (
                <g
                  key={node.id}
                  onClick={() => {
                    setSelectedNode(node);
                    handlePropagateImpact(node.id);
                  }}
                  className="cursor-pointer transition-opacity"
                  opacity={
                    highlightedNodes.size > 0 && !isHighlighted ? 0.35 : 1
                  }
                >
                  <rect
                    x={node.cx - 85}
                    y={node.cy - 24}
                    width={170}
                    height={48}
                    rx={6}
                    fill={colors.fill}
                    stroke={isHighlighted ? '#e11d48' : isSelected ? '#1c1917' : colors.stroke}
                    strokeWidth={isHighlighted ? 2.5 : isSelected ? 2 : 1.2}
                    className="transition-all"
                  />
                  <text
                    x={node.cx}
                    y={node.cy - 6}
                    fill={colors.text}
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                    className="select-none font-sans"
                  >
                    {node.label.length > 22 ? node.label.slice(0, 22) + '...' : node.label}
                  </text>
                  <text
                    x={node.cx}
                    y={node.cy + 12}
                    fill="#78716c"
                    fontSize="8.5"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="select-none"
                  >
                    {node.type.replace('_', ' ')}
                  </text>
                </g>
              );
            })}
          </svg>

          {highlightedNodes.size > 1 && (
            <div className="absolute bottom-3 left-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs px-3 py-1.5 rounded-md flex items-center gap-2 shadow-xs">
              <AlertTriangle size={13} className="text-rose-600" />
              <span>
                Cascade: <strong>{highlightedNodes.size}</strong> interconnected downstream object(s) impacted.
              </span>
            </div>
          )}
        </div>

        {/* Selected Node Details Drawer */}
        <div className="bg-white border border-[#e7e5e0] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#f2f1ec] pb-3">
            <h3 className="text-xs font-semibold text-[#1c1917] uppercase tracking-wider">
              Node Inspector
            </h3>
            <span className="text-[10px] font-mono text-[#78716c]">
              {selectedNode ? selectedNode.id : 'None selected'}
            </span>
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-mono text-[#78716c] uppercase block">
                  Node Type
                </span>
                <span className="font-semibold text-[#1c1917] capitalize">
                  {selectedNode.type.replace('_', ' ')}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#78716c] uppercase block">
                  Label
                </span>
                <p className="font-medium text-[#1c1917]">{selectedNode.label}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#78716c] uppercase block">
                  Recorded Content & Description
                </span>
                <p className="text-[#44403c] bg-[#faf9f5] border border-[#e7e5e0] rounded p-2.5 mt-1 leading-relaxed">
                  {selectedNode.description || 'No description recorded.'}
                </p>
              </div>

              <div className="pt-2 border-t border-[#f2f1ec]">
                <button
                  onClick={() => handlePropagateImpact(selectedNode.id)}
                  className="w-full text-xs font-medium text-white bg-[#1c1917] hover:bg-[#292524] py-2 rounded-md transition-colors"
                >
                  Trace Downstream Dependencies
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#78716c]">
              <Info size={20} className="mx-auto text-[#a8a29e] mb-2" />
              <p>Click any node in the graph above to inspect metadata and trace dependency propagation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

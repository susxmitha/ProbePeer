import { GraphNode, GraphEdge, ActivityEvent } from '../types';

export const GRAPH_SYNC_ACTION = 'Research Decision Graph Synchronized';
export const GRAPH_SYNC_DEBOUNCE_MS = 60_000; // 60 seconds

/**
 * Checks if the decision graph has actually changed in terms of:
 * - Number of nodes or edges
 * - Node IDs, statuses (e.g. pending -> passed), labels, descriptions, or flags
 * - Edge IDs, sources, targets, relationships, or labels
 */
export function hasGraphChanged(
  prevGraph?: { nodes: GraphNode[]; edges: GraphEdge[] } | null,
  nextGraph?: { nodes: GraphNode[]; edges: GraphEdge[] } | null
): boolean {
  if (!prevGraph && !nextGraph) return false;
  if (!prevGraph || !nextGraph) return true;
  if (!prevGraph.nodes || !nextGraph.nodes) return true;
  if (!prevGraph.edges || !nextGraph.edges) return true;

  if (prevGraph.nodes.length !== nextGraph.nodes.length) return true;
  if (prevGraph.edges.length !== nextGraph.edges.length) return true;

  // Compare each node in nextGraph against prevGraph
  for (let i = 0; i < nextGraph.nodes.length; i++) {
    const nextNode = nextGraph.nodes[i];
    const prevNode = prevGraph.nodes.find((n) => n.id === nextNode.id);
    if (!prevNode) return true;
    if (
      prevNode.status !== nextNode.status ||
      prevNode.label !== nextNode.label ||
      prevNode.description !== nextNode.description ||
      JSON.stringify(prevNode.data || {}) !== JSON.stringify(nextNode.data || {})
    ) {
      return true;
    }
  }

  // Compare each edge in nextGraph against prevGraph
  for (let i = 0; i < nextGraph.edges.length; i++) {
    const nextEdge = nextGraph.edges[i];
    const prevEdge = prevGraph.edges.find((e) => e.id === nextEdge.id);
    if (!prevEdge) return true;
    if (
      prevEdge.source !== nextEdge.source ||
      prevEdge.target !== nextEdge.target ||
      prevEdge.relationship !== nextEdge.relationship ||
      prevEdge.label !== nextEdge.label
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Calculates updated activity history when syncing the decision graph.
 * Enforces:
 * 1. Deduplication: If the most recent event in the ledger is already "Research Decision Graph Synchronized",
 *    do not append another one; update timestamp and details in place.
 * 2. Time-Bound Debounce: If the last sync event occurred < 60 seconds ago, do not log a new one;
 *    update the existing event's timestamp or ignore if no meaningful change.
 * 3. Actual Changes Only: Only log when the graph actually changes (e.g. new node, edge, or status change).
 *    Do not log on simple React re-renders or page navigation.
 */
export function getDebouncedSyncActivityHistory(
  currentHistory: ActivityEvent[] = [],
  nodesCount: number,
  edgesCount: number,
  graphChanged: boolean,
  isManual: boolean = false
): { updatedHistory: ActivityEvent[]; wasAppended: boolean; wasUpdated: boolean } {
  const now = Date.now();
  const details = `Re-indexed ${nodesCount} nodes and ${edgesCount} dependency edges.`;

  // If no change occurred and it's not a manual sync, do not modify history at all
  if (!graphChanged && !isManual) {
    return { updatedHistory: currentHistory, wasAppended: false, wasUpdated: false };
  }

  const lastEvent = currentHistory[0];
  const isMostRecentSync = lastEvent && lastEvent.action === GRAPH_SYNC_ACTION;

  // Find the most recent sync event anywhere in the history
  const lastSyncIndex = currentHistory.findIndex((e) => e.action === GRAPH_SYNC_ACTION);
  const lastSyncEvent = lastSyncIndex !== -1 ? currentHistory[lastSyncIndex] : null;
  const lastSyncTimestamp = lastSyncEvent ? new Date(lastSyncEvent.timestamp).getTime() : 0;
  const elapsedMs = now - lastSyncTimestamp;
  const isWithinDebounceWindow =
    lastSyncEvent !== null && !isNaN(lastSyncTimestamp) && elapsedMs < GRAPH_SYNC_DEBOUNCE_MS;

  // If graph didn't change and within debounce window, ignore entirely
  if (!graphChanged && isWithinDebounceWindow) {
    return { updatedHistory: currentHistory, wasAppended: false, wasUpdated: false };
  }

  // 1. Deduplication: Most recent event in the ledger is already sync
  if (isMostRecentSync) {
    const updated = [
      {
        ...lastEvent,
        timestamp: new Date().toISOString(),
        details
      },
      ...currentHistory.slice(1)
    ];
    return { updatedHistory: updated, wasAppended: false, wasUpdated: true };
  }

  // 2. Time-Bound Debounce: Last sync event was less than 60s ago (update in place)
  if (isWithinDebounceWindow && lastSyncIndex !== -1) {
    const updated = [...currentHistory];
    updated[lastSyncIndex] = {
      ...updated[lastSyncIndex],
      timestamp: new Date().toISOString(),
      details
    };
    return { updatedHistory: updated, wasAppended: false, wasUpdated: true };
  }

  // 3. Otherwise, append a new event
  const newEvent: ActivityEvent = {
    id: `act-${now}`,
    timestamp: new Date().toISOString(),
    category: 'decision_graph',
    action: GRAPH_SYNC_ACTION,
    details,
    actor: 'Decision Graph Engine'
  };

  return { updatedHistory: [newEvent, ...currentHistory], wasAppended: true, wasUpdated: false };
}

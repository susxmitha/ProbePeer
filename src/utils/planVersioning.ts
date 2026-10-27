import { AnalysisPlan } from '../types';

export interface AnalysisPlanVersion {
  versionId: string;
  versionLabel: string;
  major: number;
  minor: number;
  createdAt: string;
  frozenAt: string | null;
  isFrozen: boolean;
  hash: string;
  shortHash: string;
  note: string;
  snapshot: AnalysisPlan;
}

/**
 * Computes a SHA-256 hash of any string using the browser/Node Web Crypto API.
 */
export async function computeStringHash(content: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback if subtle crypto is somehow unavailable
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Computes a canonical, deterministic SHA-256 hash of an AnalysisPlan.
 */
export async function computePlanHash(plan: Partial<AnalysisPlan>): Promise<string> {
  const canonical = {
    studyDesign: (plan.studyDesign || '').trim(),
    unitOfAnalysis: (plan.unitOfAnalysis || '').trim(),
    independentVariables: [...(plan.independentVariables || [])].sort(),
    dependentVariables: [...(plan.dependentVariables || [])].sort(),
    covariates: [...(plan.covariates || [])].sort(),
    primaryMethod: (plan.primaryMethod || '').trim(),
    methodSuitabilityRationale: (plan.methodSuitabilityRationale || '').trim(),
    requiredAssumptions: [...(plan.requiredAssumptions || [])].sort(),
    diagnosticChecks: [...(plan.diagnosticChecks || [])].sort(),
    effectSizeMetrics: [...(plan.effectSizeMetrics || [])].sort(),
    uncertaintyEstimation: (plan.uncertaintyEstimation || '').trim(),
    baselineComparator: (plan.baselineComparator || '').trim(),
    multipleTestingCorrection: (plan.multipleTestingCorrection || '').trim(),
    missingDataStrategy: (plan.missingDataStrategy || '').trim(),
    sensitivityAnalyses: [...(plan.sensitivityAnalyses || [])].sort(),
    stoppingConditions: [...(plan.stoppingConditions || [])].sort()
  };

  return computeStringHash(JSON.stringify(canonical));
}

/**
 * Returns a short 8-character representation of a hash.
 */
export function getShortHash(hash?: string | null): string {
  if (!hash) return '--------';
  return hash.slice(0, 8);
}

/**
 * Formats display version label with frozen status, e.g. "v1.0 - Frozen" or "v1.1 (Draft)".
 */
export function formatPlanVersionLabel(plan?: AnalysisPlan | null): string {
  if (!plan) return 'v1.0 (Uninitialized)';
  const label = (plan as any).versionLabel || `v${(plan.version || 1).toFixed(1)}`;
  const isFrozen = !!(plan.frozenAt || (plan as any).isFrozen);
  return `${label} - ${isFrozen ? 'Frozen' : 'Draft'}`;
}

/**
 * Freezes an active plan into an immutable snapshot version.
 */
export async function freezePlan(
  plan: AnalysisPlan,
  note = 'Analysis plan pre-registered and frozen prior to execution.'
): Promise<{ updatedPlan: AnalysisPlan; version: AnalysisPlanVersion }> {
  const hash = await computePlanHash(plan);
  const now = new Date().toISOString();
  const major = Math.floor(plan.version || 1);
  const minor = Math.round(((plan.version || 1) - major) * 10);
  const versionLabel = `v${major}.${minor}`;
  const versionId = `plan-${versionLabel}-${hash.slice(0, 8)}`;

  const versionSnapshot: AnalysisPlanVersion = {
    versionId,
    versionLabel,
    major,
    minor,
    createdAt: now,
    frozenAt: now,
    isFrozen: true,
    hash,
    shortHash: hash.slice(0, 8),
    note,
    snapshot: JSON.parse(JSON.stringify(plan))
  };

  const updatedPlan: AnalysisPlan = {
    ...plan,
    frozenAt: now,
    revisions: [
      {
        date: now,
        note: `[Frozen ${versionLabel}] Hash: ${hash.slice(0, 8)}. ${note}`,
        author: 'Lead Researcher'
      },
      ...(plan.revisions || [])
    ]
  };

  // Attach version metadata
  (updatedPlan as any).isFrozen = true;
  (updatedPlan as any).versionLabel = versionLabel;
  (updatedPlan as any).plan_version_id = versionId;
  (updatedPlan as any).planHash = hash;
  (updatedPlan as any).planHistory = [
    versionSnapshot,
    ...((plan as any).planHistory || [])
  ];

  return { updatedPlan, version: versionSnapshot };
}

/**
 * Handles mutations to a plan.
 * If the plan is currently frozen, it increments the minor version (e.g. v1.0 -> v1.1),
 * unfreezes the draft, and records a new version rather than silently overwriting the frozen snapshot.
 */
export async function handlePlanMutation(
  currentPlan: AnalysisPlan,
  mutations: Partial<AnalysisPlan>,
  author = 'Researcher'
): Promise<{ updatedPlan: AnalysisPlan; newVersionCreated: boolean; wasVersionIncremented: boolean; previousVersionId?: string }> {
  const isCurrentlyFrozen = !!(currentPlan.frozenAt || (currentPlan as any).isFrozen);
  const now = new Date().toISOString();

  if (isCurrentlyFrozen) {
    // Current plan was frozen: create a new version branch (e.g., v1.0 -> v1.1)
    const currentVersion = currentPlan.version || 1.0;
    const newVersionNumber = Number((currentVersion + 0.1).toFixed(1));
    const major = Math.floor(newVersionNumber);
    const minor = Math.round((newVersionNumber - major) * 10);
    const newVersionLabel = `v${major}.${minor}`;

    const merged = {
      ...currentPlan,
      ...mutations,
      version: newVersionNumber,
      frozenAt: null
    };

    const newHash = await computePlanHash(merged);
    const newVersionId = `plan-${newVersionLabel}-${newHash.slice(0, 8)}`;

    const updatedPlan: AnalysisPlan = {
      ...merged,
      revisions: [
        {
          date: now,
          note: `Created new draft ${newVersionLabel} (forked from frozen v${currentVersion.toFixed(1)}). Hash: ${newHash.slice(0, 8)}`,
          author
        },
        ...(currentPlan.revisions || [])
      ]
    };

    (updatedPlan as any).isFrozen = false;
    (updatedPlan as any).versionLabel = newVersionLabel;
    (updatedPlan as any).plan_version_id = newVersionId;
    (updatedPlan as any).planHash = newHash;

    return {
      updatedPlan,
      newVersionCreated: true,
      wasVersionIncremented: true,
      previousVersionId: (currentPlan as any).plan_version_id
    };
  }

  // Not frozen: update in-place and recalculate hash
  const merged = {
    ...currentPlan,
    ...mutations
  };
  const newHash = await computePlanHash(merged);
  const currentVersion = currentPlan.version || 1.0;
  const major = Math.floor(currentVersion);
  const minor = Math.round((currentVersion - major) * 10);
  const versionLabel = (currentPlan as any).versionLabel || `v${major}.${minor}`;
  const versionId = (currentPlan as any).plan_version_id || `plan-${versionLabel}-${newHash.slice(0, 8)}`;

  const updatedPlan: AnalysisPlan = {
    ...merged,
    revisions: [
      {
        date: now,
        note: `Updated draft ${versionLabel}. Specification parameters modified.`,
        author
      },
      ...(currentPlan.revisions || [])
    ]
  };

  (updatedPlan as any).isFrozen = false;
  (updatedPlan as any).versionLabel = versionLabel;
  (updatedPlan as any).plan_version_id = versionId;
  (updatedPlan as any).planHash = newHash;

  return {
    updatedPlan,
    newVersionCreated: false,
    wasVersionIncremented: false
  };
}

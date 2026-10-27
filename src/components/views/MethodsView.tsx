import React, { useState } from 'react';
import {
  Sliders,
  Lock,
  Unlock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  History,
  ArrowRight,
  RefreshCw,
  Plus,
  ShieldCheck
} from 'lucide-react';
import { ResearchProject, AnalysisPlan } from '../../types';
import { api } from '../../services/api';
import { freezePlan, handlePlanMutation, formatPlanVersionLabel, getShortHash } from '../../utils/planVersioning';

interface MethodsViewProps {
  project: ResearchProject;
  onUpdateProject: (updated: Partial<ResearchProject>) => void;
  onNavigateToExecution: () => void;
}

export const MethodsView: React.FC<MethodsViewProps> = ({
  project,
  onUpdateProject,
  onNavigateToExecution
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showUnfreezeModal, setShowUnfreezeModal] = useState(false);
  const [freezeNote, setFreezeNote] = useState('');

  const plan = project.methodPlan;
  const isFrozen = !!plan?.frozenAt;

  // Interactive Variable Selection State (Overriding AI defaults)
  const [selectedIV, setSelectedIV] = useState<string>(
    plan?.independentVariables?.[0] || 'trig_hdl_ratio'
  );
  const [selectedDV, setSelectedDV] = useState<string>(
    plan?.dependentVariables?.[0] || 'hba1c_24m'
  );
  const [selectedCovariates, setSelectedCovariates] = useState<string[]>(
    plan?.covariates || ['age', 'bmi', 'baseline_hba1c']
  );
  const [isSavingVariables, setIsSavingVariables] = useState(false);
  const [varSaveNotice, setVarSaveNotice] = useState<string | null>(null);

  // Sync state when plan updates
  React.useEffect(() => {
    if (plan?.independentVariables?.[0]) {
      setSelectedIV(plan.independentVariables[0]);
    }
    if (plan?.dependentVariables?.[0]) {
      setSelectedDV(plan.dependentVariables[0]);
    }
    if (plan?.covariates) {
      setSelectedCovariates(plan.covariates);
    }
  }, [plan?.independentVariables, plan?.dependentVariables, plan?.covariates]);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const generated = await api.generateMethodPlan({
        researchQuestion: project.researchQuestion || project.title,
        hypothesis: project.hypothesis,
        datasetMeta: project.dataset ? { rows: project.dataset.rowCount, cols: project.dataset.columnCount } : null,
        variables: project.dataset?.columns || []
      });

      const newPlan: AnalysisPlan = {
        id: `plan-${Date.now()}`,
        version: 1,
        frozenAt: null,
        ...generated,
        revisions: [
          {
            date: new Date().toISOString(),
            note: 'Initial analysis plan formulated based on research question and dataset schema.',
            author: 'ProbePeer Methods Engine'
          }
        ]
      };

      onUpdateProject({
        methodPlan: newPlan,
        status: 'Planning',
        activityHistory: [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            category: 'plan',
            action: 'Analysis Protocol Formulated',
            details: `Specified primary method: ${newPlan.primaryMethod}.`,
            actor: 'Methods Engine'
          },
          ...(project.activityHistory || [])
        ]
      });
    } catch (err: any) {
      alert(`Failed to formulate methods: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFreezePlan = async () => {
    if (!plan) return;

    const { updatedPlan, version } = await freezePlan(
      plan,
      freezeNote.trim() || 'Primary analysis plan approved and frozen prior to computational execution.'
    );

    onUpdateProject({
      methodPlan: updatedPlan,
      status: 'Ready for Analysis',
      activityHistory: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          category: 'plan',
          action: `Analysis Protocol ${version.versionLabel} Frozen`,
          details: `Plan ${version.versionLabel} (SHA-256: ${version.shortHash}) locked to prevent post-hoc modifications (HARKing/p-hacking prevention).`,
          actor: 'Lead Researcher'
        },
        ...(project.activityHistory || [])
      ]
    });
    setShowFreezeModal(false);
    setFreezeNote('');
  };

  const handleConfirmUnfreeze = async () => {
    if (!plan) return;

    const { updatedPlan } = await handlePlanMutation(
      plan,
      {
        revisions: [
          {
            date: new Date().toISOString(),
            note: 'Plan unfrozen by researcher for methodological revision.',
            author: 'Lead Researcher'
          },
          ...(plan.revisions || [])
        ]
      },
      'Lead Researcher'
    );

    // Flag downstream execution runs and manuscript sections as needing review
    onUpdateProject({
      methodPlan: updatedPlan,
      status: 'Needs Review',
      activityHistory: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          category: 'plan',
          action: 'Analysis Protocol Unfrozen',
          details: `Plan ${formatPlanVersionLabel(updatedPlan)} unlocked for revision. Downstream runs flagged for review.`,
          actor: 'Lead Researcher'
        },
        ...(project.activityHistory || [])
      ]
    });
    setShowUnfreezeModal(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#1c1917] tracking-tight">
            Methods & Statistical Analysis Protocol
          </h1>
          <p className="text-xs text-[#78716c] mt-1 max-w-2xl leading-relaxed">
            Formulate and pre-specify study design, variable roles, statistical model rationale, diagnostic assumptions, and stopping boundaries prior to computational execution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {plan && !isFrozen && (
            <button
              onClick={() => setShowFreezeModal(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-2 rounded-md transition-colors"
            >
              <Lock size={13} />
              <span>Freeze Primary Plan</span>
            </button>
          )}

          {isFrozen && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-mono text-[var(--status-success)] bg-[var(--status-success-bg)] px-2.5 py-1.5 rounded border border-[var(--status-success-border)] font-medium">
                <ShieldCheck size={13} /> {formatPlanVersionLabel(plan)}
              </span>
              <button
                onClick={() => setShowUnfreezeModal(true)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border)] px-2.5 py-1.5 rounded hover:bg-[var(--hover-state)] transition-colors"
              >
                Unfreeze
              </button>
            </div>
          )}

          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-primary-fg)] bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 px-3.5 py-2 rounded-md transition-all shadow-none"
          >
            {isGenerating ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
            <span>{plan ? 'Re-formulate Protocol' : 'Formulate Protocol'}</span>
          </button>
        </div>
      </div>

      {/* Plan Details */}
      {plan ? (
        <div className="space-y-6">
          {/* Main Method & Design Card */}
          <div className="bg-white border border-[#e7e5e0] rounded-lg p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716c] block mb-1">
                  Primary Statistical / Computational Method
                </span>
                <h3 className="text-base font-serif font-semibold text-[#1c1917] leading-tight">
                  {plan.primaryMethod}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs font-mono font-medium px-2.5 py-1 rounded border flex items-center gap-1.5 ${
                    isFrozen
                      ? 'bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)]'
                      : 'bg-[var(--pill-bg)] text-[var(--pill-text)] border-[var(--pill-border)]'
                  }`}
                >
                  {isFrozen ? <Lock size={12} /> : <Sliders size={12} />}
                  <span>{formatPlanVersionLabel(plan)}</span>
                </span>
                <span
                  className="text-[11px] font-mono px-2 py-1 rounded bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border border-[var(--border)]"
                  title={`Canonical SHA-256 Hash: ${plan.planHash || 'Computed on freeze'}`}
                >
                  sha256:{getShortHash(plan.planHash)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#faf9f5] border border-[#e7e5e0] rounded-md text-xs space-y-1">
              <span className="font-semibold text-[#78716c] uppercase text-[10px] block">
                Method Suitability Rationale:
              </span>
              <p className="text-[#292524] leading-relaxed">
                {plan.methodSuitabilityRationale}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[#f2f1ec] text-xs">
              <div>
                <span className="font-semibold text-[#78716c] uppercase text-[10px] block mb-1">
                  Study Design:
                </span>
                <p className="text-[#1c1917] font-medium">{plan.studyDesign}</p>
              </div>
              <div>
                <span className="font-semibold text-[#78716c] uppercase text-[10px] block mb-1">
                  Unit of Analysis:
                </span>
                <p className="text-[#1c1917] font-medium">{plan.unitOfAnalysis}</p>
              </div>
              <div>
                <span className="font-semibold text-[#78716c] uppercase text-[10px] block mb-1">
                  Comparator / Baseline:
                </span>
                <p className="text-[#1c1917] font-medium">{plan.baselineComparator}</p>
              </div>
            </div>

            {/* Interactive Variable Operationalization Section */}
            <div className="pt-4 border-t border-[#f2f1ec] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-[#1c1917] uppercase tracking-wider block">
                    Variable Role Operationalization & Mapping
                  </span>
                  <span className="text-[11px] text-[#78716c]">
                    Explicitly assign predictor, outcome, and confounder roles from your uploaded dataset. Subject IDs are strictly excluded from statistical modeling.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIV('trig_hdl_ratio');
                      setSelectedDV('hba1c_24m');
                      setSelectedCovariates(['age', 'bmi', 'baseline_hba1c']);
                    }}
                    className="text-[11px] text-[var(--accent-primary)] hover:underline font-medium"
                  >
                    Reset Recommended
                  </button>
                  <button
                    type="button"
                    disabled={isSavingVariables}
                    onClick={async () => {
                      if (!plan) return;
                      setIsSavingVariables(true);
                      const updatedIVs = [selectedIV];
                      const hasBinaryFlag = (project.dataset?.columns || []).some(c => c.name === 'progression_flag');
                      const updatedDVs = (hasBinaryFlag && selectedDV !== 'progression_flag')
                        ? [selectedDV, 'progression_flag']
                        : [selectedDV];

                      const mutations = {
                        independentVariables: updatedIVs,
                        dependentVariables: updatedDVs,
                        covariates: selectedCovariates,
                        revisions: [
                          {
                            date: new Date().toISOString(),
                            note: `Variable mapping updated: IV=[${updatedIVs.join(', ')}], DV=[${updatedDVs.join(', ')}], Covariates=[${selectedCovariates.join(', ')}].`,
                            author: 'Lead Researcher'
                          },
                          ...(plan.revisions || [])
                        ]
                      };

                      const { updatedPlan, wasVersionIncremented } = await handlePlanMutation(plan, mutations, 'Lead Researcher');

                      onUpdateProject({
                        methodPlan: updatedPlan,
                        status: wasVersionIncremented ? 'Needs Review' : project.status,
                        activityHistory: [
                          {
                            id: `act-${Date.now()}`,
                            timestamp: new Date().toISOString(),
                            category: 'plan',
                            action: 'Variable Assignments Updated',
                            details: `Specified IV: [${updatedIVs.join(', ')}], DV: [${updatedDVs.join(', ')}], Covariates: [${selectedCovariates.join(', ')}]. Recorded in project manifest.`,
                            actor: 'Lead Researcher'
                          },
                          ...(project.activityHistory || [])
                        ]
                      });

                      setIsSavingVariables(false);
                      setVarSaveNotice('Variable mapping saved to project manifest.');
                      setTimeout(() => setVarSaveNotice(null), 3000);
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-[var(--accent-primary-fg)] bg-[var(--accent-primary)] hover:opacity-90 px-3 py-1.5 rounded transition-colors"
                  >
                    <CheckCircle2 size={12} />
                    <span>Save Variable Roles</span>
                  </button>
                </div>
              </div>

              {varSaveNotice && (
                <div className="p-2 bg-[var(--status-success-bg)] border border-[var(--status-success-border)] text-[var(--status-success)] text-xs rounded flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  <span>{varSaveNotice}</span>
                </div>
              )}

              {isFrozen && (
                <div className="p-2 bg-[var(--pill-bg)] border border-[var(--pill-border)] text-xs rounded text-[var(--pill-text)] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Lock size={12} />
                    <span>Protocol is frozen ({formatPlanVersionLabel(plan)}). Saving edits will generate a new protocol draft version.</span>
                  </div>
                </div>
              )}

              {/* 3-Column Selector Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* 1. Independent Variable */}
                <div className="bg-[var(--bg-surface-elevated)] p-3 rounded-md border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[var(--text-main)] block uppercase text-[10px]">
                      Independent Variable (IV / Predictor)
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">X-Axis</span>
                  </div>
                  <select
                    value={selectedIV}
                    onChange={(e) => setSelectedIV(e.target.value)}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    {(project.dataset?.columns || [])
                      .filter((c) => {
                        const name = c.name.toLowerCase();
                        return !name.includes('patient_id') && !name.includes('subject_id') && name !== 'id' && c.inferredType !== 'Identifier';
                      })
                      .map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name} ({c.inferredType})
                        </option>
                      ))}
                  </select>
                  <p className="text-[10px] text-[var(--text-muted)] leading-snug">
                    Continuous biomarker or exposure variable evaluated for independent prognostic association.
                  </p>
                </div>

                {/* 2. Dependent Variable */}
                <div className="bg-[var(--bg-surface-elevated)] p-3 rounded-md border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[var(--text-main)] block uppercase text-[10px]">
                      Dependent Variable (DV / Outcome)
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">Y-Axis</span>
                  </div>
                  <select
                    value={selectedDV}
                    onChange={(e) => setSelectedDV(e.target.value)}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    {(project.dataset?.columns || [])
                      .filter((c) => {
                        const name = c.name.toLowerCase();
                        return !name.includes('patient_id') && !name.includes('subject_id') && name !== 'id' && c.inferredType !== 'Identifier';
                      })
                      .map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.isPotentialTarget ? '★ ' : ''}{c.name} ({c.inferredType})
                        </option>
                      ))}
                  </select>
                  <p className="text-[10px] text-[var(--text-muted)] leading-snug">
                    Primary continuous or longitudinal clinical trajectory endpoint modeled by regression.
                  </p>
                </div>

                {/* 3. Adjusted Covariates */}
                <div className="bg-[var(--bg-surface-elevated)] p-3 rounded-md border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[var(--text-main)] block uppercase text-[10px]">
                      Adjusted Covariates ({selectedCovariates.length} selected)
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">Confounders</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                    {(project.dataset?.columns || [])
                      .filter((c) => {
                        const name = c.name.toLowerCase();
                        return !name.includes('patient_id') &&
                               !name.includes('subject_id') &&
                               name !== 'id' &&
                               c.inferredType !== 'Identifier' &&
                               c.name !== selectedIV &&
                               c.name !== selectedDV;
                      })
                      .map((c) => {
                        const isSelected = selectedCovariates.includes(c.name);
                        return (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => {
                              setSelectedCovariates((prev) =>
                                isSelected ? prev.filter((x) => x !== c.name) : [...prev, c.name]
                              );
                            }}
                            className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                              isSelected
                                ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-muted)]'
                            }`}
                          >
                            <span>{isSelected ? '✓' : '+'}</span>
                            <span>{c.name}</span>
                          </button>
                        );
                      })}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] leading-snug">
                    Click chips to toggle confounder adjustment (e.g. age, BMI, baseline control).
                  </p>
                </div>
              </div>

              {/* Excluded Non-Modeling Identifiers */}
              <div className="flex items-center gap-2 pt-1 text-[11px] text-[var(--text-muted)]">
                <span className="font-semibold uppercase text-[10px] text-[var(--text-muted)]">
                  Excluded from modeling:
                </span>
                {(project.dataset?.columns || [])
                  .filter((c) => {
                    const name = c.name.toLowerCase();
                    return name.includes('patient_id') || name.includes('subject_id') || name === 'id' || c.inferredType === 'Identifier';
                  })
                  .map((c) => (
                    <span
                      key={c.name}
                      className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--bg-terminal)] text-[var(--text-muted)] border border-[var(--border)]"
                      title="Subject/Patient Identifier - Excluded from regression modeling to prevent semantic and data leakage errors"
                    >
                      {c.name} (Identifier / Non-modeling)
                    </span>
                  ))}
              </div>
            </div>
          </div>

          {/* Diagnostic Checks & Stopping Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Assumptions & Diagnostics */}
            <div className="bg-white border border-[#e7e5e0] rounded-lg p-5 space-y-3">
              <span className="font-semibold text-[#1c1917] uppercase tracking-wider text-[11px] block">
                Required Assumptions & Diagnostics
              </span>
              <ul className="space-y-1.5 text-[#44403c]">
                {plan.requiredAssumptions.map((asm, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[var(--accent-primary)] font-bold">•</span>
                    <span>{asm}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 border-t border-[#f2f1ec]">
                <span className="font-semibold text-[#78716c] text-[10px] uppercase block mb-1">
                  Automated Diagnostics:
                </span>
                <div className="flex flex-wrap gap-1">
                  {plan.diagnosticChecks.map((dc, idx) => (
                    <span key={idx} className="font-mono text-[10px] bg-[#faf9f5] border border-[#e7e5e0] px-1.5 py-0.5 rounded">
                      {dc}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Guards & Stopping Conditions */}
            <div className="bg-white border border-[#e7e5e0] rounded-lg p-5 space-y-3">
              <span className="font-semibold text-[var(--status-danger)] uppercase tracking-wider text-[11px] block">
                Stopping Conditions (Analysis Must Halt)
              </span>
              <ul className="space-y-1.5 text-[var(--status-danger)]">
                {plan.stoppingConditions.map((sc, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 bg-[var(--status-danger-bg)] p-1.5 rounded border border-[var(--status-danger-border)]">
                    <AlertTriangle size={13} className="text-[var(--status-danger)] shrink-0 mt-0.5" />
                    <span>{sc}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 border-t border-[#f2f1ec] text-[11px] text-[#78716c]">
                <div><strong>Multiple Testing:</strong> {plan.multipleTestingCorrection}</div>
                <div><strong>Missing Data:</strong> {plan.missingDataStrategy}</div>
              </div>
            </div>
          </div>

          {/* Proceed to Execution CTA */}
          <div className="flex items-center justify-between p-4 bg-[#fbfbfa] border border-[#e7e5e0] rounded-lg">
            <div>
              <span className="text-xs font-semibold text-[#1c1917] block">
                Ready for Computational Verification
              </span>
              <span className="text-[11px] text-[#78716c]">
                Run verified Python script in the isolated sandbox using the frozen method plan.
              </span>
            </div>
            <button
              onClick={onNavigateToExecution}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-primary-fg)] bg-[var(--accent-primary)] hover:opacity-90 px-4 py-2 rounded-md transition-all shadow-none"
            >
              <span>Execute Code in Sandbox</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-dashed border-[var(--border)] rounded-lg p-10 text-center space-y-3">
          <Sliders size={28} className="mx-auto text-[var(--text-muted)]" />
          <h3 className="text-sm font-medium text-[var(--text-main)] font-serif">No Analysis Protocol Formulated</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            Click below to generate a pre-specified, statistically defensible method plan tailored to your research question and dataset.
          </p>
          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="text-xs font-medium text-[var(--accent-primary-fg)] bg-[var(--accent-primary)] hover:opacity-90 px-4 py-2 rounded-md transition-all shadow-none"
          >
            Formulate Protocol Now
          </button>
        </div>
      )}

      {/* Freeze Confirmation Modal */}
      {showFreezeModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#e7e5e0] rounded-lg max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-emerald-700" />
              <h3 className="font-serif text-lg font-semibold text-[#1c1917]">
                Freeze Primary Analysis Plan
              </h3>
            </div>
            <p className="text-xs text-[#78716c] leading-relaxed">
              Freezing pre-specifies your hypotheses, methods, and stopping conditions before running code. This satisfies preregistration integrity standards and guards against post-hoc hypothesis generation (HARKing).
            </p>
            <div>
              <label className="text-[11px] font-semibold text-[#44403c] block mb-1">
                Optional Freeze Note:
              </label>
              <textarea
                rows={2}
                value={freezeNote}
                onChange={(e) => setFreezeNote(e.target.value)}
                placeholder="e.g. Approved primary specification after verifying baseline collinearity bounds..."
                className="w-full text-xs bg-[#faf9f5] border border-[#d6d3cb] rounded p-2 focus:outline-none focus:border-[#4338ca]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowFreezeModal(false)}
                className="text-xs text-[#78716c] hover:text-[#1c1917] px-3 py-1.5 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleFreezePlan}
                className="text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-1.5 rounded"
              >
                Confirm & Freeze Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unfreeze Confirmation Modal */}
      {showUnfreezeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#e7e5e0] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-600" />
              <h3 className="font-serif text-lg font-semibold text-[#1c1917]">
                Unfreeze Analysis Protocol?
              </h3>
            </div>
            <p className="text-xs text-[#44403c] leading-relaxed">
              <strong>Are you sure?</strong> Unfreezing this analysis plan allows modifications to your study design, statistical methods, and stopping conditions, but will <strong>invalidate current execution runs</strong> and flag downstream manuscript sections for re-verification.
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded text-xs leading-snug">
              This action and the rationale will be permanently recorded in the immutable provenance ledger to maintain scientific research auditability.
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#f2f1ec]">
              <button
                onClick={() => setShowUnfreezeModal(false)}
                className="text-xs text-[#78716c] hover:text-[#1c1917] px-3.5 py-1.5 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnfreeze}
                className="text-xs font-medium text-white bg-amber-700 hover:bg-amber-800 px-4 py-1.5 rounded transition-colors"
              >
                Yes, Unfreeze & Invalidate Runs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Edit3,
  Save,
  Check,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { ResearchProject, CandidateGap } from '../../types';

interface ResearchQuestionViewProps {
  project: ResearchProject;
  onUpdateProject: (updated: Partial<ResearchProject>) => void;
  onNavigateToLiterature: () => void;
}

export const ResearchQuestionView: React.FC<ResearchQuestionViewProps> = ({
  project,
  onUpdateProject,
  onNavigateToLiterature
}) => {
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [formData, setFormData] = useState({
    researchQuestion: project.researchQuestion || '',
    hypothesis: project.hypothesis || '',
    domain: project.domain || '',
    targetPopulation: project.targetPopulation || '',
    intendedContribution: project.intendedContribution || '',
    constraints: project.constraints || ''
  });

  const handleSaveForm = () => {
    onUpdateProject({
      ...formData,
      activityHistory: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          category: 'project',
          action: 'Research Question Form Updated',
          details: 'Updated core research question, hypothesis, and scope parameters.',
          actor: 'Researcher'
        },
        ...(project.activityHistory || [])
      ]
    });
    setIsEditingForm(false);
  };

  const handleToggleGapApproval = (gapId: string) => {
    const updatedGaps = (project.candidateGaps || []).map((gap) => {
      if (gap.id === gapId) {
        return { ...gap, approved: !gap.approved };
      }
      return gap;
    });
    onUpdateProject({
      candidateGaps: updatedGaps,
      activityHistory: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          category: 'literature',
          action: 'Candidate Gap Status Toggled',
          details: `Gap ${gapId} status updated.`,
          actor: 'Researcher'
        },
        ...(project.activityHistory || [])
      ]
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#1c1917] tracking-tight">
            Research Question & Scope
          </h1>
          <p className="text-xs text-[#78716c] mt-1 max-w-2xl">
            A precise, falsifiable research question anchored in empirical literature gaps rather than unsubstantiated claims of novelty.
          </p>
        </div>
        <button
          onClick={() => (isEditingForm ? handleSaveForm() : setIsEditingForm(true))}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded transition-colors ${
            isEditingForm
              ? 'bg-[#1c1917] text-white hover:bg-[#292524]'
              : 'bg-white border border-[#d6d3cb] text-[#44403c] hover:bg-[#f2efe9]'
          }`}
        >
          {isEditingForm ? (
            <>
              <Save size={13} />
              <span>Save Changes</span>
            </>
          ) : (
            <>
              <Edit3 size={13} />
              <span>Edit Question & Scope</span>
            </>
          )}
        </button>
      </div>

      {/* Main Question & Hypothesis Card */}
      <div className="bg-white border border-[#e7e5e0] rounded-lg p-6 space-y-6">
        <div>
          <label className="text-[11px] font-semibold text-[#78716c] uppercase tracking-wider block mb-1">
            Primary Research Question
          </label>
          {isEditingForm ? (
            <textarea
              rows={3}
              value={formData.researchQuestion}
              onChange={(e) => setFormData({ ...formData, researchQuestion: e.target.value })}
              className="w-full text-sm font-medium bg-[#faf9f5] border border-[#d6d3cb] rounded p-2.5 text-[#1c1917] focus:outline-none focus:border-[#4338ca] focus:bg-white"
              placeholder="State the central scientific question being investigated..."
            />
          ) : (
            <p className="text-base font-serif font-medium text-[#1c1917] leading-relaxed">
              {project.researchQuestion || <span className="text-[#a8a29e] italic">No research question defined yet.</span>}
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-[#f2f1ec]">
          <label className="text-[11px] font-semibold text-[#78716c] uppercase tracking-wider block mb-1">
            Working Hypothesis (Falsifiable)
          </label>
          {isEditingForm ? (
            <textarea
              rows={2}
              value={formData.hypothesis}
              onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
              className="w-full text-sm bg-[#faf9f5] border border-[#d6d3cb] rounded p-2.5 text-[#1c1917] focus:outline-none focus:border-[#4338ca] focus:bg-white"
              placeholder="State the directional hypothesis and expected effect size or operational criteria..."
            />
          ) : (
            <div className="bg-[#faf9f5] border border-[#e7e5e0] rounded p-3 text-xs text-[#292524] font-mono leading-relaxed">
              {project.hypothesis || <span className="text-[#a8a29e] italic">No working hypothesis specified.</span>}
            </div>
          )}
        </div>

        {/* Scope Parameters Grid */}
        <div className="pt-4 border-t border-[#f2f1ec] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-[#78716c] uppercase tracking-wider text-[10px] block mb-1">
              Scientific Domain
            </label>
            {isEditingForm ? (
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full bg-[#faf9f5] border border-[#d6d3cb] rounded p-2 text-[#1c1917]"
              />
            ) : (
              <p className="text-[#1c1917] font-medium">{project.domain || 'Unspecified'}</p>
            )}
          </div>

          <div>
            <label className="font-semibold text-[#78716c] uppercase tracking-wider text-[10px] block mb-1">
              Target Population or System
            </label>
            {isEditingForm ? (
              <input
                type="text"
                value={formData.targetPopulation}
                onChange={(e) => setFormData({ ...formData, targetPopulation: e.target.value })}
                className="w-full bg-[#faf9f5] border border-[#d6d3cb] rounded p-2 text-[#1c1917]"
              />
            ) : (
              <p className="text-[#1c1917]">{project.targetPopulation || 'Unspecified'}</p>
            )}
          </div>

          <div>
            <label className="font-semibold text-[#78716c] uppercase tracking-wider text-[10px] block mb-1">
              Intended Contribution
            </label>
            {isEditingForm ? (
              <textarea
                rows={2}
                value={formData.intendedContribution}
                onChange={(e) => setFormData({ ...formData, intendedContribution: e.target.value })}
                className="w-full bg-[#faf9f5] border border-[#d6d3cb] rounded p-2 text-[#1c1917]"
              />
            ) : (
              <p className="text-[#1c1917]">{project.intendedContribution || 'Unspecified'}</p>
            )}
          </div>

          <div>
            <label className="font-semibold text-[#78716c] uppercase tracking-wider text-[10px] block mb-1">
              Known Study Constraints
            </label>
            {isEditingForm ? (
              <textarea
                rows={2}
                value={formData.constraints}
                onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                className="w-full bg-[#faf9f5] border border-[#d6d3cb] rounded p-2 text-[#1c1917]"
              />
            ) : (
              <p className="text-[#78716c]">{project.constraints || 'None noted'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Candidate Research Gaps Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#1c1917] uppercase tracking-wider">
              Candidate Research Gaps & Novelty Assessment
            </h2>
            <p className="text-xs text-[#78716c]">
              Evaluated against indexed literature evidence. Clearly distinguished between reported literature limits and inferred gaps.
            </p>
          </div>
          <button
            onClick={onNavigateToLiterature}
            className="flex items-center gap-1 text-xs text-[var(--accent-primary)] font-medium hover:underline"
          >
            <BookOpen size={13} />
            <span>Search & Synthesize Literature</span>
          </button>
        </div>

        {project.candidateGaps && project.candidateGaps.length > 0 ? (
          <div className="space-y-4">
            {project.candidateGaps.map((gap) => (
              <div
                key={gap.id}
                className={`bg-white border rounded-lg p-5 transition-colors ${
                  gap.approved ? 'border-[#4338ca]/60 bg-[#fbfbfa]' : 'border-[#e7e5e0]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--pill-bg)] text-[var(--pill-text)] border border-[var(--pill-border)]"
                      >
                        {gap.gapType}
                      </span>
                      {gap.approved && (
                        <span className="text-[10px] font-mono bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success-border)] px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                          <Check size={10} /> Approved Primary Gap
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--text-main)] font-serif mt-1">{gap.statement}</h3>
                  </div>

                  <button
                    onClick={() => handleToggleGapApproval(gap.id)}
                    className={`text-xs font-medium px-3 py-1.5 rounded transition-colors shrink-0 ${
                      gap.approved
                        ? 'bg-[var(--status-success)] text-white hover:opacity-90'
                        : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--hover-state)]'
                    }`}
                  >
                    {gap.approved ? 'Approved' : 'Approve for Study'}
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-[var(--text-muted)] uppercase text-[10px] block mb-1">
                      What appears to be known:
                    </span>
                    <p className="text-[var(--text-main)] leading-relaxed">{gap.whatIsKnown}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-[var(--text-muted)] uppercase text-[10px] block mb-1">
                      What remains uncertain:
                    </span>
                    <p className="text-[var(--text-main)] leading-relaxed">{gap.whatRemainsUncertain}</p>
                  </div>
                </div>

                <div className="mt-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded p-3 text-xs space-y-2">
                  <div className="flex items-start gap-1.5 p-2 bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] rounded">
                    <span className="font-semibold text-[var(--status-warning)] text-[10px] uppercase shrink-0 mt-0.5 tracking-wider">
                      Invalidation Criteria:
                    </span>
                    <span className="text-[var(--status-warning)] font-mono text-[11px] leading-relaxed">
                      {gap.invalidationCriteria}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 px-2 py-1">
                    <span className="font-semibold text-[var(--text-muted)] text-[10px] uppercase shrink-0 mt-0.5">
                      Next Verification Step:
                    </span>
                    <span className="text-[var(--text-main)] font-medium">
                      {gap.nextVerificationStep}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-[#d6d3cb] rounded-lg p-8 text-center">
            <HelpCircle size={24} className="mx-auto text-[#a8a29e] mb-2" />
            <p className="text-xs text-[#78716c]">
              No candidate research gaps synthesized yet. Go to Literature to retrieve scholarly sources and generate evidence-backed gaps.
            </p>
            <button
              onClick={onNavigateToLiterature}
              className="mt-3 text-xs font-medium text-[var(--accent-primary)] hover:underline"
            >
              Retrieve Literature & Synthesize Gaps →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

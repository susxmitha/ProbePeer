import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  Upload,
  BookOpen,
  Database,
  Calendar,
  Layers,
  ChevronRight,
  Activity,
  Plus
} from 'lucide-react';
import { ResearchProject } from '../../types';

interface HomeViewProps {
  projects: ResearchProject[];
  onSelectProject: (project: ResearchProject) => void;
  onNewProjectWithPrompt: (promptText: string) => void;
  onOpenUploadDataset: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  projects,
  onSelectProject,
  onNewProjectWithPrompt,
  onOpenUploadDataset
}) => {
  const [investigationPrompt, setInvestigationPrompt] = useState('');

  const handleStartInvestigation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!investigationPrompt.trim()) return;
    onNewProjectWithPrompt(investigationPrompt.trim());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ready for Analysis':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Analyzing':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Planning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Needs Review':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  // Collect recent activities across projects
  const recentActivities = projects
    .flatMap((p) => (p.activityHistory || []).map((a) => ({ ...a, projectTitle: p.title, projectId: p.id })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Investigation Prompt Box */}
      <section className="bg-white border border-[#e7e5e0] rounded-lg p-6 shadow-xs">
        <div className="max-w-3xl">
          <h1 className="font-serif text-2xl font-semibold text-[#1c1917] tracking-tight">
            Scientific Inquiry & Discovery
          </h1>
          <p className="text-xs text-[#78716c] mt-1 leading-relaxed">
            Formulate a testable research hypothesis, identify existing literature gaps, evaluate dataset feasibility, and plan reproducible computational verifications.
          </p>

          <form onSubmit={handleStartInvestigation} className="mt-5">
            <label className="block text-xs font-semibold text-[#44403c] mb-1.5 uppercase tracking-wide">
              What are you trying to investigate?
            </label>
            <div className="flex flex-col sm:flex-row gap-2 items-start">
              <textarea
                rows={2}
                value={investigationPrompt}
                onChange={(e) => setInvestigationPrompt(e.target.value)}
                placeholder="e.g. Do triglyceride-to-HDL ratios independently predict glycemic progression when controlling for BMI?"
                className="flex-1 w-full text-xs sm:text-sm bg-[#faf9f5] border border-[#d6d3cb] text-[#1c1917] rounded-md px-3.5 py-2.5 focus:outline-none focus:border-[#4338ca] focus:bg-white transition-colors resize-none leading-relaxed"
              />
              <button
                type="submit"
                disabled={!investigationPrompt.trim()}
                className="w-full sm:w-auto bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 text-[var(--accent-primary-fg)] text-xs font-medium px-5 py-3 rounded-md flex items-center justify-center gap-1.5 transition-all shrink-0 sm:self-stretch shadow-none"
              >
                <span>Initialize Research</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>

          <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text-main)]">Secondary actions:</span>
            <button
              onClick={onOpenUploadDataset}
              className="flex items-center gap-1 text-[var(--accent-primary)] hover:opacity-80 hover:underline"
            >
              <Upload size={13} />
              <span>Upload CSV Dataset to inspect</span>
            </button>
            <span>•</span>
            <span className="font-mono text-[11px]">Real scholarly APIs: OpenAlex, Crossref, arXiv</span>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-main)] uppercase tracking-wider font-serif">
              Research Projects
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Persistent research ledgers with evidence tracking and execution runs.
            </p>
          </div>
          <button
            onClick={() => onNewProjectWithPrompt('')}
            className="flex items-center gap-1 text-xs text-[var(--accent-primary)] font-medium hover:underline"
          >
            <Plus size={13} />
            <span>New Blank Project</span>
          </button>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent-primary)]/50 rounded-lg p-5 cursor-pointer transition-all shadow-none group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getStatusBadge(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {project.domain}
                    </span>
                  </div>

                  <h3 className="font-medium text-sm text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2 font-serif">
                    {project.title}
                  </h3>

                  <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2 leading-relaxed">
                    {project.researchQuestion || project.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center gap-1" title="Sources indexed">
                      <BookOpen size={12} />
                      {project.sources?.length || 0}
                    </span>
                    <span className="flex items-center gap-1" title="Dataset records">
                      <Database size={12} />
                      {project.dataset ? `${project.dataset.rowCount} rows` : 'None'}
                    </span>
                    <span className="flex items-center gap-1" title="Execution runs">
                      <Layers size={12} />
                      {project.executionRuns?.length || 0} runs
                    </span>
                  </div>
                  <span className="flex items-center gap-0.5 text-[var(--accent-primary)] font-medium group-hover:translate-x-0.5 transition-transform">
                    Enter <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-[#d6d3cb] rounded-lg p-12 text-center">
            <Compass size={28} className="mx-auto text-[#a8a29e] mb-2" />
            <h3 className="text-sm font-medium text-[#1c1917]">No research projects found</h3>
            <p className="text-xs text-[#78716c] mt-1 max-w-sm mx-auto">
              Start by typing an investigative research question above or creating a new blank project.
            </p>
            <button
              onClick={() => onNewProjectWithPrompt('')}
              className="mt-4 text-xs font-medium text-white bg-[#1c1917] hover:bg-[#292524] px-4 py-2 rounded-md"
            >
              Create First Project
            </button>
          </div>
        )}
      </section>

      {/* Recent Activity Ledger */}
      {recentActivities.length > 0 && (
        <section className="bg-white border border-[#e7e5e0] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[var(--accent-primary)]" />
              <h2 className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider font-serif">
                Recent Provenance Activity
              </h2>
            </div>
            <span className="text-[11px] text-[#78716c] font-mono">Immutable Ledger</span>
          </div>

          <div className="divide-y divide-[#f2f1ec]">
            {recentActivities.map((act) => (
              <div key={act.id} className="py-2.5 flex items-start justify-between text-xs gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#1c1917]">{act.action}</span>
                    <span className="text-[10px] text-[#78716c] font-mono bg-[#f4f3ef] px-1.5 py-0.2 rounded border border-[#e7e5e0]">
                      {act.projectTitle}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#78716c] mt-0.5">{act.details}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[#a8a29e] font-mono">
                    {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="text-[10px] text-[#78716c]">{act.actor}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

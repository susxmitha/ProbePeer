import React, { useState } from 'react';
import {
  History,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  BookOpen,
  Database,
  Sliders,
  PlayCircle,
  FileText,
  Share2
} from 'lucide-react';
import { ResearchProject, ActivityEvent } from '../../types';

interface HistoryViewProps {
  project: ResearchProject;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ project }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const activities = project.activityHistory || [];

  const filtered = selectedCategory === 'all'
    ? activities
    : activities.filter((a) => a.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'project':
        return <Layers size={13} className="text-[var(--accent-primary)]" />;
      case 'literature':
        return <BookOpen size={13} className="text-[var(--accent-primary)]" />;
      case 'dataset':
        return <Database size={13} className="text-[var(--status-success)]" />;
      case 'plan':
        return <Sliders size={13} className="text-[var(--status-warning)]" />;
      case 'execution':
        return <PlayCircle size={13} className="text-[var(--accent-chart)]" />;
      case 'manuscript':
        return <FileText size={13} className="text-[var(--accent-primary)]" />;
      case 'decision_graph':
        return <Share2 size={13} className="text-[var(--accent-chart)]" />;
      default:
        return <CheckCircle2 size={13} className="text-[var(--text-muted)]" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#1c1917] tracking-tight">
            Provenance Ledger & Audit Trail
          </h1>
          <p className="text-xs text-[#78716c] mt-1">
            An append-only record of every scientific decision, literature query, dataset inspection, and computational execution run.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-[11px] font-mono text-[#78716c] hidden sm:inline">
            Zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </span>
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-[#78716c]" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-[#d6d3cb] text-[#1c1917] rounded px-2.5 py-1.5 text-xs"
            >
              <option value="all">All Events ({activities.length})</option>
              <option value="project">Project Configuration</option>
              <option value="literature">Literature & Evidence</option>
              <option value="dataset">Dataset Profiling</option>
              <option value="plan">Methods & Protocols</option>
              <option value="execution">Execution Runs</option>
              <option value="manuscript">Manuscript Sync</option>
              <option value="decision_graph">Decision Graph Sync</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-white border border-[#e7e5e0] rounded-lg p-6 shadow-xs">
        {filtered.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e7e5e0]">
            {filtered.map((item) => (
              <div key={item.id} className="relative group">
                {/* Node Dot */}
                <div className="absolute -left-[27px] top-1 w-5 h-5 rounded-full bg-white border border-[#d6d3cb] flex items-center justify-center">
                  {getCategoryIcon(item.category)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <h3 className="font-semibold text-[#1c1917]">{item.action}</h3>
                    <span className="text-[10px] font-mono text-[#78716c]">
                      {new Date(item.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        timeZoneName: 'short'
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-[#44403c] leading-relaxed">{item.details}</p>

                  <div className="flex items-center gap-2 pt-1 text-[10px] text-[#78716c] font-mono">
                    <span>Actor: {item.actor}</span>
                    <span>•</span>
                    <span className="capitalize">{item.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-[#78716c]">
            No activity events recorded for the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};

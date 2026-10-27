import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Eye,
  BookOpen,
  Share2,
  Save,
  Check
} from 'lucide-react';
import { ResearchProject, ManuscriptSection } from '../../types';
import { api } from '../../services/api';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ManuscriptViewProps {
  project: ResearchProject;
  onUpdateProject: (updated: Partial<ResearchProject>) => void;
  onOpenExport: () => void;
}

export const ManuscriptView: React.FC<ManuscriptViewProps> = ({
  project,
  onUpdateProject,
  onOpenExport
}) => {
  const manuscript = project.manuscript;
  const sections = manuscript?.sections || [];

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [selectedSectionKey, setSelectedSectionKey] = useState<string>(sections[0]?.key || 'abstract');
  const [isDrafting, setIsDrafting] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const activeSection = sections.find((s) => s.key === selectedSectionKey) || sections[0];

  const handleStartEdit = () => {
    if (activeSection) {
      setEditedContent(activeSection.content);
      setIsEditingSection(true);
    }
  };

  const handleSaveEdit = () => {
    if (!activeSection) return;

    const updatedSections = sections.map((s) => {
      if (s.key === activeSection.key) {
        return {
          ...s,
          content: editedContent,
          flaggedForReview: false,
          reviewReason: undefined
        };
      }
      return s;
    });

    onUpdateProject({
      manuscript: {
        ...manuscript,
        sections: updatedSections,
        lastUpdated: new Date().toISOString()
      },
      activityHistory: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          category: 'manuscript',
          action: `Manuscript Section "${activeSection.title}" Saved`,
          details: 'Direct researcher edit saved to persistent ledger.',
          actor: 'Researcher'
        },
        ...(project.activityHistory || [])
      ]
    });
    setIsEditingSection(false);
  };

  const handleDraftSection = async (sectionKey: string) => {
    setIsDrafting(true);
    try {
      const latestRun = project.executionRuns?.[0];
      const draftedText = await api.draftManuscriptSection(sectionKey, {
        title: project.title,
        domain: project.domain,
        researchQuestion: project.researchQuestion,
        hypothesis: project.hypothesis,
        methodPlan: project.methodPlan,
        executionResults: latestRun?.metrics || {},
        executionAssertions: latestRun?.assertions || [],
        latestRun: latestRun,
        dataset: project.dataset,
        sources: project.sources || []
      });

      const updatedSections = sections.map((s) => {
        if (s.key === sectionKey) {
          return {
            ...s,
            content: draftedText,
            flaggedForReview: false,
            reviewReason: undefined
          };
        }
        return s;
      });

      onUpdateProject({
        manuscript: {
          ...manuscript,
          sections: updatedSections,
          lastUpdated: new Date().toISOString()
        },
        activityHistory: [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            category: 'manuscript',
            action: `Manuscript Section "${sectionKey}" Drafted`,
            details: 'Drafted from verified evidence ledger and execution runs.',
            actor: 'ProbePeer Manuscript Engine'
          },
          ...(project.activityHistory || [])
        ]
      });
    } catch (err: any) {
      alert(`Drafting error: ${err.message}`);
    } finally {
      setIsDrafting(false);
    }
  };

  const compileFullMarkdown = () => {
    let md = `# ${manuscript.title || project.title}\n\n`;
    md += `*Affiliation: ProbePeer Reproducible Scientific Workspace*\n`;
    md += `*Generated: ${new Date().toLocaleDateString()}*\n\n---\n\n`;

    sections.forEach((s) => {
      md += `${s.content}\n\n`;
    });

    md += `### References\n\n`;
    (manuscript.references || []).forEach((ref, idx) => {
      md += `${idx + 1}. ${ref.formattedString}\n`;
    });

    return md;
  };

  const handleDownloadMarkdown = () => {
    const md = compileFullMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40)}_manuscript.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#1c1917] tracking-tight">
            Evidence-Linked Manuscript Workspace
          </h1>
          <p className="text-xs text-[#78716c] mt-1 max-w-2xl leading-relaxed">
            All text, methods, and quantitative results are synchronized directly with your verified literature sources and execution runs. Unverified citations are strictly barred.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] p-0.5 rounded-md flex items-center text-xs">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'editor'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-none border border-[var(--border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Edit3 size={12} />
              <span>Section Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'preview'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-none border border-[var(--border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Eye size={12} />
              <span>Full Manuscript</span>
            </button>
          </div>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-surface)] border border-[var(--border)] hover:bg-[var(--hover-state)] px-3 py-2 rounded-md transition-colors"
          >
            <Download size={13} />
            <span>Download .MD</span>
          </button>
        </div>
      </div>

      {/* Flagged Review Alert */}
      {sections.some((s) => s.flaggedForReview) && (
        <div className="bg-[var(--status-warning-bg)] border border-[var(--status-warning)]/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-[var(--status-warning)] shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="text-[var(--text-main)] block font-semibold">
              Synchronization Review Required
            </strong>
            <span className="text-[var(--text-muted)]">
              One or more manuscript sections are flagged because upstream execution runs or datasets changed. Please inspect and approve the synchronized text.
            </span>
          </div>
        </div>
      )}

      {/* Editor Tab */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Section Navigation Column */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block px-2 mb-1">
              Manuscript Sections
            </span>
            {sections.map((sec) => (
              <button
                key={sec.key}
                onClick={() => {
                  setSelectedSectionKey(sec.key);
                  setIsEditingSection(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-md text-xs font-medium text-left transition-colors ${
                  selectedSectionKey === sec.key
                    ? 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--accent-primary)] font-semibold shadow-none'
                    : 'text-[var(--text-main)] hover:bg-[var(--hover-state)]'
                }`}
              >
                <span className="truncate">{sec.title}</span>
                {sec.flaggedForReview && (
                  <span className="w-2 h-2 rounded-full bg-[var(--status-warning)]" title="Needs review" />
                )}
              </button>
            ))}

            <div className="pt-4 border-t border-[var(--border)] px-2 text-xs">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Verified References
              </span>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                {manuscript.references?.length || 0} cited records
              </span>
            </div>
          </div>

          {/* Section Content Column */}
          <div className="md:col-span-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-6 space-y-4 shadow-none">
            {activeSection && (
              <>
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h2 className="text-base font-serif font-semibold text-[var(--text-main)]">
                      {activeSection.title}
                    </h2>
                    {activeSection.flaggedForReview && (
                      <span className="text-[10px] text-[var(--status-warning)] font-mono mt-0.5 block">
                        Reason: {activeSection.reviewReason || 'Upstream data change'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditingSection ? (
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-1 text-xs font-medium text-[var(--accent-primary-fg)] bg-[var(--accent-primary)] hover:opacity-90 px-3 py-1.5 rounded transition-colors"
                      >
                        <Save size={12} />
                        <span>Save Section</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleStartEdit}
                        className="flex items-center gap-1 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-surface)] border border-[var(--border)] hover:bg-[var(--hover-state)] px-3 py-1.5 rounded transition-colors"
                      >
                        <Edit3 size={12} />
                        <span>Edit Text</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDraftSection(activeSection.key)}
                      disabled={isDrafting}
                      className="flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                    >
                      {isDrafting ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      <span>Synchronize Draft</span>
                    </button>
                  </div>
                </div>

                {/* Section Content Area */}
                {isEditingSection ? (
                  <textarea
                    rows={16}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full text-xs font-mono bg-[var(--bg-terminal)] border border-[var(--border)] rounded p-4 text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] leading-relaxed resize-y"
                  />
                ) : (
                  <div className="font-serif text-sm leading-relaxed max-w-none text-[var(--text-main)]">
                    <MarkdownRenderer content={activeSection.content} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Full Preview Tab */}
      {activeTab === 'preview' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-10 max-w-3xl mx-auto shadow-none space-y-6">
          <div className="border-b border-[var(--border)] pb-6 text-center space-y-2">
            <h1 className="font-serif text-2xl font-bold text-[var(--text-main)] leading-snug">
              {manuscript.title || project.title}
            </h1>
            <p className="text-xs text-[var(--text-muted)] italic font-serif">
              ProbePeer Reproducible Scientific Workspace • {project.domain}
            </p>
          </div>

          <div className="space-y-6 text-sm font-serif text-[var(--text-main)] leading-relaxed">
            {sections.map((sec) => (
              <div key={sec.key} className="space-y-2">
                <MarkdownRenderer content={sec.content} />
              </div>
            ))}

            {/* References Section */}
            <div className="pt-6 border-t border-[var(--border)] space-y-3 font-sans">
              <h3 className="font-serif text-sm font-semibold text-[var(--text-main)]">
                References & Bibliographic Identifiers
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-[11px] text-[var(--text-muted)]">
                {(manuscript.references || []).map((ref, idx) => (
                  <li key={idx} className="leading-snug">
                    <span className="text-[var(--text-main)]">{ref.formattedString}</span>{' '}
                    <span className="text-[var(--status-success)] font-mono text-[10px] ml-1">
                      [Verified Record]
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

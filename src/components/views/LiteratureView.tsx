import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
  Check
} from 'lucide-react';
import { ResearchProject, LiteratureSource, EvidenceEntry, CandidateGap } from '../../types';
import { api } from '../../services/api';

interface LiteratureViewProps {
  project: ResearchProject;
  onUpdateProject: (updated: Partial<ResearchProject>) => void;
}

export const LiteratureView: React.FC<LiteratureViewProps> = ({
  project,
  onUpdateProject
}) => {
  const [searchQuery, setSearchQuery] = useState(project.researchQuestion || project.title || '');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<'all' | 'openalex' | 'crossref' | 'arxiv'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LiteratureSource[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [coverageNotice, setCoverageNotice] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const resp = await api.searchLiterature(searchQuery.trim(), selectedSourceFilter, 10);
      setSearchResults(resp.results || []);
      if (resp.errors && resp.errors.length > 0) {
        if (!resp.results || resp.results.length === 0) {
          setSearchError(resp.errors.map((err: any) => err.message).join(' '));
        } else {
          setSearchError(`Notice: ${resp.errors.map((err: any) => err.message).join(' ')}`);
        }
      }
    } catch (err: any) {
      setSearchResults([]);
      const errMsg = err.message || '';
      if (errMsg.includes('Crossref') && selectedSourceFilter === 'crossref') {
        setSearchError('Could not reach Crossref. Please try again in 60 seconds.');
      } else {
        setSearchError('Could not reach OpenAlex. Please try again in 60 seconds.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSource = (src: LiteratureSource) => {
    const existing = project.sources || [];
    if (existing.some((s) => s.doi === src.doi && src.doi)) return;
    
    const updatedSources = [...existing, { ...src, status: 'verified' as const }];
    onUpdateProject({
      sources: updatedSources,
      activityHistory: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          category: 'literature',
          action: 'Literature Source Added',
          details: `Added "${src.title.slice(0, 45)}..." from ${src.source} (DOI: ${src.doi || 'N/A'}).`,
          actor: 'Researcher'
        },
        ...(project.activityHistory || [])
      ]
    });
  };

  const handleSynthesizeEvidence = async () => {
    if (!project.sources || project.sources.length === 0) {
      alert('Please add at least one literature source to the project ledger before synthesizing.');
      return;
    }

    setIsSynthesizing(true);
    try {
      const synthesis = await api.synthesizeGaps({
        researchTopic: project.title,
        proposedQuestion: project.researchQuestion,
        hypothesis: project.hypothesis,
        domain: project.domain,
        sources: project.sources
      });

      const updatedEvidence = synthesis.evidenceMatrix || [];
      const updatedGaps = synthesis.candidateGaps || [];
      setCoverageNotice(synthesis.coverageLimitations || null);

      onUpdateProject({
        evidenceMatrix: updatedEvidence,
        candidateGaps: updatedGaps,
        activityHistory: [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            category: 'literature',
            action: 'Evidence Matrix & Gaps Synthesized',
            details: `Synthesized ${updatedEvidence.length} evidence records and ${updatedGaps.length} candidate gaps.`,
            actor: 'ProbePeer Synthesis Engine'
          },
          ...(project.activityHistory || [])
        ]
      });
    } catch (err: any) {
      alert(`Synthesis error: ${err.message}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#1c1917] tracking-tight">
            Literature Discovery & Evidence Matrix
          </h1>
          <p className="text-xs text-[#78716c] mt-1 max-w-2xl leading-relaxed">
            Query real scholarly metadata across OpenAlex, Crossref, and arXiv preprint servers. Extract structured evidence and evaluate candidate research gaps.
          </p>
        </div>

        <button
          onClick={handleSynthesizeEvidence}
          disabled={isSynthesizing || !project.sources || project.sources.length === 0}
          className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#1c1917] hover:bg-[#292524] disabled:bg-[#d6d3cb] px-3.5 py-2 rounded-md transition-colors shrink-0"
        >
          {isSynthesizing ? (
            <>
              <RefreshCw size={13} className="animate-spin" />
              <span>Synthesizing Evidence...</span>
            </>
          ) : (
            <>
              <Sparkles size={13} />
              <span>Synthesize Evidence Matrix</span>
            </>
          )}
        </button>
      </div>

      {/* Live Scholarly Search Bar */}
      <section className="bg-white border border-[#e7e5e0] rounded-lg p-5 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-3 text-[#78716c]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query OpenAlex, Crossref & arXiv (e.g. triglyceride hdl insulin resistance progression)..."
              className="w-full text-xs bg-[#faf9f5] border border-[#d6d3cb] text-[#1c1917] rounded-md pl-9 pr-3.5 py-2.5 focus:outline-none focus:border-[#4338ca] focus:bg-white"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedSourceFilter}
              onChange={(e: any) => setSelectedSourceFilter(e.target.value)}
              className="text-xs bg-white border border-[#d6d3cb] text-[#44403c] rounded-md px-2.5 py-2"
            >
              <option value="all">All Sources (OpenAlex, Crossref, arXiv)</option>
              <option value="openalex">OpenAlex API</option>
              <option value="crossref">Crossref REST API</option>
              <option value="arxiv">arXiv Preprints</option>
            </select>

            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 text-[var(--accent-primary-fg)] text-xs font-medium px-4 py-2 rounded-md flex items-center gap-1.5 shrink-0 transition-all shadow-none"
            >
              {isSearching ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
              <span>Search Literature</span>
            </button>
          </div>
        </form>

        {searchError && (
          <div className="p-3 bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] text-[var(--status-danger)] rounded-lg text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={15} className="text-[var(--status-danger)] shrink-0" />
              <span className="font-medium">{searchError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSearchError(null)}
              className="text-[var(--status-danger)] hover:opacity-70 text-xs px-1.5 py-0.5 rounded cursor-pointer transition-opacity"
              title="Dismiss notification"
            >
              ✕
            </button>
          </div>
        )}

        {/* Live Search Results */}
        {searchResults.length > 0 && (
          <div className="pt-3 border-t border-[#f2f1ec] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#78716c]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Retrieved Results ({searchResults.length})
              </span>
              <span className="font-mono text-[11px]">Deduplicated by DOI & Title</span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {searchResults.map((item) => {
                const isAlreadyAdded = (project.sources || []).some(
                  (s) => s.doi === item.doi && item.doi
                );

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-[#faf9f5] hover:bg-white border border-[#e7e5e0] rounded-md text-xs space-y-1.5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#f2f1ec] text-[#44403c] rounded border border-[#e7e5e0]">
                            {item.source}
                          </span>
                          {item.year && (
                            <span className="text-[10px] text-[#78716c] font-mono">{item.year}</span>
                          )}
                          {item.openAccess && (
                            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1 rounded border border-emerald-200 font-mono">
                              Open Access
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-[#1c1917] leading-snug">{item.title}</h4>
                        <p className="text-[11px] text-[#78716c] mt-0.5">{item.authors}</p>
                      </div>

                      <button
                        onClick={() => handleAddSource(item)}
                        disabled={isAlreadyAdded}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded shrink-0 flex items-center gap-1 transition-colors ${
                          isAlreadyAdded
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-white border border-[#d6d3cb] text-[#44403c] hover:bg-[#f2efe9]'
                        }`}
                      >
                        {isAlreadyAdded ? (
                          <>
                            <Check size={11} />
                            <span>In Ledger</span>
                          </>
                        ) : (
                          <>
                            <Plus size={11} />
                            <span>Add to Project</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-[#78716c] line-clamp-2 leading-relaxed">
                      {item.abstract}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-[#78716c] font-mono pt-1">
                      {item.doi && <span>DOI: {item.doi}</span>}
                      {item.venue && <span>Venue: {item.venue}</span>}
                      {item.citations > 0 && <span>Citations: {item.citations}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Indexed Project Sources Ledger */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#1c1917] uppercase tracking-wider">
              Project Literature Sources ({project.sources?.length || 0})
            </h2>
            <p className="text-xs text-[#78716c]">
              Verified bibliographic records used for evidence extraction and citation integrity.
            </p>
          </div>
        </div>

        {project.sources && project.sources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {project.sources.map((src) => (
              <div
                key={src.id}
                className="bg-white border border-[#e7e5e0] rounded-lg p-4 space-y-2 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[10px] mb-1">
                    <span className="font-mono bg-[#f2f1ec] px-1.5 py-0.5 rounded text-[#44403c]">
                      {src.source} • {src.year || 'n.d.'}
                    </span>
                    <span className="text-emerald-700 font-mono flex items-center gap-1">
                      <CheckCircle2 size={11} /> Verified Record
                    </span>
                  </div>

                  <h3 className="font-medium text-[#1c1917] leading-snug">{src.title}</h3>
                  <p className="text-[11px] text-[#78716c] mt-1">{src.authors}</p>
                </div>

                <div className="pt-2 border-t border-[#f2f1ec] flex items-center justify-between text-[11px] text-[#78716c] font-mono">
                  <span className="truncate max-w-[200px]">{src.doi ? `doi:${src.doi}` : src.venue}</span>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent-primary)] hover:underline flex items-center gap-0.5"
                    >
                      <span>Link</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-[#d6d3cb] rounded-lg p-6 text-center text-xs text-[#78716c]">
            No sources added to this project yet. Use the search bar above to query OpenAlex, Crossref, and arXiv.
          </div>
        )}
      </section>

      {/* Structured Evidence Matrix */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#1c1917] uppercase tracking-wider">
              Structured Evidence Matrix
            </h2>
            <p className="text-xs text-[#78716c]">
              Extracted findings, populations, limitations, and relationships to the proposed research question.
            </p>
          </div>
          {coverageNotice && (
            <span className="text-[10px] font-mono text-[#78716c] max-w-sm text-right">
              {coverageNotice}
            </span>
          )}
        </div>

        {project.evidenceMatrix && project.evidenceMatrix.length > 0 ? (
          <div className="bg-white border border-[#e7e5e0] rounded-lg overflow-hidden overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f7f6f2] border-b border-[#e7e5e0] text-[11px] font-semibold text-[#78716c] uppercase tracking-wider">
                  <th className="p-3">Source & Identifier</th>
                  <th className="p-3">Cohort / System</th>
                  <th className="p-3">Methods Used</th>
                  <th className="p-3">Reported Findings</th>
                  <th className="p-3">Author Limitations</th>
                  <th className="p-3">Relationship</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f1ec]">
                {project.evidenceMatrix.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-[#faf9f5]">
                    <td className="p-3 font-medium text-[#1c1917] max-w-xs">
                      <div>{item.sourceTitle}</div>
                      {item.doi && <div className="text-[10px] text-[#78716c] font-mono mt-0.5">DOI: {item.doi}</div>}
                    </td>
                    <td className="p-3 text-[#44403c]">{item.populationOrSystem}</td>
                    <td className="p-3 text-[#44403c]">{item.methodsUsed}</td>
                    <td className="p-3 text-[#1c1917] font-medium max-w-xs">{item.mainFindings}</td>
                    <td className="p-3 text-[#b45309] text-[11px] max-w-xs">{item.limitationsReportedByAuthors}</td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap ${
                          item.relationshipToProposedQuestion === 'Supports'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : item.relationshipToProposedQuestion === 'Contradicts'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        {item.relationshipToProposedQuestion}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-[#d6d3cb] rounded-lg p-6 text-center text-xs text-[#78716c]">
            Evidence matrix empty. Click <strong>"Synthesize Evidence Matrix"</strong> above to extract findings and author-reported limitations.
          </div>
        )}
      </section>
    </div>
  );
};

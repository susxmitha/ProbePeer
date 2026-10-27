import React, { useState } from 'react';
import {
  Database,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Table,
  FileText,
  BarChart2,
  ShieldAlert,
  ArrowRight,
  Layers,
  Sparkles,
  Search,
  ExternalLink,
  Download,
  Loader2,
  Globe
} from 'lucide-react';
import { ResearchProject, DatasetRecord, ColumnInspection, DiscoveredDataset } from '../../types';
import { api } from '../../services/api';
import { SAMPLE_CSV_DIABETES } from '../../services/sampleData';

interface DatasetViewProps {
  project: ResearchProject;
  onUpdateProject: (updated: Partial<ResearchProject>) => void;
  onNavigateToMethods: () => void;
}

export const DatasetView: React.FC<DatasetViewProps> = ({
  project,
  onUpdateProject,
  onNavigateToMethods
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<ColumnInspection | null>(null);

  // Reliable Public Dataset Discovery State
  const defaultQuery = project.researchQuestion
    ? project.researchQuestion.replace(/^(Do|Does|Is|Can|How)\s+/i, '').replace(/[?.,]/g, '').trim()
    : (project.title || 'type 2 diabetes lipids');

  const [searchQuery, setSearchQuery] = useState(defaultQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [discoveredDatasets, setDiscoveredDatasets] = useState<DiscoveredDataset[]>([]);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const dataset = project.dataset;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const parsedRecord = api.parseCsvFile(text, file.name);
        const feasibility = api.evaluateFeasibility(parsedRecord, project.researchQuestion);
        parsedRecord.feasibilityReport = feasibility;

        onUpdateProject({
          dataset: parsedRecord,
          activityHistory: [
            {
              id: `act-${Date.now()}`,
              timestamp: new Date().toISOString(),
              category: 'dataset',
              action: 'CSV Dataset Uploaded & Profiled',
              details: `Uploaded ${file.name} (${parsedRecord.rowCount} rows, ${parsedRecord.columnCount} cols). Feasibility assessed as ${feasibility.overallFeasibility}.`,
              actor: 'Researcher'
            },
            ...(project.activityHistory || [])
          ]
        });
      } catch (err: any) {
        alert(`Failed to parse CSV: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleDataset = () => {
    setIsProcessing(true);
    try {
      const parsed = api.parseCsvFile(SAMPLE_CSV_DIABETES, 't2d_glycemic_progression_cohort.csv');
      const feasibility = api.evaluateFeasibility(parsed, project.researchQuestion);
      parsed.feasibilityReport = feasibility;

      onUpdateProject({
        dataset: parsed,
        activityHistory: [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            category: 'dataset',
            action: 'Scientific Benchmark Dataset Loaded',
            details: 'Loaded T2D Glycemic Cohort benchmark dataset (N=300).',
            actor: 'Researcher'
          },
          ...(project.activityHistory || [])
        ]
      });
    } catch (err: any) {
      alert(`Error loading benchmark: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDiscover = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setDiscoveryError(null);
    try {
      const resp = await api.discoverDatasets(searchQuery.trim(), project.researchQuestion);
      setDiscoveredDatasets(resp.results || []);
      if (resp.error) {
        setDiscoveryError(resp.error);
      }
      setHasSearched(true);
    } catch (err: any) {
      setDiscoveryError(err.message || 'Could not reach data repository. Please try again or use the manual CSV upload below.');
      setDiscoveredDatasets([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#1c1917] tracking-tight">
            Dataset Discovery & Feasibility Evaluation
          </h1>
          <p className="text-xs text-[#78716c] mt-1 max-w-2xl leading-relaxed">
            Distinguish between discovering data and verifying whether it can genuinely answer your research question. Inspect schema, missingness, potential leakage, and statistical power boundaries.
          </p>
        </div>

        {dataset && (
          <button
            onClick={onNavigateToMethods}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#1c1917] hover:bg-[#292524] px-3.5 py-2 rounded-md transition-colors shrink-0"
          >
            <span>Proceed to Methods Plan</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* 1. Public Dataset Discovery Section */}
      <section className="bg-white border border-[#e7e5e0] rounded-lg p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f2efe9] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <h2 className="text-xs font-semibold text-[#1c1917] uppercase tracking-wider">
                Public Dataset Discovery Engine
              </h2>
            </div>
            <p className="text-xs text-[#78716c] mt-0.5">
              Live multi-repository search querying Zenodo, Hugging Face Datasets, and OpenAlex with guaranteed direct destination links.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#78716c]">
            <Globe size={13} className="text-[#a8a29e]" />
            <span>Zenodo • Hugging Face • OpenAlex</span>
          </div>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleDiscover} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search public repositories for datasets matching your research."
                className="w-full bg-[#faf9f5] border border-[#d6d3cb] focus:border-[#1c1917] focus:bg-white focus:outline-none rounded-md pl-10 pr-4 py-2.5 text-xs text-[#1c1917] placeholder:text-[#a8a29e] transition-colors"
                disabled={isSearching}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 text-[var(--accent-primary-fg)] text-xs font-medium px-5 py-2.5 rounded-md flex items-center justify-center gap-2 transition-all shrink-0 shadow-none cursor-pointer"
            >
              {isSearching ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Searching Repositories...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-current shrink-0" />
                  <span>Discover Datasets</span>
                </>
              )}
            </button>
          </div>

          {/* Quick-fill helper */}
          {project.researchQuestion && (
            <div className="flex items-center gap-2 text-[11px] text-[#78716c]">
              <span className="font-medium text-[#57534e]">Query based on research question:</span>
              <button
                type="button"
                onClick={() => {
                  const cleaned = project.researchQuestion.replace(/^(Do|Does|Is|Can|How)\s+/i, '').replace(/[?.,]/g, '').trim();
                  setSearchQuery(cleaned);
                }}
                className="text-[#1c1917] hover:underline underline-offset-2 font-mono text-[10px] bg-[#f5f5f4] px-2 py-0.5 rounded border border-[#e7e5e4] max-w-md truncate"
              >
                "{project.researchQuestion.slice(0, 70)}..."
              </button>
            </div>
          )}
        </form>

        {/* Loading State */}
        {isSearching && (
          <div className="p-8 text-center bg-[#faf9f5] border border-dashed border-[#d6d3cb] rounded-lg space-y-2">
            <Loader2 size={20} className="animate-spin text-[#1c1917] mx-auto" />
            <p className="text-xs font-medium text-[#1c1917]">
              Querying Zenodo, Hugging Face, and OpenAlex API records...
            </p>
            <p className="text-[11px] text-[#78716c]">
              Verifying link destinations and computing AI relevance rankings with Gemini.
            </p>
          </div>
        )}

        {/* Error Banner */}
        {discoveryError && !isSearching && (
          <div className="p-4 bg-amber-50/90 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-950">
                {discoveryError}
              </p>
              <p className="text-[11px] text-amber-800">
                You can retry your search query with different keywords or proceed with manual CSV upload directly below.
              </p>
            </div>
          </div>
        )}

        {/* Results Table */}
        {!isSearching && discoveredDatasets.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[#57534e]">
                Found <span className="font-semibold text-[#1c1917]">{discoveredDatasets.length} verified candidate datasets</span> across Zenodo, Hugging Face, and OpenAlex.
              </div>
              <span className="text-[10px] text-[#78716c] uppercase tracking-wider font-semibold">
                Ranked by AI Relevance
              </span>
            </div>

            <div className="overflow-x-auto border border-[#e7e5e0] rounded-lg bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e7e5e0] bg-[#faf9f5] text-[11px] font-semibold text-[#78716c] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-14 text-center">Rank</th>
                    <th className="py-2.5 px-3">Dataset Name</th>
                    <th className="py-2.5 px-3 w-28">Source</th>
                    <th className="py-2.5 px-3 w-44">Match Reason</th>
                    <th className="py-2.5 px-3 w-28">License</th>
                    <th className="py-2.5 px-3 w-32 text-right">Direct Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2efe9]">
                  {discoveredDatasets.map((ds, index) => {
                    const rank = ds.rank || index + 1;
                    const targetUrl = ds.isVerified ? ds.directLink : (ds.fallbackLink || ds.directLink);

                    return (
                      <tr key={ds.id} className="hover:bg-[#faf9f5]/80 transition-colors group">
                        {/* Rank */}
                        <td className="py-3 px-3 text-center align-top">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold ${
                              rank === 1
                                ? 'bg-[#1c1917] text-white shadow-xs'
                                : rank <= 3
                                ? 'bg-[#e7e5e0] text-[#1c1917]'
                                : 'text-[#78716c] bg-[#f5f5f4]'
                            }`}
                          >
                            {rank}
                          </span>
                        </td>

                        {/* Dataset Name */}
                        <td className="py-3 px-3 align-top max-w-sm">
                          <div className="font-medium text-[#1c1917] group-hover:text-blue-900 transition-colors line-clamp-2" title={ds.name}>
                            {ds.name}
                          </div>
                          {ds.description && (
                            <div className="text-[11px] text-[#78716c] line-clamp-2 mt-1 leading-snug">
                              {ds.description}
                            </div>
                          )}
                          {ds.downloadsOrCitations && (
                            <div className="text-[10px] text-[#a8a29e] mt-1 font-mono">
                              Activity: {ds.downloadsOrCitations}
                            </div>
                          )}
                        </td>

                        {/* Source */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                                ds.source === 'Zenodo'
                                  ? 'bg-[var(--pill-bg)] text-[var(--pill-text)] border border-[var(--pill-border)]'
                                  : ds.source === 'Hugging Face'
                                  ? 'bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)]'
                                  : 'bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success-border)]'
                              }`}
                            >
                              {ds.source}
                            </span>
                            {ds.hasDirectCsv ? (
                              <span className="text-[10px] text-[var(--status-success)] font-semibold bg-[var(--status-success-bg)] border border-[var(--status-success-border)] px-1.5 py-0.5 rounded">
                                CSV Data File
                              </span>
                            ) : ds.fileFormat ? (
                              <span className="text-[10px] text-[var(--text-muted)] font-medium bg-[var(--bg-surface-elevated)] border border-[var(--border)] px-1.5 py-0.5 rounded">
                                {ds.fileFormat}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        {/* Match Reason */}
                        <td className="py-3 px-3 align-top">
                          <span className="inline-block bg-[#f5f5f4] text-[#1c1917] border border-[#e7e5e4] px-2 py-0.5 rounded text-[11px] font-medium leading-tight">
                            {ds.matchReason}
                          </span>
                          {ds.confidenceScore && (
                            <span className="block text-[10px] text-[#78716c] mt-1 font-mono">
                              {ds.confidenceScore}% confidence
                            </span>
                          )}
                        </td>

                        {/* License */}
                        <td className="py-3 px-3 align-top text-[11px] text-[#57534e] font-mono whitespace-nowrap">
                          <span className="truncate max-w-[100px] inline-block" title={ds.license}>
                            {ds.license || 'Open Access'}
                          </span>
                        </td>

                        {/* Direct Link / Download Action */}
                        <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                          {ds.hasDirectCsv && ds.dataFileUrl ? (
                            <div className="flex flex-col items-end gap-1">
                              <a
                                href={ds.dataFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors shadow-xs"
                              >
                                <Download size={11} />
                                <span>Download CSV</span>
                              </a>
                              <a
                                href={targetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-[#78716c] hover:text-[#1c1917] underline underline-offset-2 flex items-center gap-0.5"
                              >
                                <span>View Dataset Record</span>
                                <ExternalLink size={9} />
                              </a>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-1">
                              <a
                                href={ds.dataFileUrl || targetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1c1917] hover:bg-[#292524] text-white text-xs font-medium transition-colors shadow-xs"
                              >
                                <span>View Dataset Record</span>
                                <ExternalLink size={11} />
                              </a>
                              {!ds.isVerified && (
                                <span className="block text-[9px] text-amber-600 mt-0.5 font-medium">
                                  Link Unverified (Search fallback)
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[#faf9f5] border border-[#e7e5e0] rounded-md text-[11px] text-[#78716c] flex items-center justify-between">
              <span>
                Found an optimal dataset? Download its CSV file and upload it below to assess real feasibility and compute feature statistics.
              </span>
              <span className="text-[#a8a29e] font-medium shrink-0 ml-4">
                Strict Data File Filter Active
              </span>
            </div>
          </div>
        )}

        {/* Empty Search State */}
        {!isSearching && hasSearched && discoveredDatasets.length === 0 && !discoveryError && (
          <div className="p-8 text-center bg-[#faf9f5] border border-dashed border-[#d6d3cb] rounded-lg space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-100/70 border border-amber-200/80 flex items-center justify-center mx-auto text-amber-800">
              <Database size={18} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#1c1917]">
                No direct datasets found for this query. Try broader keywords (e.g., 'T2D lipidomics data' instead of 'predict 24-month glycemic progression').
              </p>
              <p className="text-[11px] text-[#78716c] max-w-lg mx-auto">
                Filtered out paper preprints, reviews, and text PDFs to guarantee that only real structured data repositories (CSV, XLSX, Parquet, ZIP) are shown.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('T2D lipidomics data');
                }}
                className="text-[11px] font-medium text-[#1c1917] bg-white border border-[#d6d3cb] hover:bg-[#f2efe9] px-3 py-1.5 rounded transition-colors"
              >
                Try "T2D lipidomics data"
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('diabetes clinical cohort');
                }}
                className="text-[11px] font-medium text-[#1c1917] bg-white border border-[#d6d3cb] hover:bg-[#f2efe9] px-3 py-1.5 rounded transition-colors"
              >
                Try "diabetes clinical cohort"
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('lipidomics');
                }}
                className="text-[11px] font-medium text-[#1c1917] bg-white border border-[#d6d3cb] hover:bg-[#f2efe9] px-3 py-1.5 rounded transition-colors"
              >
                Try "lipidomics"
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Dataset Upload / Switcher Box */}
      <section className="bg-white border border-[#e7e5e0] rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xs font-semibold text-[#1c1917] uppercase tracking-wider">
              Dataset Source
            </h2>
            <p className="text-xs text-[#78716c] mt-0.5">
              Upload any experimental or observational CSV file, or load our standardized benchmark dataset.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-white border border-[#d6d3cb] hover:bg-[#f2efe9] text-[#1c1917] text-xs font-medium px-3.5 py-2 rounded-md flex items-center gap-1.5 transition-colors">
              <Upload size={13} />
              <span>{dataset ? 'Replace CSV File' : 'Upload CSV File'}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
            </label>

            <button
              onClick={handleLoadSampleDataset}
              disabled={isProcessing}
              className="bg-[#faf9f5] border border-[#d6d3cb] hover:bg-[#f2efe9] text-[#44403c] text-xs font-medium px-3.5 py-2 rounded-md flex items-center gap-1.5 transition-colors"
            >
              <Database size={13} />
              <span>Load T2D Benchmark</span>
            </button>
          </div>
        </div>

        {dataset && (
          <div className="pt-4 border-t border-[#f2f1ec] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#faf9f5] border border-[#e7e5e0] rounded p-3">
              <span className="text-[10px] uppercase font-semibold text-[#78716c] block">
                Total Observations
              </span>
              <span className="text-base font-serif font-semibold text-[#1c1917]">
                {dataset.rowCount} rows
              </span>
            </div>
            <div className="bg-[#faf9f5] border border-[#e7e5e0] rounded p-3">
              <span className="text-[10px] uppercase font-semibold text-[#78716c] block">
                Feature Columns
              </span>
              <span className="text-base font-serif font-semibold text-[#1c1917]">
                {dataset.columnCount} cols
              </span>
            </div>
            <div className="bg-[#faf9f5] border border-[#e7e5e0] rounded p-3">
              <span className="text-[10px] uppercase font-semibold text-[#78716c] block">
                Duplicate Rows
              </span>
              <span className="text-base font-serif font-semibold text-[#1c1917]">
                {dataset.duplicateRows}
              </span>
            </div>
            <div className="bg-[#faf9f5] border border-[#e7e5e0] rounded p-3">
              <span className="text-[10px] uppercase font-semibold text-[#78716c] block">
                Cell Missingness
              </span>
              <span className="text-base font-serif font-semibold text-[#1c1917]">
                {dataset.missingnessRate}%
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Feasibility Assessment Report */}
      {dataset?.feasibilityReport && (
        <section className="bg-white border border-[#e7e5e0] rounded-lg p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-[var(--accent-primary)]" />
              <h2 className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider font-serif">
                Scientific Feasibility Assessment Report
              </h2>
            </div>
            <span
              className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${
                dataset.feasibilityReport.overallFeasibility === 'Feasible'
                  ? 'bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)]'
                  : 'bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning-border)]'
              }`}
            >
              {dataset.feasibilityReport.overallFeasibility}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-[var(--text-muted)] text-[10px] uppercase block mb-1">
                  Outcome Measurability:
                </span>
                <p className="text-[var(--text-main)] leading-relaxed">
                  {dataset.feasibilityReport.outcomeMeasurability}
                </p>
              </div>

              <div>
                <span className="font-semibold text-[var(--text-muted)] text-[10px] uppercase block mb-1">
                  Sample Size & Statistical Power:
                </span>
                <p className="text-[var(--text-main)] leading-relaxed">
                  {dataset.feasibilityReport.sampleSizeDetails}
                </p>
              </div>

              <div>
                <span className="font-semibold text-[var(--text-muted)] text-[10px] uppercase block mb-1">
                  Candidate Confounders Detected:
                </span>
                <ul className="list-disc list-inside text-[var(--text-main)] space-y-0.5">
                  {dataset.feasibilityReport.confoundingFactors.map((cf, idx) => (
                    <li key={idx}>{cf}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-[var(--status-success-bg)] border border-[var(--status-success-border)] rounded-md">
                <span className="font-semibold text-[var(--status-success)] text-[10px] uppercase tracking-wider block mb-1.5">
                  Claims This Dataset CAN Support:
                </span>
                <ul className="list-disc list-inside text-[var(--status-success)] space-y-1">
                  {dataset.feasibilityReport.supportedClaims.map((claim, idx) => (
                    <li key={idx} className="leading-snug">{claim}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] rounded-md">
                <span className="font-semibold text-[var(--status-danger)] text-[10px] uppercase tracking-wider block mb-1.5">
                  Claims This Dataset CANNOT Support:
                </span>
                <ul className="list-disc list-inside text-[var(--status-danger)] space-y-1">
                  {dataset.feasibilityReport.unsupportedClaims.map((claim, idx) => (
                    <li key={idx} className="leading-snug">{claim}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Column Schema & Statistical Inspection */}
      {dataset && (
        <section className="bg-white border border-[#e7e5e0] rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-[#1c1917] uppercase tracking-wider">
                Column Schema & Statistical Distributions
              </h2>
              <p className="text-xs text-[#78716c]">
                Click any column to inspect sample values, variance, and leakage diagnostics.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f7f6f2] border-b border-[#e7e5e0] text-[11px] font-semibold text-[#78716c] uppercase tracking-wider">
                  <th className="p-2.5">Column Name</th>
                  <th className="p-2.5">Inferred Type</th>
                  <th className="p-2.5">Missingness</th>
                  <th className="p-2.5">Unique Values</th>
                  <th className="p-2.5">Summary Statistics</th>
                  <th className="p-2.5">Diagnostics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f1ec]">
                {dataset.columns.map((col) => (
                  <tr
                    key={col.name}
                    onClick={() => setSelectedColumn(col)}
                    className="hover:bg-[var(--hover-state)] cursor-pointer transition-colors"
                  >
                    <td className="p-2.5 font-medium">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--pill-bg)] text-[var(--pill-text)] border border-[var(--pill-border)] font-medium">
                        {col.name}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border border-[var(--border)]">
                        {col.inferredType}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className={col.missingPercentage > 10 ? 'text-[var(--status-danger)] font-medium' : 'text-[var(--text-muted)]'}>
                        {col.missingPercentage}% ({col.missingCount})
                      </span>
                    </td>
                    <td className="p-2.5 text-[var(--text-muted)] font-mono">
                      {col.uniqueValuesCount}
                    </td>
                    <td className="p-2.5 text-[var(--text-main)] font-mono text-[11px]">
                      {col.mean !== undefined ? (
                        <span>
                          μ={col.mean}, σ={col.stdDev || 'N/A'}, [{col.min} .. {col.max}]
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">Categorical/Text</span>
                      )}
                    </td>
                    <td className="p-2.5">
                      {col.isPotentialTarget && (
                        <span className="text-[10px] font-mono bg-[var(--pill-bg)] text-[var(--pill-text)] border border-[var(--pill-border)] px-1.5 py-0.5 rounded">
                          Candidate Target
                        </span>
                      )}
                      {col.isPotentialLeakage && (
                        <span className="text-[10px] font-mono bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)] px-1.5 py-0.5 rounded ml-1">
                          Leakage Warning
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Raw CSV Preview */}
      {dataset?.rawCsvSnippet && (
        <section className="bg-white border border-[#e7e5e0] rounded-lg p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#78716c]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Raw CSV Head Snippet
            </span>
            <span className="font-mono text-[11px]">{dataset.sourceFilename}</span>
          </div>
          <pre className="p-3 bg-[#faf9f5] border border-[#e7e5e0] rounded text-[11px] font-mono text-[#292524] overflow-x-auto whitespace-pre">
            {dataset.rawCsvSnippet}
          </pre>
        </section>
      )}
    </div>
  );
};

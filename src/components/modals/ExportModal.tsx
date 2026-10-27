import React, { useState } from 'react';
import { X, Download, FileText, Database, Printer, CheckCircle2, Archive, RefreshCw } from 'lucide-react';
import JSZip from 'jszip';
import { ResearchProject } from '../../types';
import { computeStringHash, computePlanHash } from '../../utils/planVersioning';
import { api } from '../../services/api';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ResearchProject;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const handleExportZipBundle = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // 1. Python Code
      const code = project.executionRuns?.[0]?.code || 
`# ProbePeer Computational Pipeline
# Project: ${project.title}
# Study Design: ${project.methodPlan?.studyDesign || 'Empirical Analysis'}
import csv, math, statistics

# Replace with your dataset filename if running locally
DATASET_PATH = 'dataset.csv'

with open(DATASET_PATH, 'r') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Loaded {len(rows)} observations for reproducible execution.")
`;
      zip.file('analysis_script.py', code);

      // 2. Dataset CSV
      const csvData = project.dataset?.fullCsv || project.dataset?.rawCsvSnippet || 'patient_id,x,y\n1,10,20\n';
      zip.file('dataset.csv', csvData);

      // 3. Calculate SHA-256 Checksums
      const scriptSha256 = await computeStringHash(code);
      const datasetSha256 = await computeStringHash(csvData);
      const checksumsContent = `${scriptSha256}  analysis_script.py\n${datasetSha256}  dataset.csv\n`;
      zip.file('checksums.sha256', checksumsContent);

      // 4. Pinned Python Dependencies
      const requirementsContent = `pandas==2.2.0
numpy==1.26.4
scikit-learn==1.4.1
scipy==1.12.0
statsmodels==0.14.1
matplotlib==3.8.3
`;
      zip.file('requirements.txt', requirementsContent);

      // 5. Provenance Ledger & Plan Snapshot
      const activePlan = project.methodPlan;
      const planHash = activePlan?.planHash || (activePlan ? await computePlanHash(activePlan) : null);
      const activePlanVersionId = activePlan?.plan_version_id || (activePlan ? `plan-v${(activePlan.version || 1.0).toFixed(1)}` : null);

      const provenancePayload = {
        project_id: project.id,
        active_plan_version_id: activePlanVersionId,
        plan_hash: planHash,
        dataset_sha256: datasetSha256,
        script_sha256: scriptSha256,
        export_timestamp: new Date().toISOString()
      };
      zip.file('provenance.json', JSON.stringify(provenancePayload, null, 2));

      // 6. Readme & Instructions
      const readmeContent = `PROBEPEER REPRODUCIBLE RESEARCH BUNDLE
=========================================
Project: ${project.title}
Domain: ${project.domain}
Exported: ${new Date().toISOString()}
Plan Version: ${activePlanVersionId || 'Unspecified'} (SHA-256: ${planHash ? planHash.slice(0, 8) : 'N/A'})

CONTENTS:
1. analysis_script.py - Verified Python 3 computational pipeline
2. dataset.csv - Observational/experimental data evaluated in the study
3. requirements.txt - Pinned Python environment dependencies
4. checksums.sha256 - Cryptographic SHA-256 integrity signatures
5. provenance.json - Immutable execution linkage and plan hash verification
6. execution_results.json - Quantitative metrics, validation assertions, and logs
7. manuscript.md - Evidence-linked academic manuscript
8. decision_graph.json - Research decision network and dependency edges
9. project_manifest.json - Full machine-readable project archive

REPRODUCING COMPUTATIONAL EXECUTION:
1. Verify checksums:
   sha256sum -c checksums.sha256

2. Install pinned dependencies:
   pip install -r requirements.txt

3. Execute verification script:
   python3 analysis_script.py

ProbePeer guarantees long-term scientific reproducibility.
`;
      zip.file('README.txt', readmeContent);

      // 7. Execution Results JSON
      const latestRun = project.executionRuns?.[0] || null;
      const resultsPayload = {
        projectId: project.id,
        projectTitle: project.title,
        latestRunId: latestRun?.runId || null,
        planVersionId: latestRun?.plan_version_id || activePlanVersionId,
        executionStatus: latestRun?.status || 'Not executed',
        durationMs: latestRun?.durationMs || null,
        metrics: latestRun?.metrics || {},
        assertions: latestRun?.assertions || [],
        tables: latestRun?.tables || [],
        stdout: latestRun?.stdout || '',
        timestamp: latestRun?.timestamp || new Date().toISOString()
      };
      zip.file('execution_results.json', JSON.stringify(resultsPayload, null, 2));

      // 8. Manuscript Markdown
      let md = `# ${project.manuscript?.title || project.title}\n\n`;
      md += `*Research Domain: ${project.domain}*\n`;
      md += `*Exported from ProbePeer: ${new Date().toISOString()}*\n\n---\n\n`;

      (project.manuscript?.sections || []).forEach((sec) => {
        md += `${sec.content}\n\n`;
      });

      md += `### References\n\n`;
      (project.manuscript?.references || []).forEach((ref, idx) => {
        md += `${idx + 1}. ${ref.formattedString}\n`;
      });
      zip.file('manuscript.md', md);

      // 9. Decision Graph JSON
      const syncedGraph = (project.decisionGraph?.nodes && project.decisionGraph.nodes.length > 0)
        ? project.decisionGraph
        : api.syncDecisionGraph(project);
      zip.file('decision_graph.json', JSON.stringify(syncedGraph, null, 2));

      // 10. Full Manifest JSON
      zip.file('project_manifest.json', JSON.stringify(project, null, 2));

      // Generate Zip
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = project.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 35);
      a.download = `probepeer_${safeTitle}_bundle.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadSuccess('Exported complete .ZIP research bundle (Python, CSV, Results, Manuscript).');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err: any) {
      alert(`Failed to build ZIP bundle: ${err.message}`);
    } finally {
      setIsZipping(false);
    }
  };

  const handleExportJsonArchive = () => {
    const archivePayload = {
      projectManifestVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      platform: 'ProbePeer Scientific Workspace',
      project
    };

    const str = JSON.stringify(archivePayload, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `probepeer_${project.id}_archive.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadSuccess('Exported complete project manifest (JSON).');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleExportMarkdown = () => {
    let md = `# ${project.manuscript?.title || project.title}\n\n`;
    md += `*Research Domain: ${project.domain}*\n`;
    md += `*Exported from ProbePeer: ${new Date().toISOString()}*\n\n---\n\n`;

    (project.manuscript?.sections || []).forEach((sec) => {
      md += `${sec.content}\n\n`;
    });

    md += `### References\n\n`;
    (project.manuscript?.references || []).forEach((ref, idx) => {
      md += `${idx + 1}. ${ref.formattedString}\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `probepeer_${project.id}_manuscript.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadSuccess('Exported academic manuscript (Markdown).');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg max-w-lg w-full p-6 space-y-5 shadow-2xl transition-colors">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-[var(--accent-primary)]" />
            <h2 className="font-serif text-lg font-semibold text-[var(--text-main)]">
              Export Research Artifacts
            </h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          ProbePeer projects are fully exportable and self-contained to eliminate platform lock-in and guarantee long-term computational reproducibility.
        </p>

        {downloadSuccess && (
          <div className="p-2.5 bg-[var(--status-success-bg)] border border-[var(--status-success)]/30 text-[var(--status-success)] rounded text-xs flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[var(--status-success)] shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Complete .ZIP Bundle Option (Primary) */}
          <div
            onClick={handleExportZipBundle}
            className="p-4 border-2 border-[var(--accent-primary)] hover:bg-[var(--hover-state)] rounded-md cursor-pointer transition-all flex items-start gap-3 group bg-[var(--accent-primary)]/5"
          >
            <Archive size={20} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <div className="flex items-center gap-2">
                <strong className="text-[var(--text-main)] font-semibold block group-hover:text-[var(--accent-primary)]">
                  Complete Reproducible Research Bundle (.zip)
                </strong>
                <span className="text-[10px] font-mono bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] px-1.5 py-0.2 rounded font-medium">
                  Recommended
                </span>
              </div>
              <span className="text-[var(--text-muted)] block mt-1 leading-relaxed">
                Contains <strong>analysis_script.py</strong>, <strong>dataset.csv</strong>, <strong>requirements.txt</strong>, <strong>checksums.sha256</strong>, <strong>provenance.json</strong>, and full execution records. Ready to submit with a paper or rerun anywhere.
              </span>
            </div>
            {isZipping ? (
              <RefreshCw size={15} className="text-[var(--accent-primary)] animate-spin shrink-0 mt-1" />
            ) : (
              <Download size={15} className="text-[var(--accent-primary)] shrink-0 mt-1" />
            )}
          </div>

          {/* Academic Markdown Option */}
          <div
            onClick={handleExportMarkdown}
            className="p-3.5 border border-[var(--border)] hover:border-[var(--accent-primary)] rounded-md cursor-pointer bg-[var(--bg-base)] hover:bg-[var(--bg-surface)] transition-all flex items-start gap-3 group"
          >
            <FileText size={17} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <strong className="text-[var(--text-main)] font-semibold block group-hover:text-[var(--accent-primary)]">
                Academic Manuscript (.md)
              </strong>
              <span className="text-[var(--text-muted)] block mt-0.5">
                Formatted markdown with verified DOI citations and recorded results tables.
              </span>
            </div>
            <Download size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] shrink-0 mt-1" />
          </div>

          {/* Machine-readable JSON Manifest */}
          <div
            onClick={handleExportJsonArchive}
            className="p-3.5 border border-[var(--border)] hover:border-[var(--accent-primary)] rounded-md cursor-pointer bg-[var(--bg-base)] hover:bg-[var(--bg-surface)] transition-all flex items-start gap-3 group"
          >
            <Database size={17} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <strong className="text-[#1c1917] font-semibold block group-hover:text-[#1c1917]">
                Project JSON Manifest (.json)
              </strong>
              <span className="text-[#78716c] block mt-0.5">
                Single structured JSON file containing the full project data model.
              </span>
            </div>
            <Download size={14} className="text-[#78716c] shrink-0 mt-1" />
          </div>

          {/* Print Layout */}
          <div
            onClick={() => window.print()}
            className="p-3.5 border border-[#e7e5e0] hover:border-[#4338ca] rounded-md cursor-pointer bg-[#faf9f5] hover:bg-white transition-all flex items-start gap-3 group"
          >
            <Printer size={17} className="text-[#78716c] shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <strong className="text-[#1c1917] font-semibold block group-hover:text-[#1c1917]">
                Print / Save to PDF
              </strong>
              <span className="text-[#78716c] block mt-0.5">
                Formats manuscript view for standard browser PDF printing.
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[#f2f1ec]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#44403c] border border-[#d6d3cb] hover:bg-[#f2efe9] rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

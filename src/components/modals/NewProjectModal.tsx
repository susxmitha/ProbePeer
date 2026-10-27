import React, { useState } from 'react';
import { X, Sparkles, FolderPlus, ArrowRight } from 'lucide-react';
import { ResearchProject, ProjectStatus } from '../../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: ResearchProject) => void;
  initialPrompt?: string;
}

const DOMAINS = [
  'Biomedical Data Science & Epidemiology',
  'Computational Biology & Genomics',
  'Machine Learning & Benchmark Evaluation',
  'Neuroscience & Neuroimaging',
  'Quantitative Social Science',
  'Environmental & Climate Informatics',
  'General Computational Science'
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  initialPrompt = ''
}) => {
  const [title, setTitle] = useState(initialPrompt || '');
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [researchQuestion, setResearchQuestion] = useState(initialPrompt || '');
  const [hypothesis, setHypothesis] = useState('');
  const [targetPopulation, setTargetPopulation] = useState('');
  const [intendedContribution, setIntendedContribution] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newProject: ResearchProject = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: researchQuestion.trim() || 'New research inquiry.',
      status: 'Draft',
      domain,
      researchQuestion: researchQuestion.trim() || title.trim(),
      hypothesis: hypothesis.trim(),
      targetPopulation: targetPopulation.trim(),
      intendedContribution: intendedContribution.trim(),
      constraints: '',
      sources: [],
      evidenceMatrix: [],
      candidateGaps: [],
      dataset: null,
      methodPlan: null,
      executionRuns: [],
      decisionGraph: {
        nodes: [],
        edges: []
      },
      manuscript: {
        title: title.trim(),
        sections: [
          { key: 'abstract', title: 'Abstract', content: '### Abstract\n\n[Pending evidence and execution outputs.]', flaggedForReview: false },
          { key: 'introduction', title: '1. Introduction', content: '### 1. Introduction\n\n[State background and literature context.]', flaggedForReview: false },
          { key: 'methods', title: '2. Methods', content: '### 2. Methods\n\n[Specify study design and modeling procedures.]', flaggedForReview: false },
          { key: 'results', title: '3. Results', content: '### 3. Results\n\n[Pending execution run output verification.]', flaggedForReview: false },
          { key: 'discussion', title: '4. Discussion & Limitations', content: '### 4. Discussion & Limitations\n\n[Interpret findings and delineate boundary conditions.]', flaggedForReview: false },
          { key: 'conclusion', title: '5. Conclusion', content: '### 5. Conclusion\n\n[Summary of defensible contributions.]', flaggedForReview: false }
        ],
        references: [],
        lastUpdated: new Date().toISOString()
      },
      activityHistory: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          category: 'project',
          action: 'Research Project Initialized',
          details: `Created new project "${title.trim()}".`,
          actor: 'Researcher'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onCreateProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg max-w-xl w-full p-6 space-y-5 shadow-2xl transition-colors">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <FolderPlus size={18} className="text-[var(--accent-primary)]" />
            <h2 className="font-serif text-lg font-semibold text-[var(--text-main)]">
              Initialize New Research Project
            </h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[#44403c] block mb-1">
              Project Title / Working Topic <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Assessing Multivariable Lipid Markers in Type 2 Diabetes"
              className="w-full bg-[#faf9f5] border border-[#d6d3cb] text-[#1c1917] rounded p-2.5 focus:outline-none focus:border-[#4338ca] focus:bg-white"
            />
          </div>

          <div>
            <label className="font-semibold text-[#44403c] block mb-1">
              Scientific Domain
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full bg-[#faf9f5] border border-[#d6d3cb] text-[#1c1917] rounded p-2.5 focus:outline-none focus:border-[#4338ca]"
            >
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-[#44403c] block mb-1">
              Primary Research Question
            </label>
            <textarea
              rows={2}
              value={researchQuestion}
              onChange={(e) => setResearchQuestion(e.target.value)}
              placeholder="e.g. Does baseline TG/HDL ratio independently predict 24m glycemic decline after controlling for BMI?"
              className="w-full bg-[#faf9f5] border border-[#d6d3cb] text-[#1c1917] rounded p-2.5 focus:outline-none focus:border-[#4338ca] focus:bg-white"
            />
          </div>

          <div>
            <label className="font-semibold text-[#44403c] block mb-1">
              Working Hypothesis (Directional)
            </label>
            <input
              type="text"
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="e.g. Higher TG/HDL ratio confers an adjusted odds ratio > 1.4 for progression..."
              className="w-full bg-[#faf9f5] border border-[#d6d3cb] text-[#1c1917] rounded p-2.5 focus:outline-none focus:border-[#4338ca] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#44403c] block mb-1">
                Target Population / System
              </label>
              <input
                type="text"
                value={targetPopulation}
                onChange={(e) => setTargetPopulation(e.target.value)}
                placeholder="e.g. Adult outpatients with early T2D"
                className="w-full bg-[#faf9f5] border border-[#d6d3cb] text-[#1c1917] rounded p-2 focus:outline-none focus:border-[#4338ca]"
              />
            </div>
            <div>
              <label className="font-semibold text-[#44403c] block mb-1">
                Intended Contribution
              </label>
              <input
                type="text"
                value={intendedContribution}
                onChange={(e) => setIntendedContribution(e.target.value)}
                placeholder="e.g. Multi-covariate baseline benchmarking"
                className="w-full bg-[#faf9f5] border border-[#d6d3cb] text-[#1c1917] rounded p-2 focus:outline-none focus:border-[#4338ca]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[var(--accent-primary-fg)] bg-[var(--accent-primary)] hover:opacity-90 rounded-md transition-all shadow-none"
            >
              <span>Initialize Project</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

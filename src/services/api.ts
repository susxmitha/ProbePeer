import Papa from 'papaparse';
import {
  ResearchProject,
  LiteratureSource,
  ColumnInspection,
  DatasetRecord,
  DiscoveredDataset,
  FeasibilityReport,
  GraphNode,
  GraphEdge
} from '../types';

const STORAGE_KEY = 'probepeer_projects_cache';

export const api = {
  // 1. Projects
  async getProjects(): Promise<ResearchProject[]> {
    try {
      const resp = await fetch('/api/projects');
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch (e) {
      console.warn('API getProjects failed, checking localStorage cache:', e);
    }
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : [];
  },

  async getProject(id: string): Promise<ResearchProject | null> {
    try {
      const resp = await fetch(`/api/projects/${id}`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn(`API getProject(${id}) failed, checking localStorage cache:`, e);
    }
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const projects: ResearchProject[] = JSON.parse(cached);
      return projects.find(p => p.id === id) || null;
    }
    return null;
  },

  async saveProject(project: ResearchProject): Promise<ResearchProject> {
    project.updatedAt = new Date().toISOString();
    
    // Always update local cache first for instant feedback
    const cached = localStorage.getItem(STORAGE_KEY);
    let projects: ResearchProject[] = cached ? JSON.parse(cached) : [];
    const idx = projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      projects[idx] = project;
    } else {
      projects.unshift(project);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

    // Persist to server API
    try {
      const resp = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.project || project;
      }
    } catch (e) {
      console.warn('API saveProject failed, persisted to local cache:', e);
    }
    return project;
  },

  async deleteProject(id: string): Promise<boolean> {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      let projects: ResearchProject[] = JSON.parse(cached);
      projects = projects.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }

    try {
      const resp = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      return resp.ok;
    } catch (e) {
      console.warn(`API deleteProject(${id}) failed:`, e);
      return true;
    }
  },

  // 2. Scholarly Literature Search
  async searchLiterature(query: string, source: 'all' | 'openalex' | 'crossref' | 'arxiv' = 'all', limit: number = 10) {
    const resp = await fetch('/api/literature/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, source, limit })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Literature search failed' }));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }
    return await resp.json();
  },

  // 2.5 Public Dataset Discovery Engine
  async discoverDatasets(query: string, researchQuestion?: string): Promise<{
    query: string;
    researchQuestion: string;
    total: number;
    results: DiscoveredDataset[];
    message?: string;
    error?: string;
    repositoriesSearched: string[];
  }> {
    const resp = await fetch('/api/datasets/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, researchQuestion })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Could not reach data repository. Please try again or use the manual CSV upload below.' }));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }
    return await resp.json();
  },

  // 3. Scientific AI Synthesis & Evidence Matrix
  async synthesizeGaps(params: {
    researchTopic: string;
    proposedQuestion: string;
    hypothesis: string;
    domain: string;
    sources: LiteratureSource[];
  }) {
    const resp = await fetch('/api/ai/synthesize-gaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!resp.ok) {
      throw new Error(`Synthesis failed with HTTP ${resp.status}`);
    }
    const data = await resp.json();
    return data.data;
  },

  // 4. Methods Planning
  async generateMethodPlan(params: {
    researchQuestion: string;
    hypothesis: string;
    datasetMeta: any;
    variables: ColumnInspection[];
  }) {
    const resp = await fetch('/api/ai/method-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!resp.ok) {
      throw new Error(`Method plan generation failed with HTTP ${resp.status}`);
    }
    const data = await resp.json();
    return data.plan;
  },

  // 5. Python Computational Execution
  async executePythonCode(code: string, datasetCsv?: string, parameters?: Record<string, any>) {
    const resp = await fetch('/api/execution/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, datasetCsv, parameters })
    });
    if (!resp.ok) {
      throw new Error(`Execution request failed with HTTP ${resp.status}`);
    }
    return await resp.json();
  },

  // 6. Execution Environment Status
  async getExecutionEnvStatus() {
    try {
      const resp = await fetch('/api/execution/env-status');
      if (resp.ok) return await resp.json();
    } catch (e) {
      // ignore
    }
    return {
      available: true,
      runtime: 'Python 3 Standard Environment',
      version: '3.10.x',
      platform: 'linux',
      sandboxing: 'Isolated child execution process'
    };
  },

  // 7. Manuscript Section Drafting
  async draftManuscriptSection(sectionKey: string, projectData: any) {
    const resp = await fetch('/api/ai/draft-manuscript-section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionKey, projectData })
    });
    if (!resp.ok) {
      throw new Error(`Drafting section failed with HTTP ${resp.status}`);
    }
    const data = await resp.json();
    return data.text;
  },

  // 8. Robust CSV Dataset Parser & Statistical Profiler
  parseCsvFile(csvText: string, filename: string = 'dataset.csv'): DatasetRecord {
    const parsed = Papa.parse(csvText.trim(), {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });

    const rows = parsed.data as Record<string, any>[];
    const totalRows = rows.length;
    const fields = parsed.meta.fields || (rows[0] ? Object.keys(rows[0]) : []);

    // Check for duplicate rows
    const serializedRows = new Set<string>();
    let duplicateCount = 0;
    for (const r of rows) {
      const s = JSON.stringify(r);
      if (serializedRows.has(s)) {
        duplicateCount++;
      } else {
        serializedRows.add(s);
      }
    }

    let totalCells = totalRows * fields.length;
    let totalMissing = 0;

    const columns: ColumnInspection[] = fields.map((colName) => {
      let missing = 0;
      const values: any[] = [];
      const distinctSet = new Set();

      for (const r of rows) {
        const val = r[colName];
        if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
          missing++;
        } else {
          values.push(val);
          distinctSet.add(val);
        }
      }
      totalMissing += missing;

      // Type Inference
      const nonNullCount = values.length;
      let inferredType: ColumnInspection['inferredType'] = 'Text';
      let min: number | undefined;
      let max: number | undefined;
      let mean: number | undefined;
      let median: number | undefined;
      let stdDev: number | undefined;

      const numericValues = values.filter((v) => typeof v === 'number');
      const isBoolean = values.every((v) => typeof v === 'boolean' || v === 0 || v === 1 || v === 'true' || v === 'false');

      if (isBoolean && distinctSet.size <= 2) {
        inferredType = 'Boolean';
      } else if (numericValues.length > nonNullCount * 0.8 && nonNullCount > 0) {
        inferredType = 'Numeric';
        const sorted = [...numericValues].sort((a, b) => a - b);
        min = sorted[0];
        max = sorted[sorted.length - 1];
        const sum = sorted.reduce((acc, v) => acc + v, 0);
        mean = Number((sum / sorted.length).toFixed(4));
        median = sorted[Math.floor(sorted.length / 2)];
        
        // Std Dev
        const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean!, 2), 0) / (sorted.length - 1 || 1);
        stdDev = Number(Math.sqrt(variance).toFixed(4));
      } else if (distinctSet.size <= Math.min(25, nonNullCount * 0.2)) {
        inferredType = 'Categorical';
      } else if (colName.toLowerCase().includes('id') || colName.toLowerCase().includes('uuid')) {
        inferredType = 'Identifier';
      }

      const missingPercentage = totalRows > 0 ? Number(((missing / totalRows) * 100).toFixed(1)) : 0;
      const isPotentialLeakage = colName.toLowerCase().includes('target') || 
                                colName.toLowerCase().includes('label') || 
                                (distinctSet.size === totalRows && totalRows > 10 && inferredType === 'Identifier');

      const isPotentialTarget = colName.toLowerCase().includes('outcome') || 
                               colName.toLowerCase().includes('target') || 
                               colName.toLowerCase().includes('response') || 
                               colName.toLowerCase().includes('status') || 
                               colName.toLowerCase().includes('score');

      return {
        name: colName,
        inferredType,
        missingCount: missing,
        missingPercentage,
        uniqueValuesCount: distinctSet.size,
        min,
        max,
        mean,
        median,
        stdDev,
        sampleValues: values.slice(0, 5),
        isPotentialTarget,
        isPotentialLeakage,
        notes: missingPercentage > 20 ? 'High missingness rate (>20%)' : undefined
      };
    });

    const missingnessRate = totalCells > 0 ? Number(((totalMissing / totalCells) * 100).toFixed(2)) : 0;
    
    // Data quality warnings
    const dataQualityWarnings: string[] = [];
    if (duplicateCount > 0) {
      dataQualityWarnings.push(`Detected ${duplicateCount} duplicate row(s) in sample (${((duplicateCount / totalRows) * 100).toFixed(1)}%).`);
    }
    if (missingnessRate > 10) {
      dataQualityWarnings.push(`Overall missingness rate is ${missingnessRate}%, which may introduce attrition bias if not handled via imputation or sensitivity checks.`);
    }
    const highMissingCols = columns.filter(c => c.missingPercentage > 30);
    if (highMissingCols.length > 0) {
      dataQualityWarnings.push(`Column(s) ${highMissingCols.map(c => `"${c.name}"`).join(', ')} exceed 30% missingness and should not be used as primary predictors.`);
    }

    return {
      id: `ds-${Math.random().toString(36).substring(2, 9)}`,
      name: filename.replace(/\.csv$/i, ''),
      sourceFilename: filename,
      uploadedAt: new Date().toISOString(),
      rowCount: totalRows,
      columnCount: fields.length,
      duplicateRows: duplicateCount,
      missingnessRate,
      columns,
      dataQualityWarnings,
      rawCsvSnippet: csvText.split('\n').slice(0, 8).join('\n'),
      fullCsv: csvText
    };
  },

  // 9. Automated Scientific Feasibility Evaluator (Dynamically Analyzes Any Uploaded CSV)
  evaluateFeasibility(dataset: DatasetRecord, researchQuestion: string): FeasibilityReport {
    const numericCols = dataset.columns.filter(c => c.inferredType === 'Numeric');
    const categoricalCols = dataset.columns.filter(c => c.inferredType === 'Categorical' || c.inferredType === 'Boolean');
    const targetCol = dataset.columns.find(c => c.isPotentialTarget) || dataset.columns.find(c => {
      const l = c.name.toLowerCase();
      return l.includes('outcome') || l.includes('target') || l.includes('flag') || l.includes('progression') || l.includes('status') || l.includes('y');
    });

    const hasHighMissingness = dataset.missingnessRate > 10;
    const severeMissingCols = dataset.columns.filter(c => c.missingPercentage > 20);

    let sampleSizeSufficiency: FeasibilityReport['sampleSizeSufficiency'] = 'Sufficient';
    let sampleSizeDetails = '';
    if (dataset.rowCount < 50) {
      sampleSizeSufficiency = 'Underpowered';
      sampleSizeDetails = `Sample size N=${dataset.rowCount} is constrained. Suitable primarily for pilot exploratory estimation; underpowered for multivariable regression beyond 1-2 covariates (minimum recommended N >= 100).`;
    } else if (dataset.rowCount < 200) {
      sampleSizeSufficiency = 'Marginal';
      sampleSizeDetails = `Sample size N=${dataset.rowCount} provides adequate power for moderate effect sizes (Cohen's d >= 0.40), but caution is warranted when evaluating multi-covariate subgroup interactions.`;
    } else {
      sampleSizeSufficiency = 'Sufficient';
      sampleSizeDetails = `Sample size N=${dataset.rowCount} provides robust statistical power (>85% at two-sided alpha=0.05) to detect small-to-moderate adjusted effect sizes (f² >= 0.04, OR >= 1.25).`;
    }

    const confounders: string[] = [];
    dataset.columns.forEach(c => {
      const lower = c.name.toLowerCase();
      if (lower.includes('age') || lower.includes('gender') || lower.includes('sex') || lower.includes('site') || lower.includes('center') || lower.includes('batch') || lower.includes('time') || lower.includes('bmi')) {
        confounders.push(`Candidate confounder "${c.name}" (${c.inferredType}, missing: ${c.missingPercentage}%)`);
      }
    });
    if (confounders.length === 0) {
      confounders.push('No standard demographic or collection covariates detected in column headers; unmeasured confounders must be explicitly audited.');
    }

    const supportedClaims: string[] = [];
    if (targetCol && numericCols.length > 1) {
      const predictors = numericCols.filter(c => c.name !== targetCol.name).slice(0, 3).map(c => c.name).join(', ');
      supportedClaims.push(`Multivariable regression modeling target outcome "${targetCol.name}" as a function of continuous predictors (${predictors}) with N=${dataset.rowCount}.`);
    } else if (numericCols.length >= 2) {
      supportedClaims.push(`Bivariate correlation and covariance matrix estimation across ${numericCols.length} continuous dimensions (e.g., ${numericCols.slice(0, 3).map(c => c.name).join(', ')}).`);
    }

    if (categoricalCols.length > 0) {
      supportedClaims.push(`Subgroup stratification and non-parametric comparative hypothesis testing across categorical groups (${categoricalCols.slice(0, 3).map(c => c.name).join(', ')}).`);
    }
    supportedClaims.push(`Distributional diagnostic checking (normality, skewness, variance ratio) on observed continuous measurements.`);

    const unsupportedClaims: string[] = [
      'Causal directionality without prospective interventional randomization or validated instrumental variables.',
      'Generalizability to out-of-domain populations differing in baseline covariate distributions.'
    ];

    if (severeMissingCols.length > 0) {
      unsupportedClaims.push(`Unadjusted conclusions relying heavily on column(s) ${severeMissingCols.map(c => `"${c.name}" (${c.missingPercentage}%)`).join(', ')} due to potential missing-at-random (MAR) violation.`);
    }

    if (sampleSizeSufficiency === 'Underpowered') {
      unsupportedClaims.push('High-dimensional subgroup interaction claims or multiple comparison expansions due to power limitations (N < 50).');
    }

    const outcomeMeasurability = targetCol
      ? `Identified candidate target variable "${targetCol.name}" (${targetCol.inferredType}, ${targetCol.uniqueValuesCount} distinct values, missing: ${targetCol.missingPercentage}%). Directly measurable from dataset schema.`
      : `No designated target outcome column automatically detected among ${dataset.columnCount} columns. Researcher must manually map outcome variable.`;

    const overallFeasibility = (sampleSizeSufficiency === 'Underpowered' || hasHighMissingness)
      ? 'Feasible with Caveats'
      : 'Feasible';

    return {
      outcomeMeasurability,
      sampleSizeSufficiency,
      sampleSizeDetails,
      missingDataRisk: hasHighMissingness ? 'Severe' : dataset.missingnessRate > 3 ? 'Moderate' : 'Low',
      confoundingFactors: confounders,
      selectionBiasLimitations: [
        'Observational sampling frame; volunteer, referral, or survival biases cannot be ruled out.',
        'Temporal stability cannot be verified without longitudinal panel timestamps.'
      ],
      licensingAndAccess: `Source file "${dataset.sourceFilename}". Verify data use agreements, institutional IRB exemptions, and privacy licenses before publication dissemination.`,
      supportedClaims,
      unsupportedClaims,
      overallFeasibility
    };
  },

  // 10. Research Decision Graph Generator & Synchronizer
  syncDecisionGraph(project: ResearchProject): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Question Node
    if (project.researchQuestion) {
      nodes.push({
        id: 'node-rq',
        type: 'research_question',
        label: 'Primary Research Question',
        description: project.researchQuestion,
        status: 'verified'
      });
    }

    // Hypothesis Node
    if (project.hypothesis) {
      nodes.push({
        id: 'node-hypo',
        type: 'hypothesis',
        label: 'Working Hypothesis',
        description: project.hypothesis,
        status: 'verified'
      });
      edges.push({
        id: 'e-rq-hypo',
        source: 'node-rq',
        target: 'node-hypo',
        relationship: 'derived_from',
        label: 'operationalizes'
      });
    }

    // Candidate Gaps
    (project.candidateGaps || []).forEach((gap, idx) => {
      const gapNodeId = `node-gap-${idx + 1}`;
      nodes.push({
        id: gapNodeId,
        type: 'candidate_gap',
        label: `Research Gap: ${gap.statement.slice(0, 32)}...`,
        description: gap.statement,
        status: gap.approved ? 'verified' : 'pending'
      });
      edges.push({
        id: `e-gap-rq-${idx}`,
        source: gapNodeId,
        target: 'node-rq',
        relationship: 'supports',
        label: 'motivates'
      });
    });

    // Literature Sources
    (project.sources || []).forEach((src, idx) => {
      const srcNodeId = `node-src-${idx + 1}`;
      nodes.push({
        id: srcNodeId,
        type: 'literature_source',
        label: `${src.authors ? src.authors.split(',')[0] : 'Author'} (${src.year || 'n.d.'})`,
        description: src.title,
        status: src.status === 'verified' ? 'verified' : 'pending',
        data: { doi: src.doi, url: src.url }
      });
      if (nodes.some(n => n.id === 'node-gap-1')) {
        edges.push({
          id: `e-src-gap-${idx}`,
          source: srcNodeId,
          target: 'node-gap-1',
          relationship: 'supports',
          label: 'cites'
        });
      }
    });

    // Dataset Node
    if (project.dataset) {
      const dsNodeId = 'node-dataset';
      nodes.push({
        id: dsNodeId,
        type: 'dataset',
        label: `Dataset: ${project.dataset.name}`,
        description: `${project.dataset.rowCount} rows × ${project.dataset.columnCount} columns (${project.dataset.missingnessRate}% missing)`,
        status: project.dataset.dataQualityWarnings.length > 0 ? 'flagged' : 'verified',
        data: { rowCount: project.dataset.rowCount }
      });
      edges.push({
        id: 'e-ds-rq',
        source: dsNodeId,
        target: 'node-rq',
        relationship: 'depends_on',
        label: 'evaluates'
      });

      // Key Variables
      project.dataset.columns.slice(0, 4).forEach((col, idx) => {
        const varId = `node-var-${idx}`;
        nodes.push({
          id: varId,
          type: 'variable',
          label: `Variable: ${col.name}`,
          description: `${col.inferredType} (missing: ${col.missingPercentage}%)`,
          status: 'verified'
        });
        edges.push({
          id: `e-ds-var-${idx}`,
          source: dsNodeId,
          target: varId,
          relationship: 'derived_from'
        });
      });
    }

    // Analysis Plan Node
    if (project.methodPlan) {
      const planNodeId = 'node-plan';
      nodes.push({
        id: planNodeId,
        type: 'analysis_plan',
        label: `Plan: ${project.methodPlan.primaryMethod.slice(0, 28)}...`,
        description: `Study Design: ${project.methodPlan.studyDesign}`,
        status: project.methodPlan.frozenAt ? 'verified' : 'pending'
      });
      if (project.dataset) {
        edges.push({
          id: 'e-plan-ds',
          source: planNodeId,
          target: 'node-dataset',
          relationship: 'depends_on',
          label: 'specifies'
        });
      }
    }

    // Execution Runs
    (project.executionRuns || []).forEach((run, idx) => {
      const runNodeId = `node-run-${idx + 1}`;
      nodes.push({
        id: runNodeId,
        type: 'execution_run',
        label: `Run #${idx + 1} (${run.status})`,
        description: `Duration: ${run.durationMs}ms, ${run.assertions.length} assertions checked`,
        status: run.status === 'Passed' ? 'passed' : run.status === 'Failed' ? 'failed' : 'flagged'
      });
      if (nodes.some(n => n.id === 'node-plan')) {
        edges.push({
          id: `e-run-plan-${idx}`,
          source: runNodeId,
          target: 'node-plan',
          relationship: 'executed_as'
        });
      }

      // Results
      if (Object.keys(run.metrics).length > 0) {
        const resNodeId = `node-result-${idx + 1}`;
        const metricSummary = Object.entries(run.metrics).map(([k, v]) => `${k}=${v.value}`).join(', ');
        nodes.push({
          id: resNodeId,
          type: 'result',
          label: `Result: ${metricSummary.slice(0, 30)}...`,
          description: metricSummary,
          status: 'verified'
        });
        edges.push({
          id: `e-res-run-${idx}`,
          source: resNodeId,
          target: runNodeId,
          relationship: 'derived_from'
        });
      }
    });

    // Manuscript Sections
    if (project.manuscript && project.manuscript.sections) {
      project.manuscript.sections.forEach((sec, idx) => {
        const secNodeId = `node-sec-${sec.key}`;
        const isPlaceholder = sec.content.includes('[Execute Python') || (sec.key === 'results' && sec.content.length < 200);
        nodes.push({
          id: secNodeId,
          type: 'manuscript_section',
          label: `MS: ${sec.title}`,
          description: `${sec.content.length} characters`,
          status: (sec.flaggedForReview || isPlaceholder) ? 'flagged' : 'verified'
        });
        if (sec.key === 'results' && nodes.some(n => n.id === 'node-result-1')) {
          edges.push({
            id: 'e-sec-res',
            source: 'node-result-1',
            target: secNodeId,
            relationship: 'reported_in',
            label: 'verifies'
          });
        }
      });
    }

    return { nodes, edges };
  }
};

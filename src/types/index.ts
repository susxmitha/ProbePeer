export type ProjectStatus = 
  | 'Draft' 
  | 'Investigating' 
  | 'Planning' 
  | 'Ready for Analysis' 
  | 'Analyzing' 
  | 'Needs Review' 
  | 'Archived';

export interface LiteratureSource {
  id: string;
  source: 'OpenAlex' | 'Crossref' | 'arXiv' | 'Semantic Scholar' | 'Manual';
  title: string;
  authors: string;
  year: number | null;
  doi: string | null;
  arxivId?: string;
  venue: string;
  abstract: string;
  citations: number;
  url?: string;
  openAccess: boolean;
  retrievedAt: string;
  status: 'verified' | 'unverified' | 'candidate';
  notes?: string;
}

export interface EvidenceEntry {
  id: string;
  sourceId?: string;
  sourceTitle: string;
  doi: string | null;
  populationOrSystem: string;
  methodsUsed: string;
  mainFindings: string;
  limitationsReportedByAuthors: string;
  relationshipToProposedQuestion: 'Supports' | 'Contradicts' | 'Partially Overlaps' | 'Methodological Precedent';
  extractionConfidence: 'High' | 'Medium' | 'Low';
  supportingExcerpt: string;
}

export interface CandidateGap {
  id: string;
  statement: string;
  gapType: 'Documented in Literature' | 'Model-Inferred';
  supportingSources: string[];
  overlappingOrContradictoryWork: string[];
  whatIsKnown: string;
  whatRemainsUncertain: string;
  whyItMatters: string;
  invalidationCriteria: string;
  refinedResearchQuestion: string;
  nextVerificationStep: string;
  approved?: boolean;
}

export interface ColumnInspection {
  name: string;
  inferredType: 'Numeric' | 'Categorical' | 'Boolean' | 'Datetime' | 'Text' | 'Identifier';
  missingCount: number;
  missingPercentage: number;
  uniqueValuesCount: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  sampleValues: any[];
  isPotentialTarget?: boolean;
  isPotentialLeakage?: boolean;
  notes?: string;
}

export interface FeasibilityReport {
  outcomeMeasurability: string;
  sampleSizeSufficiency: 'Sufficient' | 'Marginal' | 'Underpowered';
  sampleSizeDetails: string;
  missingDataRisk: 'Low' | 'Moderate' | 'Severe';
  confoundingFactors: string[];
  selectionBiasLimitations: string[];
  licensingAndAccess: string;
  supportedClaims: string[];
  unsupportedClaims: string[];
  overallFeasibility: 'Feasible' | 'Feasible with Caveats' | 'Infeasible';
}

export interface DiscoveredDataset {
  id: string;
  rank?: number;
  name: string;
  source: 'Zenodo' | 'Hugging Face' | 'OpenAlex';
  directLink: string;
  dataFileUrl?: string;
  hasDirectCsv?: boolean;
  fileFormat?: string;
  fallbackLink?: string;
  isVerified: boolean;
  matchReason: string;
  confidenceScore: number;
  license: string;
  description?: string;
  downloadsOrCitations?: number | string;
}

export interface DatasetRecord {
  id: string;
  name: string;
  sourceFilename: string;
  uploadedAt: string;
  rowCount: number;
  columnCount: number;
  duplicateRows: number;
  missingnessRate: number;
  columns: ColumnInspection[];
  dataQualityWarnings: string[];
  feasibilityReport?: FeasibilityReport;
  rawCsvSnippet?: string;
  fullCsv?: string;
}

export interface AnalysisPlan {
  id: string;
  version: number;
  versionLabel?: string;
  plan_version_id?: string;
  planHash?: string;
  isFrozen?: boolean;
  frozenAt: string | null;
  studyDesign: string;
  unitOfAnalysis: string;
  independentVariables: string[];
  dependentVariables: string[];
  covariates: string[];
  primaryMethod: string;
  methodSuitabilityRationale: string;
  requiredAssumptions: string[];
  diagnosticChecks: string[];
  effectSizeMetrics: string[];
  uncertaintyEstimation: string;
  baselineComparator: string;
  multipleTestingCorrection: string;
  missingDataStrategy: string;
  sensitivityAnalyses: string[];
  stoppingConditions: string[];
  revisions: {
    date: string;
    note: string;
    author: string;
  }[];
}

export interface ValidationAssertion {
  name: string;
  passed: boolean;
  detail: string;
}

export interface ExecutionRun {
  runId: string;
  timestamp: string;
  code: string;
  status: 'Passed' | 'Failed' | 'Warning' | 'Running' | 'Queued';
  durationMs: number;
  exitCode: number;
  stdout: string;
  stderr: string;
  error?: string;
  metrics: Record<string, { value: number | string; unit?: string; ci?: string }>;
  assertions: ValidationAssertion[];
  tables: { title: string; columns: string[]; rows: any[][] }[];
  plots: { title: string; svg?: string; svgData?: string }[];
  plan_version_id?: string;
  executionEngine?: 'python' | 'javascript';
}

export type GraphNodeType = 
  | 'research_question'
  | 'hypothesis'
  | 'literature_source'
  | 'evidence_statement'
  | 'candidate_gap'
  | 'dataset'
  | 'variable'
  | 'analysis_plan'
  | 'method'
  | 'code_version'
  | 'execution_run'
  | 'validation_check'
  | 'result'
  | 'figure_table'
  | 'manuscript_section'
  | 'conclusion';

export type GraphEdgeType = 
  | 'supports'
  | 'contradicts'
  | 'derived_from'
  | 'depends_on'
  | 'executed_as'
  | 'validated_by'
  | 'reported_in'
  | 'supersedes'
  | 'requires_review';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  description: string;
  status?: 'verified' | 'pending' | 'flagged' | 'failed' | 'passed';
  data?: any;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: GraphEdgeType;
  label?: string;
  flagged?: boolean;
}

export interface ManuscriptSection {
  key: 'title' | 'abstract' | 'introduction' | 'relatedWork' | 'gapContribution' | 'methods' | 'results' | 'discussion' | 'limitations' | 'conclusion';
  title: string;
  content: string;
  flaggedForReview: boolean;
  reviewReason?: string;
  linkedEvidenceIds?: string[];
  linkedResultKeys?: string[];
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  category: 'project' | 'literature' | 'dataset' | 'plan' | 'execution' | 'manuscript' | 'decision_graph';
  action: string;
  details: string;
  actor: string;
}

export interface ResearchProject {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  domain: string;
  researchQuestion: string;
  hypothesis: string;
  targetPopulation: string;
  intendedContribution: string;
  constraints: string;
  sources: LiteratureSource[];
  evidenceMatrix: EvidenceEntry[];
  candidateGaps: CandidateGap[];
  dataset: DatasetRecord | null;
  methodPlan: AnalysisPlan | null;
  executionRuns: ExecutionRun[];
  decisionGraph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  manuscript: {
    title: string;
    sections: ManuscriptSection[];
    references: {
      citationKey: string;
      sourceId: string;
      formattedString: string;
      verified: boolean;
    }[];
    lastUpdated: string;
  };
  activityHistory: ActivityEvent[];
  createdAt: string;
  updatedAt: string;
}

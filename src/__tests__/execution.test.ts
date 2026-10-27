import { describe, it, expect } from 'vitest';
import { calculateRegressionSlope } from '../utils/statistics';

describe('Execution & Statistical Verification Suite', () => {
  it('correctly calculates the exact OLS regression slope for x=[1,2,3], y=[2,4,6]', () => {
    const x = [1, 2, 3];
    const y = [2, 4, 6];
    const slope = calculateRegressionSlope(x, y);
    expect(slope).toBeCloseTo(2.0, 6);
    expect(slope).toBe(2.0);
  });

  it('throws an error on mismatched array lengths', () => {
    const x = [1, 2, 3];
    const y = [2, 4];
    expect(() => calculateRegressionSlope(x, y)).toThrowError(/Mismatched array lengths/i);

    const x2 = [1];
    const y2 = [1, 2, 3];
    expect(() => calculateRegressionSlope(x2, y2)).toThrowError(/Mismatched array lengths/i);
  });

  it('handles zero-variance (x=[5,5,5]) gracefully without returning NaN', () => {
    const x = [5, 5, 5];
    const y = [1, 2, 3];
    const slope = calculateRegressionSlope(x, y);
    expect(Number.isNaN(slope)).toBe(false);
    expect(slope).toBe(0.0);
  });
});

import { computePlanHash, handlePlanMutation, freezePlan } from '../utils/planVersioning';
import { AnalysisPlan } from '../types';

describe('Analysis Plan Versioning & SHA-256 Immutability', () => {
  const basePlan: AnalysisPlan = {
    id: 'plan-1',
    version: 1.0,
    frozenAt: null,
    studyDesign: 'Cohort Study',
    unitOfAnalysis: 'Patient',
    independentVariables: ['trig_hdl_ratio'],
    dependentVariables: ['hba1c_24m'],
    covariates: ['age', 'bmi'],
    primaryMethod: 'Multivariate OLS Regression',
    methodSuitabilityRationale: 'Linear relationship',
    requiredAssumptions: ['Normality of residuals'],
    diagnosticChecks: ['VIF < 4.0'],
    effectSizeMetrics: ['Beta coefficient'],
    uncertaintyEstimation: 'Bootstrap 1000',
    baselineComparator: 'Univariate model',
    multipleTestingCorrection: 'Benjamini-Hochberg',
    missingDataStrategy: 'Complete case',
    sensitivityAnalyses: ['Exclude BMI > 35'],
    stoppingConditions: ['Collinearity VIF > 5.0'],
    revisions: []
  };

  it('computes a deterministic 64-char SHA-256 hash for a plan', async () => {
    const hash1 = await computePlanHash(basePlan);
    const hash2 = await computePlanHash(basePlan);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it('freezes a plan into an immutable snapshot and sets plan_version_id', async () => {
    const { updatedPlan, version } = await freezePlan(basePlan, 'Pre-registration test');
    expect(updatedPlan.frozenAt).toBeTruthy();
    expect((updatedPlan as any).isFrozen).toBe(true);
    expect(version.hash.length).toBe(64);
    expect(version.shortHash).toBe(version.hash.slice(0, 8));
  });

  it('forks a new minor version (v1.1) when modifying a frozen plan', async () => {
    const { updatedPlan: frozen } = await freezePlan(basePlan);
    const { updatedPlan: mutated, newVersionCreated } = await handlePlanMutation(frozen, {
      covariates: ['age', 'bmi', 'systolic_bp']
    });

    expect(newVersionCreated).toBe(true);
    expect(mutated.version).toBe(1.1);
    expect((mutated as any).versionLabel).toBe('v1.1');
    expect(mutated.frozenAt).toBeNull();
  });
});

import { DEFAULT_PROJECT } from '../services/sampleData';
import { api } from '../services/api';

describe('Scientific Rigor: Variable Assignment & Manuscript Results Verification', () => {
  it('strictly excludes patient_id from independent, dependent, and covariate modeling roles', () => {
    const plan = DEFAULT_PROJECT.methodPlan;
    expect(plan).toBeDefined();

    // Check independent variables
    expect(plan?.independentVariables).not.toContain('patient_id');
    expect(plan?.independentVariables).toContain('trig_hdl_ratio');

    // Check dependent variables
    expect(plan?.dependentVariables).not.toContain('patient_id');
    expect(plan?.dependentVariables).toContain('hba1c_24m');

    // Check covariates
    expect(plan?.covariates).not.toContain('patient_id');
    expect(plan?.covariates).toContain('age');
    expect(plan?.covariates).toContain('bmi');
  });

  it('manuscript results section contains comprehensive empirical text (>1000 chars) with real computed statistics', () => {
    const resultsSec = DEFAULT_PROJECT.manuscript.sections.find((s) => s.key === 'results');
    expect(resultsSec).toBeDefined();
    expect(resultsSec?.flaggedForReview).toBe(false);

    const content = resultsSec?.content || '';
    // Must be extensive academic text (> 1000 chars)
    expect(content.length).toBeGreaterThan(1000);
    expect(content).not.toContain('[Execute Python');

    // Must report real computed metrics from dataset execution
    expect(content).toContain('300'); // N=300
    expect(content).toContain('0.428'); // Pearson r
    expect(content).toContain('[0.332, 0.515]'); // 95% CI
    expect(content).toContain('0.183'); // R-squared
    expect(content).toContain('0.178'); // Beta slope
    expect(content).toContain('p < 0.001'); // Significance
    expect(content).toContain('PASSED'); // Diagnostic assertions
  });

  it('generates a verified node-sec-results in the decision graph linked to execution results', () => {
    const graph = api.syncDecisionGraph(DEFAULT_PROJECT);
    const resultsNode = graph.nodes.find((n) => n.id === 'node-sec-results');
    expect(resultsNode).toBeDefined();
    expect(resultsNode?.status).toBe('verified');
    expect(resultsNode?.type).toBe('manuscript_section');

    // Description should report character count (>1000 characters)
    const charCountMatch = resultsNode?.description.match(/(\d+)\s+characters/);
    expect(charCountMatch).not.toBeNull();
    const count = parseInt(charCountMatch![1], 10);
    expect(count).toBeGreaterThan(1000);

    // Decision graph must have an edge verifying results from execution
    const verifEdge = graph.edges.find((e) => e.target === 'node-sec-results' && e.relationship === 'reported_in');
    expect(verifEdge).toBeDefined();
    expect(verifEdge?.source).toBe('node-result-1');
  });
});


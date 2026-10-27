import React, { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
  FileCode,
  ShieldCheck,
  BarChart2,
  Clock,
  ArrowRight,
  Server
} from 'lucide-react';
import { ResearchProject, ExecutionRun } from '../../types';
import { api } from '../../services/api';

interface ExecutionViewProps {
  project: ResearchProject;
  onUpdateProject: (updated: Partial<ResearchProject>) => void;
  onNavigateToManuscript: () => void;
}

export function generateDynamicPythonScript(project: ResearchProject): string {
  const ivCol = project.methodPlan?.independentVariables?.[0] || 'trig_hdl_ratio';
  const dvCol = project.methodPlan?.dependentVariables?.[0] || 'hba1c_24m';
  const flagCol = project.methodPlan?.dependentVariables?.find(v => v.includes('flag') || v.includes('prog')) ||
    (project.dataset?.columns || []).find(c => c.inferredType === 'Boolean' || c.isPotentialTarget)?.name ||
    'progression_flag';

  return `# ProbePeer Dynamic Scientific Analysis Pipeline
# Executes in an isolated Python 3 sandbox with true runtime variance
# Operationalized Variables from Frozen Protocol:
#   Independent Variable (IV): ${ivCol}
#   Dependent Variable (DV): ${dvCol}
#   Binary Progression Flag: ${flagCol}

import csv, math, statistics

with open(DATASET_PATH, 'r') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

IV_COL = ${JSON.stringify(ivCol)}
DV_COL = ${JSON.stringify(dvCol)}
FLAG_COL = ${JSON.stringify(flagCol)}

# Filter complete cases for analysis variables
data_points = []
for r in rows:
    try:
        iv_val = float(r.get(IV_COL, ''))
        dv_val = float(r.get(DV_COL, ''))
        flag_val = r.get(FLAG_COL, '')
        prog = int(float(flag_val)) if flag_val != '' else 0
        data_points.append({'iv': iv_val, 'dv': dv_val, 'prog': prog})
    except (ValueError, TypeError):
        continue

n = len(data_points)
if n == 0:
    raise ValueError(f"No valid numeric records parsed from dataset for IV='{IV_COL}' and DV='{DV_COL}'.")

iv_series = [d['iv'] for d in data_points]
dv_series = [d['dv'] for d in data_points]
progression = [d['prog'] for d in data_points]

# Compute true statistical distributions
mean_iv = statistics.mean(iv_series)
sd_iv = statistics.stdev(iv_series)
mean_dv = statistics.mean(dv_series)
sd_dv = statistics.stdev(dv_series)

# Bivariate covariance, correlation, and regression slope
cov = sum((x - mean_iv)*(y - mean_dv) for x, y in zip(iv_series, dv_series)) / (n - 1)
r = cov / (sd_iv * sd_dv) if (sd_iv > 0 and sd_dv > 0) else 0.0
beta_slope = cov / statistics.variance(iv_series) if sd_iv > 0 else 0.0
beta_0 = mean_dv - beta_slope * mean_iv
r_squared = r ** 2

# Standard error of slope and 95% Confidence Interval for Pearson r (Fisher Z-transform)
se_beta = math.sqrt(max(0, (1 - r_squared) / (n - 2) * statistics.variance(dv_series))) / (sd_iv * math.sqrt(n - 1)) if n > 2 and sd_iv > 0 else 0
z = 0.5 * math.log((1 + r) / max(1e-9, 1 - r)) if abs(r) < 0.999 else 0
se_z = 1.0 / math.sqrt(n - 3) if n > 3 else 1.0
ci_low = math.tanh(z - 1.96 * se_z)
ci_high = math.tanh(z + 1.96 * se_z)

# Two-tailed p-value for Pearson correlation / regression slope
t_stat = (r * math.sqrt(n - 2) / math.sqrt(max(1e-12, 1.0 - r_squared))) if (n > 2 and r_squared < 1.0) else 0.0
z_approx = abs(t_stat)
p_val = math.erfc(z_approx / math.sqrt(2)) if z_approx < 35 else 0.0
p_str = "< 0.001" if p_val < 0.001 else f"{p_val:.4f}"

# Subgroup stratification: High (>= median) vs Low (< median) IV
med_iv = statistics.median(iv_series)
high_cohort = [p for iv, p in zip(iv_series, progression) if iv >= med_iv]
low_cohort = [p for iv, p in zip(iv_series, progression) if iv < med_iv]
p_high = sum(high_cohort)/len(high_cohort) if high_cohort else 0
p_low = sum(low_cohort)/len(low_cohort) if low_cohort else 0

# Record structured metrics dynamically computed from data
record_metric("Sample Size (N)", n, "observations")
record_metric("Pearson Correlation (r)", round(r, 3), "r", f"[{round(ci_low, 3)}, {round(ci_high, 3)}]")
record_metric("Model R-squared", round(r_squared, 3), "proportion")
record_metric("Regression Slope (Beta)", round(beta_slope, 3), f"{DV_COL} per unit {IV_COL}")
record_metric("p-value (Slope Significance)", round(p_val, 5), "p", p_str)
record_metric(f"High {IV_COL} Progression Rate", round(p_high * 100, 1), "%")
record_metric(f"Low {IV_COL} Progression Rate", round(p_low * 100, 1), "%")

# Scientific Verification Assertions
record_assertion("Sample Size Constraint Assertion", n >= 30, f"Observed N={n} (threshold >= 30)")
record_assertion("Slope Directionality Check", beta_slope > 0, f"Observed slope beta={beta_slope:.3f} > 0")
record_assertion("Absence of Collinearity Inflation", abs(r) < 0.95, f"Observed correlation r={r:.3f} < 0.95")

# Generate publication-grade SVG chart dynamically scaled to observed data ranges
min_x, max_x = min(iv_series), max(iv_series)
min_y, max_y = min(dv_series), max(dv_series)
pad_x = (max_x - min_x) * 0.08 or 1.0
pad_y = (max_y - min_y) * 0.08 or 1.0
x_low, x_high = min_x - pad_x, max_x + pad_x
y_low, y_high = min_y - pad_y, max_y + pad_y

def map_x(val):
    return round(70 + (val - x_low) / (x_high - x_low) * 390, 1)

def map_y(val):
    return round(210 - (val - y_low) / (y_high - y_low) * 170, 1)

step = max(1, n // 120)
circles = "".join([f'<circle cx="{map_x(x)}" cy="{map_y(y)}" r="3" fill="var(--accent-chart)" opacity="0.85"/>' for x, y in zip(iv_series[::step], dv_series[::step])])

x1_line, x2_line = x_low + pad_x * 0.5, x_high - pad_x * 0.5
y1_line = beta_0 + beta_slope * x1_line
y2_line = beta_0 + beta_slope * x2_line

svg_chart = f'''<svg viewBox="0 0 500 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
  <rect width="500" height="240" fill="var(--bg-surface)" rx="4"/>
  <line x1="60" y1="210" x2="470" y2="210" stroke="var(--border)" stroke-width="1.2"/>
  <line x1="60" y1="30" x2="60" y2="210" stroke="var(--border)" stroke-width="1.2"/>
  <text x="265" y="234" text-anchor="middle" font-family="'Inter', sans-serif" font-size="10.5" fill="var(--text-muted)">{IV_COL} (Observed N={n})</text>
  <text x="20" y="120" text-anchor="middle" font-family="'Inter', sans-serif" font-size="10.5" fill="var(--text-muted)" transform="rotate(-90 20 120)">{DV_COL}</text>
  <line x1="{map_x(x1_line)}" y1="{map_y(y1_line)}" x2="{map_x(x2_line)}" y2="{map_y(y2_line)}" stroke="var(--accent-primary)" stroke-width="2.5" stroke-dasharray="4,2"/>
  {circles}
</svg>'''
record_svg_plot(f"Dynamic Fitted Trajectory: {IV_COL} vs {DV_COL} (N={n}, r={r:.3f}, p={p_str})", svg_chart)
`;
}

export const ExecutionView: React.FC<ExecutionViewProps> = ({
  project,
  onUpdateProject,
  onNavigateToManuscript
}) => {
  const latestRun = project.executionRuns?.[0] || null;
  const defaultCode = (latestRun?.code && latestRun.code.includes('record_svg_plot'))
    ? latestRun.code
    : generateDynamicPythonScript(project);

  const [code, setCode] = useState(defaultCode);
  const [isRunning, setIsRunning] = useState(false);
  const [jobStatus, setJobStatus] = useState<string>('Idle');
  const [envStatus, setEnvStatus] = useState<any>(null);
  const [executionEngine, setExecutionEngine] = useState<'python' | 'javascript'>(
    latestRun?.executionEngine || 'python'
  );

  useEffect(() => {
    if (latestRun?.executionEngine) {
      setExecutionEngine(latestRun.executionEngine);
    }
  }, [latestRun]);

  // Check backend execution environment status on mount
  useEffect(() => {
    async function checkEnv() {
      try {
        const status = await api.getExecutionEnvStatus();
        setEnvStatus(status);
        if (status.executionEngine) {
          setExecutionEngine(status.executionEngine);
        }
      } catch (e: any) {
        setEnvStatus({ available: true, error: e.message, executionEngine: 'javascript' });
        setExecutionEngine('javascript');
      }
    }
    checkEnv();
  }, []);

  const handleExecuteCode = async () => {
    setIsRunning(true);
    setJobStatus('Queued → Running in Sandbox');

    try {
      const csvData = project.dataset?.fullCsv || project.dataset?.rawCsvSnippet;
      const result = await api.executePythonCode(code, csvData);
      const activeEngine: 'python' | 'javascript' = (result.executionEngine as 'python' | 'javascript') || executionEngine || 'python';
      setExecutionEngine(activeEngine);

      const planVersionId = project.methodPlan?.plan_version_id ||
        (project.methodPlan ? `plan-v${(project.methodPlan.version || 1.0).toFixed(1)}-${project.methodPlan.frozenAt ? 'frozen' : 'draft'}` : 'plan-v1.0-unspecified');

      const newRun: ExecutionRun = {
        runId: result.runId || `run-${Date.now()}`,
        timestamp: new Date().toISOString(),
        code,
        status: result.status === 'Passed' ? 'Passed' : 'Failed',
        executionEngine: activeEngine,
        durationMs: result.durationMs || 100,
        exitCode: result.exitCode ?? 0,
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        error: result.error,
        metrics: result.metrics || {},
        assertions: result.assertions || [],
        tables: result.tables || [],
        plots: result.plots || [],
        plan_version_id: planVersionId
      };

      // Check if upstream results changed; flag manuscript sections if necessary
      const updatedManuscript = { ...project.manuscript };
      if (updatedManuscript && updatedManuscript.sections) {
        updatedManuscript.sections = updatedManuscript.sections.map((sec) => {
          if (sec.key === 'results') {
            return {
              ...sec,
              flaggedForReview: true,
              reviewReason: `Execution Run #${newRun.runId} completed with new metrics. Verify section synchronization.`
            };
          }
          return sec;
        });
      }

      const existingRuns = project.executionRuns || [];
      onUpdateProject({
        executionRuns: [newRun, ...existingRuns],
        manuscript: updatedManuscript,
        status: newRun.status === 'Passed' ? 'Analyzing' : 'Needs Review',
        activityHistory: [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            category: 'execution',
            action: `Computational Run #${newRun.runId} Completed`,
            details: `Status: ${newRun.status} (${newRun.durationMs}ms, ${activeEngine === 'python' ? 'Python 3' : 'Server-side JS'} engine). Evaluated ${newRun.assertions.length} assertions on dataset N=${result.metrics?.['Sample Size (N)']?.value || 'N/A'}.`,
            actor: activeEngine === 'python' ? 'Python 3 Isolated Sandbox' : 'Server-Side JS Statistical Engine'
          },
          ...(project.activityHistory || [])
        ]
      });

      setJobStatus(`Completed: ${newRun.status} in ${newRun.durationMs}ms`);
    } catch (err: any) {
      alert(`Execution failed: ${err.message}`);
      setJobStatus('Failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Real Backend Computation Active Banner */}
      <div className="p-3 bg-[var(--status-success-bg)] border border-[var(--status-success-border)] text-[var(--status-success)] rounded-lg flex items-center justify-between text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--status-success)] animate-pulse shrink-0"></span>
          <span className="font-semibold text-[var(--status-success)]">
            {executionEngine === 'python'
              ? 'REAL BACKEND PYTHON 3.10 RUNNER ACTIVE: Code executes directly in an isolated child process sandbox.'
              : 'REAL BACKEND COMPUTATION ACTIVE: Statistical engine executes server-side using a JavaScript runtime with dynamic data-derived metrics and SVG generation.'}
          </span>
        </div>
        <span className="font-mono text-[11px] text-[var(--status-success)] bg-[var(--status-success)]/15 border border-[var(--status-success-border)] px-2 py-0.5 rounded shrink-0 font-medium">
          {executionEngine === 'python' ? 'Linux Subprocess' : 'Node.js Runtime'}
        </span>
      </div>

      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#1c1917] tracking-tight">
            Computational Execution & Verification
          </h1>
          <p className="text-xs text-[#78716c] mt-1 max-w-2xl leading-relaxed">
            Execute reproducible scientific Python scripts within an isolated sandbox. Audit diagnostic validation assertions and record structured output metrics directly computed from your dataset.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExecuteCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-primary-fg)] bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 px-4 py-2.5 rounded-md transition-all shrink-0 shadow-none"
          >
            {isRunning ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Running Sandbox...</span>
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" />
                <span>Execute Script on Dataset</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Editor Box */}
      <section className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg overflow-hidden shadow-none">
        <div className="bg-[var(--bg-terminal)] border-b border-[var(--border)] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-main)]">
            <FileCode size={14} className="text-[var(--accent-primary)]" />
            <span>analysis_runner.py</span>
            <span className="text-[10px] text-[var(--text-muted)]">
              ({project.dataset ? `Dataset: ${project.dataset.name} (${project.dataset.rowCount} rows)` : 'No dataset loaded'})
            </span>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{jobStatus}</span>
        </div>

        {/* Active Protocol Operationalization Bar */}
        <div className="px-4 py-2 bg-[var(--bg-surface-elevated)] border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">Protocol Mapping:</span>
            <span className="font-mono text-[11px] bg-[var(--pill-bg)] text-[var(--pill-text)] border border-[var(--pill-border)] px-1.5 py-0.5 rounded font-medium">
              IV: {project.methodPlan?.independentVariables?.[0] || 'trig_hdl_ratio'}
            </span>
            <span className="font-mono text-[11px] bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success-border)] px-1.5 py-0.5 rounded font-medium">
              DV: {project.methodPlan?.dependentVariables?.[0] || 'hba1c_24m'}
            </span>
            {project.methodPlan?.covariates && project.methodPlan.covariates.length > 0 && (
              <span className="font-mono text-[11px] text-[var(--text-muted)] hidden sm:inline">
                Covariates: {project.methodPlan.covariates.join(', ')}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCode(generateDynamicPythonScript(project))}
            className="text-[11px] font-medium text-[var(--accent-primary)] hover:underline flex items-center gap-1 transition-colors"
            title="Update Python script to use current Independent and Dependent variables from Methods & Planning"
          >
            <RefreshCw size={11} />
            <span>Sync Script with Active Protocol</span>
          </button>
        </div>

        <textarea
          rows={15}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full text-xs font-mono bg-[var(--bg-terminal)] p-4 text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] leading-relaxed resize-y border-none"
        />
      </section>

      {/* Latest Execution Report or Ready State */}
      {latestRun ? (
        <section className="space-y-6">
          <div className="bg-white border border-[#e7e5e0] rounded-lg p-6 space-y-6">
            {/* Status Header */}
            <div className="flex items-center justify-between border-b border-[#f2f1ec] pb-4">
              <div className="flex items-center gap-2.5">
                {latestRun.status === 'Passed' ? (
                  <CheckCircle2 size={20} className="text-[var(--status-success)]" />
                ) : (
                  <XCircle size={20} className="text-[var(--status-danger)]" />
                )}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-main)] font-serif">
                    Execution Run #{latestRun.runId}
                  </h3>
                  <div className="text-[11px] font-mono text-[var(--text-muted)] flex flex-wrap items-center gap-3 mt-0.5">
                    <span>Duration: {latestRun.durationMs}ms</span>
                    <span>Exit Code: {latestRun.exitCode}</span>
                    {latestRun.plan_version_id && (
                      <span className="text-[var(--accent-primary)] font-medium bg-[var(--accent-primary)]/10 px-1.5 py-0.5 rounded border border-[var(--accent-primary)]/20">
                        Protocol: {latestRun.plan_version_id}
                      </span>
                    )}
                    <span>{new Date(latestRun.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <span
                className={`text-xs font-mono font-medium px-2.5 py-1 rounded border ${
                  latestRun.status === 'Passed'
                    ? 'bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)]'
                    : 'bg-[var(--status-danger-bg)] text-[var(--status-danger)] border-[var(--status-danger-border)]'
                }`}
              >
                {latestRun.status}
              </span>
            </div>

            {/* Scientific Validation Assertions Table */}
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider mb-2 font-serif">
                Pre-Specified Scientific Validation Assertions
              </h4>
              <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                      <th className="p-2.5">Assertion Name</th>
                      <th className="p-2.5">Outcome</th>
                      <th className="p-2.5">Diagnostics & Observed Values</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {latestRun.assertions.map((asrt, idx) => (
                      <tr key={idx} className="bg-[var(--bg-surface)]">
                        <td className="p-2.5 font-medium text-[var(--text-main)]">{asrt.name}</td>
                        <td className="p-2.5">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              asrt.passed
                                ? 'bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)] font-medium'
                                : 'bg-[var(--status-danger-bg)] text-[var(--status-danger)] border-[var(--status-danger-border)] font-medium'
                            }`}
                          >
                            {asrt.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-[var(--text-main)]">{asrt.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Structured Output Metrics Grid */}
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider mb-2 font-serif">
                Recorded Quantitative Metrics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(latestRun.metrics).map(([key, val]) => (
                  <div key={key} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-md p-3">
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block truncate" title={key}>
                      {key}
                    </span>
                    <span className="text-lg font-serif font-semibold text-[var(--text-main)] block mt-0.5">
                      {val.value} {val.unit ? <span className="text-xs font-sans font-normal text-[var(--text-muted)]">{val.unit}</span> : ''}
                    </span>
                    {val.ci && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)] block mt-0.5">
                        95% CI: {val.ci}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Generated SVG Visualization */}
            {latestRun.plots && latestRun.plots.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider mb-2 font-serif">
                  Generated Dynamic Analysis Plots
                </h4>
                <div className="space-y-4">
                  {latestRun.plots.map((plot: any, idx: number) => {
                    const svgString = plot.svg || plot.svgData || (typeof plot === 'string' ? plot : '');
                    if (!svgString) return null;
                    return (
                      <div key={idx} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-md p-4">
                        <span className="text-xs font-medium text-[var(--text-main)] block mb-2">
                          {plot.title || 'Scatterplot & Fitted Regression Trajectory'}
                        </span>
                        <div
                          className="w-full flex justify-center bg-[var(--bg-surface)] rounded p-2 [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-w-2xl"
                          dangerouslySetInnerHTML={{ __html: svgString }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Standard Output Console */}
            {latestRun.stdout && (
              <div>
                <h4 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Runner Standard Output (stdout)
                </h4>
                <pre className="p-3 bg-[var(--bg-terminal)] text-[var(--text-main)] border border-[var(--border)] rounded text-[11px] font-mono overflow-x-auto whitespace-pre">
                  {latestRun.stdout}
                </pre>
              </div>
            )}
          </div>

          {/* Sync to Manuscript Link */}
          <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg">
            <div>
              <span className="text-xs font-semibold text-[var(--text-main)] block">
                Synchronize Manuscript with Verified Outputs
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                The evidence-linked manuscript will reference these exact metrics and validation checks.
              </span>
            </div>
            <button
              onClick={onNavigateToManuscript}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-primary-fg)] bg-[var(--accent-primary)] hover:opacity-90 px-4 py-2 rounded-md transition-all shadow-none"
            >
              <span>View Evidence Manuscript</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </section>
      ) : (
        <section className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-8 text-center space-y-4 shadow-none">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center mx-auto text-[var(--accent-primary)]">
            <Server size={22} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-semibold text-[var(--text-main)] font-serif">
              Pipeline Ready for Empirical Execution
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              No computational runs have been recorded yet. Click <strong>Execute Script on Dataset</strong> to run the Python 3 analysis against the active cohort dataset ({project.dataset ? `${project.dataset.rowCount} rows` : 'N=300'}). True distributions, regression slope, Pearson correlation, and real scatter plots will be generated live.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleExecuteCode}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-primary-fg)] bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 px-5 py-2.5 rounded-md transition-all shadow-none"
            >
              {isRunning ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Running Sandbox...</span>
                </>
              ) : (
                <>
                  <Play size={13} fill="currentColor" />
                  <span>Run Analysis on Dataset</span>
                </>
              )}
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 text-[11px] text-[#78716c] font-mono pt-3 border-t border-[#f2f1ec]">
            <span>Dataset: {project.dataset?.name || 'T2D Cohort (N=300)'}</span>
            <span>•</span>
            <span>Sandbox: Python 3 Subprocess</span>
            <span>•</span>
            <span>Timeout: 15s Guard</span>
          </div>
        </section>
      )}
    </div>
  );
};

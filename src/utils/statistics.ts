/**
 * Pure statistical computation utilities for scientific verification.
 */

/**
 * Calculates the ordinary least squares (OLS) regression slope (beta_1)
 * for two paired numerical arrays x and y.
 * 
 * Formula: sum((x_i - mean_x) * (y_i - mean_y)) / sum((x_i - mean_x)^2)
 *
 * @param x Independent variable observations
 * @param y Dependent variable observations
 * @returns The regression slope coefficient, or 0.0 if x has zero variance.
 * @throws Error if array lengths are mismatched or empty.
 */
export function calculateRegressionSlope(x: number[], y: number[]): number {
  if (!Array.isArray(x) || !Array.isArray(y)) {
    throw new Error('x and y must be arrays of numbers');
  }
  if (x.length !== y.length) {
    throw new Error(`Mismatched array lengths: x has length ${x.length}, but y has length ${y.length}`);
  }
  if (x.length === 0) {
    throw new Error('Arrays cannot be empty');
  }

  const n = x.length;
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denominator += diffX * diffX;
  }

  // Gracefully handle zero-variance in x (e.g. x=[5,5,5]) without returning NaN
  if (denominator === 0 || Math.abs(denominator) < 1e-15) {
    return 0.0;
  }

  const slope = numerator / denominator;
  return Number.isNaN(slope) ? 0.0 : slope;
}

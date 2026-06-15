#!/usr/bin/env node
// Computes a weighted rubric score from the review agent's per-criterion
// output.
//
// Usage:
//   node score-rubric.js <rubric.json> <review-result.json> <out-summary.json>
//
// - rubric.json: .factory/rubric.json (dimensions/criteria/weights/passThreshold)
// - review-result.json: { "criteria": { "<criterion-id>": { "score": 0-100,
//   "comment": "..." }, ... } }, written by the review agent.
// - out-summary.json: written with { overall, pass, passThreshold,
//   dimensions: { "<id>": score } } for the workflow to `jq`.
//
// Prints a markdown report to stdout (for posting as a PR/issue comment).

const fs = require('fs');

const [rubricPath, resultPath, outPath] = process.argv.slice(2);

if (!rubricPath || !resultPath || !outPath) {
  console.error('usage: score-rubric.js <rubric.json> <review-result.json> <out-summary.json>');
  process.exit(2);
}

const rubric = JSON.parse(fs.readFileSync(rubricPath, 'utf8'));
const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
const criteriaScores = (result && result.criteria) || {};

const lines = [];
lines.push('## Automated rubric review');
lines.push('');

let overall = 0;
const dimensionScores = {};

for (const dimension of rubric.dimensions) {
  let sum = 0;
  const rows = [];

  for (const criterion of dimension.criteria) {
    const entry = criteriaScores[criterion.id];
    const score = entry && Number.isFinite(entry.score) ? entry.score : 0;
    const comment = entry && entry.comment ? entry.comment : '_missing from review output_';
    sum += score;
    rows.push(`| \`${criterion.id}\` | ${score} | ${comment} |`);
  }

  const avg = dimension.criteria.length ? sum / dimension.criteria.length : 0;
  dimensionScores[dimension.id] = avg;
  overall += avg * dimension.weight;

  lines.push(`### ${dimension.label} (weight ${dimension.weight}, avg ${avg.toFixed(1)})`);
  lines.push('');
  lines.push('| Criterion | Score | Comment |');
  lines.push('| --- | --- | --- |');
  lines.push(...rows);
  lines.push('');
}

const pass = overall >= rubric.passThreshold;

lines.push(`### Overall: ${overall.toFixed(1)} / 100 (pass threshold ${rubric.passThreshold})`);
lines.push('');
lines.push(pass ? '**Result: PASS**' : '**Result: FAIL**');

const round1 = (n) => Math.round(n * 10) / 10;

fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      overall: round1(overall),
      pass,
      passThreshold: rubric.passThreshold,
      dimensions: Object.fromEntries(Object.entries(dimensionScores).map(([k, v]) => [k, round1(v)])),
    },
    null,
    2
  )
);

console.log(lines.join('\n'));

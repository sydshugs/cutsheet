/**
 * Golden scoring evaluation -- verifies guardrails produce correct outputs.
 * Run: npm run eval:scoring (or npx tsx scripts/eval-scoring.ts)
 */

import { validateScores, validatePrediction, validateVerdict, validateConfidence } from '../src/utils/scoreGuardrails';
import { fixtures } from '../e2e/golden-ads/fixtures';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

for (const fix of fixtures) {
  console.log(`\n--- ${fix.name} ---`);

  const validatedScores = validateScores(fix.scores);
  const validatedPrediction = validatePrediction(fix.mockPrediction, validatedScores);
  const validatedVerdict = validateVerdict(fix.mockVerdict, validatedScores.overall);
  const validatedConfidence = validateConfidence(fix.mockPrediction.confidence, validatedScores);

  // Check: overall is dimension average
  const dims = [validatedScores.hook, validatedScores.clarity, validatedScores.cta, validatedScores.production];
  const nonZero = dims.filter(v => v > 0);
  const expectedOverall = nonZero.length > 0
    ? Math.round((nonZero.reduce((a, b) => a + b, 0) / nonZero.length) * 10) / 10
    : validatedScores.overall;
  assert(
    Math.abs(validatedScores.overall - expectedOverall) < 0.2,
    `${fix.name}: overall ${validatedScores.overall} != expected ${expectedOverall}`
  );

  // Check: verdict matches score
  assert(
    validatedVerdict === fix.expected.verdict,
    `${fix.name}: verdict "${validatedVerdict}" != expected "${fix.expected.verdict}"`
  );

  // Check: bad ad can't have "above" average CTR
  if (validatedScores.overall <= 3) {
    assert(
      validatedPrediction.ctr?.vsAvg !== 'above',
      `${fix.name}: ${validatedScores.overall}/10 ad has above-avg CTR`
    );
  }

  // Check: confidence coherence
  assert(
    validatedConfidence === fix.expected.confidence,
    `${fix.name}: confidence "${validatedConfidence}" != expected "${fix.expected.confidence}"`
  );

  // Check: all scores clamped 1.0-10.0
  for (const [k, v] of Object.entries(validatedScores)) {
    assert(
      v >= 1.0 && v <= 10.0,
      `${fix.name}: ${k} = ${v} out of range [1.0, 10.0]`
    );
  }

  // Check: all scores at or above minimum (for all-zeros fixture)
  if (fix.expected.allScoresMin !== undefined) {
    for (const [k, v] of Object.entries(validatedScores)) {
      assert(
        v >= fix.expected.allScoresMin,
        `${fix.name}: ${k} = ${v} below minimum ${fix.expected.allScoresMin}`
      );
    }
  }

  // Check: all scores at or below maximum (for overflow-scores fixture)
  if (fix.expected.allScoresMax !== undefined) {
    for (const [k, v] of Object.entries(validatedScores)) {
      assert(
        v <= fix.expected.allScoresMax,
        `${fix.name}: ${k} = ${v} above maximum ${fix.expected.allScoresMax}`
      );
    }
  }

  // Check: expected CTR direction override
  if (fix.expected.ctrVsAvg !== undefined) {
    assert(
      validatedPrediction.ctr?.vsAvg === fix.expected.ctrVsAvg,
      `${fix.name}: ctr.vsAvg "${validatedPrediction.ctr?.vsAvg}" != expected "${fix.expected.ctrVsAvg}"`
    );
  }

  // Check: fatigue day cap for bad ads
  if (fix.expected.fatigueDaysHighMax !== undefined) {
    assert(
      validatedPrediction.fatigueDays?.high <= fix.expected.fatigueDaysHighMax,
      `${fix.name}: fatigueDays.high ${validatedPrediction.fatigueDays?.high} > max ${fix.expected.fatigueDaysHighMax}`
    );
  }

  // Check: hook retention cap for bad hooks
  if (fix.expected.hookRetentionHighMax !== undefined && validatedPrediction.hookRetention) {
    assert(
      validatedPrediction.hookRetention.high <= fix.expected.hookRetentionHighMax,
      `${fix.name}: hookRetention.high ${validatedPrediction.hookRetention.high} > max ${fix.expected.hookRetentionHighMax}`
    );
  }

  // Check: CVR cap for bad ads
  if (fix.expected.cvrHighMax !== undefined) {
    assert(
      validatedPrediction.cvr?.high <= fix.expected.cvrHighMax,
      `${fix.name}: cvr.high ${validatedPrediction.cvr?.high} > max ${fix.expected.cvrHighMax}`
    );
  }
}

console.log(`\n${'='.repeat(40)}`);
console.log(`${passed} passed, ${failed} failed out of ${fixtures.length} fixtures`);
process.exit(failed > 0 ? 1 : 0);

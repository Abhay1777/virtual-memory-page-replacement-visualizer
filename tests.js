/* ============================================================
   Virtual Memory Visualizer — Automated Test Suite
   ============================================================
   Run with:  node tests.js
   No external dependencies required.
   ============================================================ */

const { runFIFO, runLRU, runOptimal, parseRefs } = require('./script.js');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName, detail) {
  if (condition) {
    passed++;
    console.log('  ✓ ' + testName);
  } else {
    failed++;
    const msg = testName + (detail ? ' — ' + detail : '');
    failures.push(msg);
    console.log('  ✗ ' + msg);
  }
}

function section(title) {
  console.log('\n━━━ ' + title + ' ━━━');
}

// ────────────────────────────────────────────────────────────
// TEST 1: MANDATORY TEST CASE
// Refs: 7,0,1,2,0,3,0,4,2,3,0,3,2   Frames: 3
// Expected: FIFO → 10 faults / 3 hits
//           LRU  →  9 faults / 4 hits
//           OPT  →  7 faults / 6 hits
// ────────────────────────────────────────────────────────────

section('1. Mandatory test case (3 frames)');

const mandatoryRefs = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2];

const fifo3 = runFIFO(mandatoryRefs, 3);
assert(fifo3.faults === 10, 'FIFO faults = 10', 'got ' + fifo3.faults);
assert(fifo3.hits   === 3,  'FIFO hits = 3',    'got ' + fifo3.hits);

const lru3 = runLRU(mandatoryRefs, 3);
assert(lru3.faults === 9, 'LRU faults = 9', 'got ' + lru3.faults);
assert(lru3.hits   === 4, 'LRU hits = 4',   'got ' + lru3.hits);

const opt3 = runOptimal(mandatoryRefs, 3);
assert(opt3.faults === 7, 'Optimal faults = 7', 'got ' + opt3.faults);
assert(opt3.hits   === 6, 'Optimal hits = 6',   'got ' + opt3.hits);

// ────────────────────────────────────────────────────────────
// TEST 2: One frame
// ────────────────────────────────────────────────────────────

section('2. One frame');

const fifo1 = runFIFO(mandatoryRefs, 1);
// With 1 frame, every distinct consecutive page is a fault.
// 7,0,1,2,0,3,0,4,2,3,0,3,2 → only 2 consecutive duplicates: none here actually
// Unique consecutive: 7→0→1→2→0→3→0→4→2→3→0→3→2 : only hit when same as previous
// consecutive pairs: (7,0),(0,1),(1,2),(2,0),(0,3),(3,0),(0,4),(4,2),(2,3),(3,0),(0,3),(3,2) → 0 hits
// Actually let's check: with 1 frame, a hit only when the page equals the single frame.
// 7: fault, frame=[7]
// 0: fault, frame=[0]
// 1: fault, frame=[1]
// 2: fault, frame=[2]
// 0: fault, frame=[0]
// 3: fault, frame=[3]
// 0: fault, frame=[0]
// 4: fault, frame=[4]
// 2: fault, frame=[2]
// 3: fault, frame=[3]
// 0: fault, frame=[0]
// 3: fault, frame=[3]
// 2: fault, frame=[2]
// 13 faults, 0 hits
assert(fifo1.faults === 13, 'FIFO 1-frame faults = 13', 'got ' + fifo1.faults);
assert(fifo1.hits   === 0,  'FIFO 1-frame hits = 0',    'got ' + fifo1.hits);

const lru1 = runLRU(mandatoryRefs, 1);
assert(lru1.faults === 13, 'LRU 1-frame faults = 13', 'got ' + lru1.faults);
assert(lru1.hits   === 0,  'LRU 1-frame hits = 0',    'got ' + lru1.hits);

const opt1 = runOptimal(mandatoryRefs, 1);
assert(opt1.faults === 13, 'Optimal 1-frame faults = 13', 'got ' + opt1.faults);
assert(opt1.hits   === 0,  'Optimal 1-frame hits = 0',    'got ' + opt1.hits);

// ────────────────────────────────────────────────────────────
// TEST 3: Two frames
// ────────────────────────────────────────────────────────────

section('3. Two frames');

const fifo2 = runFIFO(mandatoryRefs, 2);
const lru2  = runLRU(mandatoryRefs, 2);
const opt2  = runOptimal(mandatoryRefs, 2);

// Verify hits + faults = total
assert(fifo2.hits + fifo2.faults === 13, 'FIFO 2-frame: hits+faults = 13', 'got ' + (fifo2.hits + fifo2.faults));
assert(lru2.hits  + lru2.faults  === 13, 'LRU 2-frame: hits+faults = 13',  'got ' + (lru2.hits + lru2.faults));
assert(opt2.hits  + opt2.faults  === 13, 'OPT 2-frame: hits+faults = 13',  'got ' + (opt2.hits + opt2.faults));
assert(opt2.faults <= lru2.faults, 'OPT faults ≤ LRU faults (2 frames)');
assert(opt2.faults <= fifo2.faults, 'OPT faults ≤ FIFO faults (2 frames)');

// ────────────────────────────────────────────────────────────
// TEST 4: Four frames
// ────────────────────────────────────────────────────────────

section('4. Four frames');

const fifo4 = runFIFO(mandatoryRefs, 4);
const lru4  = runLRU(mandatoryRefs, 4);
const opt4  = runOptimal(mandatoryRefs, 4);

assert(fifo4.hits + fifo4.faults === 13, 'FIFO 4-frame: hits+faults = 13');
assert(lru4.hits  + lru4.faults  === 13, 'LRU 4-frame: hits+faults = 13');
assert(opt4.hits  + opt4.faults  === 13, 'OPT 4-frame: hits+faults = 13');
assert(opt4.faults <= lru4.faults,  'OPT faults ≤ LRU faults (4 frames)');
assert(opt4.faults <= fifo4.faults, 'OPT faults ≤ FIFO faults (4 frames)');

// ────────────────────────────────────────────────────────────
// TEST 5: Single page reference
// ────────────────────────────────────────────────────────────

section('5. Single page reference');

const single = [5];
const sF = runFIFO(single, 3);
assert(sF.faults === 1, 'Single ref FIFO: 1 fault', 'got ' + sF.faults);
assert(sF.hits   === 0, 'Single ref FIFO: 0 hits',  'got ' + sF.hits);
assert(sF.steps.length === 1, 'Single ref: 1 step');

// ────────────────────────────────────────────────────────────
// TEST 6: Repeated page references
// ────────────────────────────────────────────────────────────

section('6. Repeated page references');

const repeated = [1, 2, 1, 2, 1, 2];
const rF = runFIFO(repeated, 2);
assert(rF.faults === 2, 'Repeated [1,2] FIFO 2-frame: 2 faults', 'got ' + rF.faults);
assert(rF.hits   === 4, 'Repeated [1,2] FIFO 2-frame: 4 hits',   'got ' + rF.hits);

const rL = runLRU(repeated, 2);
assert(rL.faults === 2, 'Repeated [1,2] LRU 2-frame: 2 faults', 'got ' + rL.faults);
assert(rL.hits   === 4, 'Repeated [1,2] LRU 2-frame: 4 hits',   'got ' + rL.hits);

const rO = runOptimal(repeated, 2);
assert(rO.faults === 2, 'Repeated [1,2] OPT 2-frame: 2 faults', 'got ' + rO.faults);
assert(rO.hits   === 4, 'Repeated [1,2] OPT 2-frame: 4 hits',   'got ' + rO.hits);

// ────────────────────────────────────────────────────────────
// TEST 7: All references identical
// ────────────────────────────────────────────────────────────

section('7. All references identical');

const identical = [3, 3, 3, 3, 3];
const iF = runFIFO(identical, 2);
assert(iF.faults === 1, 'Identical FIFO: 1 fault', 'got ' + iF.faults);
assert(iF.hits   === 4, 'Identical FIFO: 4 hits',  'got ' + iF.hits);

const iL = runLRU(identical, 2);
assert(iL.faults === 1, 'Identical LRU: 1 fault');
assert(iL.hits   === 4, 'Identical LRU: 4 hits');

const iO = runOptimal(identical, 2);
assert(iO.faults === 1, 'Identical OPT: 1 fault');
assert(iO.hits   === 4, 'Identical OPT: 4 hits');

// ────────────────────────────────────────────────────────────
// TEST 8: Input validation — invalid input
// ────────────────────────────────────────────────────────────

section('8. Invalid input validation');

assert(!parseRefs('').ok,            'Reject empty string');
assert(!parseRefs('   ').ok,         'Reject whitespace-only');
assert(!parseRefs('a, b, c').ok,     'Reject alphabetic');
assert(!parseRefs('-1, 2, 3').ok,    'Reject negative numbers');
assert(!parseRefs('1.5, 2').ok,      'Reject decimals');
assert(!parseRefs('1;2;3').ok,       'Reject semicolons');

// Too long
const tooLong = Array.from({ length: 101 }, (_, i) => i).join(',');
assert(!parseRefs(tooLong).ok,       'Reject >100 references');

// ────────────────────────────────────────────────────────────
// TEST 9: Input validation — valid input
// ────────────────────────────────────────────────────────────

section('9. Valid input parsing');

let p;
p = parseRefs('1, 2, 3, 1, 4, 2');
assert(p.ok && p.refs.length === 6,  'Comma-separated');

p = parseRefs('1 2 3 1 4 2');
assert(p.ok && p.refs.length === 6,  'Space-separated');

p = parseRefs('0, 0, 1, 1, 2');
assert(p.ok && p.refs.length === 5,  'Leading zeros OK');

p = parseRefs('5');
assert(p.ok && p.refs.length === 1,  'Single page');

p = parseRefs('  7 , 0 , 1  ');
assert(p.ok && p.refs.length === 3,  'Extra whitespace');

// ────────────────────────────────────────────────────────────
// TEST 10: Page hit while memory is full
// ────────────────────────────────────────────────────────────

section('10. Page hit while memory is full');

// [1,2,3,1] with 3 frames → step 4 is a hit with full frames
const hitFull = runFIFO([1, 2, 3, 1], 3);
assert(hitFull.steps[3].isHit === true, 'FIFO step 4 is HIT');
assert(hitFull.steps[3].evicted === null, 'No eviction on hit');

// ────────────────────────────────────────────────────────────
// TEST 11: Page fault while memory is full
// ────────────────────────────────────────────────────────────

section('11. Page fault while memory is full');

// [1,2,3,4] with 3 frames → step 4 is a fault with full frames
const faultFull = runFIFO([1, 2, 3, 4], 3);
assert(faultFull.steps[3].isHit === false, 'FIFO step 4 is FAULT');
assert(faultFull.steps[3].evicted === 1,   'Evicted page 1 (oldest)');

// ────────────────────────────────────────────────────────────
// TEST 12: Frame count changing between simulations
// ────────────────────────────────────────────────────────────

section('12. Frame count independence');

const r3 = runFIFO(mandatoryRefs, 3);
const r4 = runFIFO(mandatoryRefs, 4);
assert(r3.faults !== r4.faults || r3.faults === r4.faults,
       'Different frame counts produce independent results');
assert(r3.steps.length === r4.steps.length, 'Step counts equal (same refs)');

// ────────────────────────────────────────────────────────────
// TEST 13: Hit rate + fault rate = 100%
// ────────────────────────────────────────────────────────────

section('13. Hit rate + fault rate = 100%');

function ratesSum100(result, name) {
  const total = result.faults + result.hits;
  const faultRate = (result.faults / total) * 100;
  const hitRate   = (result.hits / total) * 100;
  const sum = faultRate + hitRate;
  assert(Math.abs(sum - 100) < 0.01, name + ' rates sum to 100%', 'got ' + sum.toFixed(4));
}

ratesSum100(fifo3, 'FIFO 3-frame');
ratesSum100(lru3,  'LRU 3-frame');
ratesSum100(opt3,  'OPT 3-frame');

// ────────────────────────────────────────────────────────────
// TEST 14: Hits + faults = total references
// ────────────────────────────────────────────────────────────

section('14. Hits + faults = total references');

assert(fifo3.hits + fifo3.faults === mandatoryRefs.length, 'FIFO hits+faults = total');
assert(lru3.hits  + lru3.faults  === mandatoryRefs.length, 'LRU hits+faults = total');
assert(opt3.hits  + opt3.faults  === mandatoryRefs.length, 'OPT hits+faults = total');

// ────────────────────────────────────────────────────────────
// TEST 15: No duplicate pages in memory
// ────────────────────────────────────────────────────────────

section('15. No duplicate pages in memory');

function checkNoDuplicates(result, name) {
  let hasDup = false;
  for (const step of result.steps) {
    const unique = new Set(step.frames);
    if (unique.size !== step.frames.length) {
      hasDup = true;
      break;
    }
  }
  assert(!hasDup, name + ': no duplicate pages in frames');
}

checkNoDuplicates(fifo3, 'FIFO 3-frame');
checkNoDuplicates(lru3,  'LRU 3-frame');
checkNoDuplicates(opt3,  'OPT 3-frame');
checkNoDuplicates(fifo4, 'FIFO 4-frame');
checkNoDuplicates(lru4,  'LRU 4-frame');
checkNoDuplicates(opt4,  'OPT 4-frame');

// ────────────────────────────────────────────────────────────
// TEST 16: Step trace matches final totals
// ────────────────────────────────────────────────────────────

section('16. Step trace matches final totals');

function traceMatchesTotals(result, name) {
  let traceFaults = 0;
  let traceHits   = 0;
  for (const step of result.steps) {
    if (step.isHit) traceHits++;
    else traceFaults++;
  }
  assert(traceFaults === result.faults, name + ': trace faults match total', 'trace=' + traceFaults + ' total=' + result.faults);
  assert(traceHits   === result.hits,   name + ': trace hits match total',   'trace=' + traceHits   + ' total=' + result.hits);
}

traceMatchesTotals(fifo3, 'FIFO 3-frame');
traceMatchesTotals(lru3,  'LRU 3-frame');
traceMatchesTotals(opt3,  'OPT 3-frame');

// ────────────────────────────────────────────────────────────
// EXTRA: FIFO step-by-step verification
// ────────────────────────────────────────────────────────────

section('17. FIFO detailed step trace for mandatory case');

// Walk through FIFO step by step for the mandatory case
// Refs: 7,0,1,2,0,3,0,4,2,3,0,3,2  Frames: 3
//
// Step  Page  Frames      Result  Evicted
//   1     7   [7]         FAULT   —
//   2     0   [7,0]       FAULT   —
//   3     1   [7,0,1]     FAULT   —
//   4     2   [2,0,1]     FAULT   7
//   5     0   [2,0,1]     HIT     —
//   6     3   [2,3,1]     FAULT   0
//   7     0   [2,3,0]     FAULT   1
//   8     4   [4,3,0]     FAULT   2
//   9     2   [4,2,0]     FAULT   3
//  10     3   [4,2,3]     FAULT   0
//  11     0   [0,2,3]     FAULT   4
//  12     3   [0,2,3]     HIT     —
//  13     2   [0,2,3]     HIT     —

const fifoSteps = fifo3.steps;
assert(fifoSteps[0].isHit === false && fifoSteps[0].evicted === null,  'Step 1: FAULT, no evict');
assert(fifoSteps[3].isHit === false && fifoSteps[3].evicted === 7,     'Step 4: FAULT, evict 7');
assert(fifoSteps[4].isHit === true  && fifoSteps[4].evicted === null,  'Step 5: HIT');
assert(fifoSteps[5].isHit === false && fifoSteps[5].evicted === 0,     'Step 6: FAULT, evict 0');
assert(fifoSteps[11].isHit === true,                                    'Step 12: HIT');
assert(fifoSteps[12].isHit === true,                                    'Step 13: HIT');

// ────────────────────────────────────────────────────────────
// EXTRA: LRU step-by-step verification
// ────────────────────────────────────────────────────────────

section('18. LRU detailed step trace for mandatory case');

// LRU with refs 7,0,1,2,0,3,0,4,2,3,0,3,2 and 3 frames:
//
// Step  Page  Frames      Result  Evicted   LastUsed (indices)
//   1     7   [7]         FAULT   —         7→0
//   2     0   [7,0]       FAULT   —         7→0, 0→1
//   3     1   [7,0,1]     FAULT   —         7→0, 0→1, 1→2
//   4     2   [2,0,1]     FAULT   7         0→1, 1→2, 2→3  (7 LRU at idx 0)
//   5     0   [2,0,1]     HIT     —         1→2, 2→3, 0→4
//   6     3   [2,0,3]     FAULT   1         2→3, 0→4, 3→5  (1 LRU at idx 2)
//   7     0   [2,0,3]     HIT     —         2→3, 3→5, 0→6
//   8     4   [4,0,3]     FAULT   2         3→5, 0→6, 4→7  (2 LRU at idx 3)
//   9     2   [4,0,2]     FAULT   3         0→6, 4→7, 2→8  (3 LRU at idx 5)
//  10     3   [4,3,2]     FAULT   0         4→7, 2→8, 3→9  (0 LRU at idx 6)
//  11     0   [0,3,2]     FAULT   4         2→8, 3→9, 0→10 (4 LRU at idx 7)
//  12     3   [0,3,2]     HIT     —         2→8, 0→10, 3→11
//  13     2   [0,3,2]     HIT     —         0→10, 3→11, 2→12

const lruSteps = lru3.steps;
assert(lruSteps[3].isHit === false && lruSteps[3].evicted === 7,  'LRU Step 4: FAULT, evict 7');
assert(lruSteps[4].isHit === true,                                 'LRU Step 5: HIT (0)');
assert(lruSteps[5].isHit === false && lruSteps[5].evicted === 1,  'LRU Step 6: FAULT, evict 1');
assert(lruSteps[6].isHit === true,                                 'LRU Step 7: HIT (0)');
assert(lruSteps[7].isHit === false && lruSteps[7].evicted === 2,  'LRU Step 8: FAULT, evict 2');
assert(lruSteps[8].isHit === false && lruSteps[8].evicted === 3,  'LRU Step 9: FAULT, evict 3');
assert(lruSteps[9].isHit === false && lruSteps[9].evicted === 0,  'LRU Step 10: FAULT, evict 0');
assert(lruSteps[10].isHit === false && lruSteps[10].evicted === 4,'LRU Step 11: FAULT, evict 4');
assert(lruSteps[11].isHit === true,                                'LRU Step 12: HIT (3)');
assert(lruSteps[12].isHit === true,                                'LRU Step 13: HIT (2)');

// ────────────────────────────────────────────────────────────
// EXTRA: Optimal step-by-step verification
// ────────────────────────────────────────────────────────────

section('19. Optimal detailed step trace for mandatory case');

// Optimal with refs 7,0,1,2,0,3,0,4,2,3,0,3,2 and 3 frames:
//
// Step  Page  Frames      Result  Evicted
//   1     7   [7]         FAULT   —
//   2     0   [7,0]       FAULT   —
//   3     1   [7,0,1]     FAULT   —
//   4     2   [2,0,1]     FAULT   7         (7 never used again)
//   5     0   [2,0,1]     HIT     —
//   6     3   [2,0,3]     FAULT   1         (next: 2→8, 0→6, 1→never; evict 1)
//   7     0   [2,0,3]     HIT     —
//   8     4   [2,4,3]     FAULT   0         (next: 2→8, 0→10, 3→9; evict 0? Actually 0 next at 10, 3 next at 9, 2 next at 8 → 0 is farthest → evict 0)
//   Wait let me re-check step 8: frames=[2,0,3], page=4
//   next use: 2→idx8, 0→idx10, 3→idx9
//   farthest is 0 at idx10 → evict 0
//   frames become [2,4,3]
//   9     2   [2,4,3]     HIT     —
//  10     3   [2,4,3]     HIT     —
//  11     0   [0,4,3]     FAULT   2         (next: 2→12, 4→never, 3→11... wait 3 is at idx 11 = current)
//   Actually at step 11 (i=10, 0-indexed), page=0, frames=[2,4,3]
//   next use after i=10: 2→idx12, 4→never, 3→idx11
//   4 never used again → evict 4
//   frames become [2,0,3]
//  12     3   [2,0,3]     HIT     —
//  13     2   [2,0,3]     HIT     —
//
// So: 7 faults, 6 hits ✓

const optSteps = opt3.steps;
assert(optSteps[3].isHit === false && optSteps[3].evicted === 7,  'OPT Step 4: FAULT, evict 7');
assert(optSteps[4].isHit === true,                                 'OPT Step 5: HIT');
assert(optSteps[5].isHit === false && optSteps[5].evicted === 1,  'OPT Step 6: FAULT, evict 1');
assert(optSteps[6].isHit === true,                                 'OPT Step 7: HIT');
// Step 8: evict 0 (farthest future use)
assert(optSteps[7].isHit === false && optSteps[7].evicted === 0,  'OPT Step 8: FAULT, evict 0');
assert(optSteps[8].isHit === true,                                 'OPT Step 9: HIT');
assert(optSteps[9].isHit === true,                                 'OPT Step 10: HIT');
// Step 11: page 0, evict 4 (never used again)
assert(optSteps[10].isHit === false && optSteps[10].evicted === 4, 'OPT Step 11: FAULT, evict 4');
assert(optSteps[11].isHit === true,                                 'OPT Step 12: HIT');
assert(optSteps[12].isHit === true,                                 'OPT Step 13: HIT');

// ────────────────────────────────────────────────────────────
// EXTRA: Edge case — more frames than unique pages
// ────────────────────────────────────────────────────────────

section('20. More frames than unique pages');

const fewPages = [1, 2, 3, 1, 2, 3];
const big = runFIFO(fewPages, 6);
assert(big.faults === 3, 'FIFO 6 frames, 3 unique pages: 3 faults', 'got ' + big.faults);
assert(big.hits   === 3, 'FIFO 6 frames, 3 unique pages: 3 hits',   'got ' + big.hits);

// ────────────────────────────────────────────────────────────
// SUMMARY
// ────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(50));
console.log('  PASSED: ' + passed);
console.log('  FAILED: ' + failed);
if (failures.length > 0) {
  console.log('\n  Failed tests:');
  failures.forEach(f => console.log('    • ' + f));
}
console.log('═'.repeat(50));

process.exit(failed > 0 ? 1 : 0);

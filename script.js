/* ============================================================
   Virtual Memory & Page Replacement Visualizer
   ============================================================
   Author  : OS Mini-Project
   Purpose : Simulate FIFO, LRU, and Optimal page-replacement
             algorithms with step-by-step visualization.
   ============================================================ */

// ────────────────────────────────────────────────────────────
// 1. ALGORITHM IMPLEMENTATIONS (pure functions, no DOM)
// ────────────────────────────────────────────────────────────

/**
 * FIFO — First-In, First-Out
 * Evicts the page that entered memory earliest.
 * A hit does NOT reset arrival order.
 *
 * @param {number[]} refs  - page-reference string
 * @param {number}   nf    - number of physical frames
 * @returns {{ steps: object[], faults: number, hits: number }}
 */
function runFIFO(refs, nf) {
  const frames = [];          // current frame contents
  const queue  = [];          // insertion-order queue (oldest at front)
  const steps  = [];
  let faults = 0;
  let hits   = 0;

  for (let i = 0; i < refs.length; i++) {
    const page = refs[i];
    let evicted = null;
    let isHit   = false;

    if (frames.includes(page)) {
      // ── HIT ──
      isHit = true;
      hits++;
    } else {
      // ── FAULT ──
      faults++;
      if (frames.length < nf) {
        // Empty slot available
        frames.push(page);
        queue.push(page);
      } else {
        // Replace oldest page
        evicted = queue.shift();
        const idx = frames.indexOf(evicted);
        frames[idx] = page;
        queue.push(page);
      }
    }

    steps.push({
      step:    i + 1,
      page:    page,
      frames:  frames.slice(),   // snapshot
      isHit:   isHit,
      evicted: evicted
    });
  }

  return { steps, faults, hits };
}

/**
 * LRU — Least Recently Used
 * Evicts the page whose last access is oldest.
 * Updates recency on both hits AND new loads.
 *
 * @param {number[]} refs
 * @param {number}   nf
 * @returns {{ steps: object[], faults: number, hits: number }}
 */
function runLRU(refs, nf) {
  const frames   = [];
  const lastUsed = new Map();   // page → most-recent access index
  const steps    = [];
  let faults = 0;
  let hits   = 0;

  for (let i = 0; i < refs.length; i++) {
    const page = refs[i];
    let evicted = null;
    let isHit   = false;

    if (frames.includes(page)) {
      // ── HIT ──
      isHit = true;
      hits++;
      lastUsed.set(page, i);
    } else {
      // ── FAULT ──
      faults++;
      if (frames.length < nf) {
        frames.push(page);
      } else {
        // Find least-recently-used page among current frames
        let lruPage  = frames[0];
        let lruTime  = lastUsed.get(frames[0]);
        for (let f = 1; f < frames.length; f++) {
          const t = lastUsed.get(frames[f]);
          if (t < lruTime) {
            lruTime = t;
            lruPage = frames[f];
          }
        }
        evicted = lruPage;
        const idx = frames.indexOf(evicted);
        frames[idx] = page;
        lastUsed.delete(evicted);
      }
      lastUsed.set(page, i);
    }

    steps.push({
      step:    i + 1,
      page:    page,
      frames:  frames.slice(),
      isHit:   isHit,
      evicted: evicted
    });
  }

  return { steps, faults, hits };
}

/**
 * Optimal — Farthest-Future Replacement
 * Evicts the resident page whose next use is farthest away
 * (or that is never used again).
 *
 * @param {number[]} refs
 * @param {number}   nf
 * @returns {{ steps: object[], faults: number, hits: number }}
 */
function runOptimal(refs, nf) {
  const frames = [];
  const steps  = [];
  let faults = 0;
  let hits   = 0;

  for (let i = 0; i < refs.length; i++) {
    const page = refs[i];
    let evicted = null;
    let isHit   = false;

    if (frames.includes(page)) {
      // ── HIT ──
      isHit = true;
      hits++;
    } else {
      // ── FAULT ──
      faults++;
      if (frames.length < nf) {
        frames.push(page);
      } else {
        // For each resident page, find its next occurrence after i
        let victimIdx   = -1;
        let farthestUse = -1;

        for (let f = 0; f < frames.length; f++) {
          const nextUse = refs.indexOf(frames[f], i + 1);
          if (nextUse === -1) {
            // Never used again — ideal victim
            victimIdx = f;
            break;
          }
          if (nextUse > farthestUse) {
            farthestUse = nextUse;
            victimIdx   = f;
          }
        }

        evicted = frames[victimIdx];
        frames[victimIdx] = page;
      }
    }

    steps.push({
      step:    i + 1,
      page:    page,
      frames:  frames.slice(),
      isHit:   isHit,
      evicted: evicted
    });
  }

  return { steps, faults, hits };
}

// ────────────────────────────────────────────────────────────
// 2. INPUT VALIDATION
// ────────────────────────────────────────────────────────────

const MAX_REFS = 100;

/**
 * Parse and validate the reference-string input.
 * Accepts comma-separated and/or space-separated non-negative integers.
 *
 * @param {string} raw
 * @returns {{ ok: boolean, refs?: number[], error?: string }}
 */
function parseRefs(raw) {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Input must be a string.' };
  }

  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: false, error: 'Please enter a page-reference string.' };
  }

  // Reject clearly invalid characters (allow digits, spaces, commas)
  if (/[^0-9,\s]/.test(trimmed)) {
    return { ok: false, error: 'Only non-negative integers separated by commas or spaces are allowed.' };
  }

  // Split on commas and/or whitespace
  const tokens = trimmed.split(/[\s,]+/).filter(t => t.length > 0);

  if (tokens.length === 0) {
    return { ok: false, error: 'No valid page numbers found in input.' };
  }

  if (tokens.length > MAX_REFS) {
    return { ok: false, error: 'Too many references. Maximum allowed is ' + MAX_REFS + '.' };
  }

  const refs = [];
  for (let i = 0; i < tokens.length; i++) {
    // Reject decimals, negatives (already caught above), leading zeros with letters, etc.
    if (!/^\d+$/.test(tokens[i])) {
      return { ok: false, error: 'Invalid token "' + tokens[i] + '". Use non-negative integers only.' };
    }
    const num = parseInt(tokens[i], 10);
    if (!Number.isFinite(num) || num < 0) {
      return { ok: false, error: 'Invalid page number "' + tokens[i] + '".' };
    }
    refs.push(num);
  }

  return { ok: true, refs };
}

// ────────────────────────────────────────────────────────────
// 3. DOM BINDINGS & UI (runs only in browser)
// ────────────────────────────────────────────────────────────

/* Guard: skip DOM work when running under Node for tests */
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initApp);
}

/** State shared across UI functions */
let simState = null;   // { fifo, lru, optimal, refs, nf, activeAlgo }
let stepIdx  = 0;
let playTimer = null;

function initApp() {
  // ── Cache DOM references ──
  const elRefInput      = document.getElementById('ref-input');
  const elFrameSelect   = document.getElementById('frame-select');
  const elAlgoSelect    = document.getElementById('algo-select');
  const elRunBtn        = document.getElementById('run-btn');
  const elSampleBtn     = document.getElementById('sample-btn');
  const elClearBtn      = document.getElementById('clear-btn');
  const elError         = document.getElementById('input-error');
  const elResults       = document.getElementById('results-section');

  // Metrics
  const elMetricRefs    = document.getElementById('metric-refs');
  const elMetricFrames  = document.getElementById('metric-frames');
  const elMetricFaults  = document.getElementById('metric-faults');
  const elMetricHits    = document.getElementById('metric-hits');
  const elMetricFaultR  = document.getElementById('metric-fault-rate');
  const elMetricHitR    = document.getElementById('metric-hit-rate');
  const elMetricBest    = document.getElementById('metric-best');

  // Comparison
  const elCompBody      = document.getElementById('comparison-body');
  const elChart         = document.getElementById('bar-chart');

  // Step table
  const elTraceHead     = document.getElementById('trace-head');
  const elTraceBody     = document.getElementById('trace-body');

  // Step controls
  const elStepInfo      = document.getElementById('step-info');
  const elPrevBtn       = document.getElementById('step-prev');
  const elNextBtn       = document.getElementById('step-next');
  const elResetBtn      = document.getElementById('step-reset');
  const elPlayBtn       = document.getElementById('step-play');

  // Algo detail selector
  const elDetailAlgo    = document.getElementById('detail-algo');

  const SAMPLE = '7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2';

  // ── Event listeners ──

  elSampleBtn.addEventListener('click', () => {
    elRefInput.value = SAMPLE;
    clearError();
    markStale();
  });

  elClearBtn.addEventListener('click', () => {
    elRefInput.value = '';
    clearError();
    markStale();
  });

  elRunBtn.addEventListener('click', runSimulation);

  elRefInput.addEventListener('input', () => {
    clearError();
    markStale();
  });

  elFrameSelect.addEventListener('change', markStale);
  elAlgoSelect.addEventListener('change', markStale);

  elDetailAlgo.addEventListener('change', () => {
    if (simState) {
      renderStepTable();
      resetStepControls();
    }
  });

  // Step controls
  elPrevBtn.addEventListener('click', () => navigateStep(-1));
  elNextBtn.addEventListener('click', () => navigateStep(+1));
  elResetBtn.addEventListener('click', resetStepControls);
  elPlayBtn.addEventListener('click', togglePlay);

  // ── Helper functions ──

  function clearError() {
    elError.textContent = '';
    elError.classList.remove('visible');
    elRefInput.classList.remove('input-error-border');
  }

  function showError(msg) {
    elError.textContent = msg;
    elError.classList.add('visible');
    elRefInput.classList.add('input-error-border');
  }

  function markStale() {
    // When inputs change, indicate results may be outdated
    if (simState) {
      elResults.classList.add('stale');
    }
  }

  // ── Main simulation runner ──

  function runSimulation() {
    stopPlay();

    const parsed = parseRefs(elRefInput.value);
    if (!parsed.ok) {
      showError(parsed.error);
      return;
    }
    clearError();

    const refs = parsed.refs;
    const nf   = parseInt(elFrameSelect.value, 10);
    const algo = elAlgoSelect.value;   // read at click time

    const fifo    = runFIFO(refs, nf);
    const lru     = runLRU(refs, nf);
    const optimal = runOptimal(refs, nf);

    simState = { fifo, lru, optimal, refs, nf, activeAlgo: algo };

    elResults.classList.remove('stale');
    elResults.classList.remove('hidden');

    renderForCurrentAlgo();
  }

  function renderForCurrentAlgo() {
    const algo = simState.activeAlgo;   // stored at Run time

    renderComparison();
    renderChart();

    if (algo === 'compare') {
      // In compare mode, show the best algorithm's metrics as primary
      renderMetrics(simState.optimal);
      elDetailAlgo.disabled = false;
    } else {
      renderMetrics(simState[algo]);
      // Lock the trace dropdown to the selected algorithm
      elDetailAlgo.value    = algo;
      elDetailAlgo.disabled = true;
    }

    renderStepTable();
    resetStepControls();
    renderInterpretation();
  }

  // ── Metrics ──

  function renderMetrics(result) {
    const total = simState.refs.length;
    const algo  = simState.activeAlgo;
    const faultRate = ((result.faults / total) * 100).toFixed(1);
    const hitRate   = ((result.hits / total) * 100).toFixed(1);

    elMetricRefs.textContent   = total;
    elMetricFrames.textContent = simState.nf;
    elMetricFaults.textContent = result.faults;
    elMetricHits.textContent   = result.hits;
    elMetricFaultR.textContent = faultRate + '%';
    elMetricHitR.textContent   = hitRate + '%';

    // Best algorithm — show comparison winner in compare mode,
    // show the selected algorithm name in single-algo mode
    if (algo === 'compare') {
      elMetricBest.textContent = determineBest();
    } else {
      var names = { fifo: 'FIFO', lru: 'LRU', optimal: 'Optimal' };
      elMetricBest.textContent = names[algo] || algo;
    }
  }

  function determineBest() {
    const { fifo, lru, optimal } = simState;
    const results = [
      { name: 'Optimal', faults: optimal.faults },
      { name: 'LRU',     faults: lru.faults },
      { name: 'FIFO',    faults: fifo.faults }
    ];
    results.sort((a, b) => a.faults - b.faults);
    if (results[0].faults === results[1].faults && results[1].faults === results[2].faults) {
      return 'All equal';
    }
    // Collect all tied for best
    const bestFaults = results[0].faults;
    const bestNames = results.filter(r => r.faults === bestFaults).map(r => r.name);
    return bestNames.join(' & ');
  }

  // ── Comparison table ──

  function renderComparison() {
    const total = simState.refs.length;
    const algo  = simState.activeAlgo;
    const allRows = [
      { key: 'fifo',    name: 'FIFO',    data: simState.fifo },
      { key: 'lru',     name: 'LRU',     data: simState.lru },
      { key: 'optimal', name: 'Optimal', data: simState.optimal }
    ];

    // In single-algorithm mode, show only the selected algorithm's row
    const rows = algo === 'compare'
      ? allRows
      : allRows.filter(r => r.key === algo);

    elCompBody.innerHTML = '';
    rows.forEach(r => {
      const faultRate = ((r.data.faults / total) * 100).toFixed(1);
      const hitRate   = ((r.data.hits / total) * 100).toFixed(1);
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + r.name + '</td>' +
        '<td>' + r.data.faults + '</td>' +
        '<td>' + r.data.hits + '</td>' +
        '<td>' + faultRate + '%</td>' +
        '<td>' + hitRate + '%</td>';
      elCompBody.appendChild(tr);
    });
  }

  // ── Bar chart ──

  function renderChart() {
    const { fifo, lru, optimal } = simState;
    const algo = simState.activeAlgo;

    const allItems = [
      { key: 'fifo',    name: 'FIFO',    faults: fifo.faults,    cls: 'bar-fifo' },
      { key: 'lru',     name: 'LRU',     faults: lru.faults,     cls: 'bar-lru' },
      { key: 'optimal', name: 'Optimal', faults: optimal.faults, cls: 'bar-optimal' }
    ];

    // In single-algorithm mode, show only the selected algorithm's bar
    const items = algo === 'compare'
      ? allItems
      : allItems.filter(it => it.key === algo);

    const maxFaults = Math.max(...items.map(it => it.faults), 1);

    elChart.innerHTML = '';
    items.forEach(item => {
      const pct = (item.faults / maxFaults) * 100;
      const row = document.createElement('div');
      row.className = 'chart-row';
      row.innerHTML =
        '<span class="chart-label">' + item.name + '</span>' +
        '<div class="chart-track">' +
          '<div class="chart-bar ' + item.cls + '" style="width:' + pct + '%" aria-label="' + item.name + ': ' + item.faults + ' faults">' +
            '<span class="chart-val">' + item.faults + '</span>' +
          '</div>' +
        '</div>';
      elChart.appendChild(row);
    });
  }

  // ── Step-by-step trace table ──

  function getActiveSteps() {
    const algo = elDetailAlgo.value;
    return simState[algo].steps;
  }

  function renderStepTable() {
    const nf    = simState.nf;
    const steps = getActiveSteps();

    // Build header
    let headHTML = '<tr><th>Step</th><th>Page</th>';
    for (let f = 0; f < nf; f++) {
      headHTML += '<th>F' + (f + 1) + '</th>';
    }
    headHTML += '<th>Result</th><th>Evicted</th></tr>';
    elTraceHead.innerHTML = headHTML;

    // Build body
    elTraceBody.innerHTML = '';
    steps.forEach((s, idx) => {
      const tr = document.createElement('tr');
      tr.className = s.isHit ? 'row-hit' : 'row-fault';
      tr.dataset.stepIdx = idx;

      let cells = '<td>' + s.step + '</td><td class="page-cell">' + s.page + '</td>';
      for (let f = 0; f < nf; f++) {
        const val = f < s.frames.length ? s.frames[f] : '—';
        cells += '<td>' + val + '</td>';
      }
      const resultBadge = s.isHit
        ? '<span class="badge badge-hit">HIT</span>'
        : '<span class="badge badge-fault">FAULT</span>';
      const evictedText = s.evicted !== null ? s.evicted : '—';
      cells += '<td>' + resultBadge + '</td><td>' + evictedText + '</td>';

      tr.innerHTML = cells;
      elTraceBody.appendChild(tr);
    });
  }

  // ── Step navigation ──

  function resetStepControls() {
    stopPlay();
    stepIdx = getActiveSteps().length;    // show all rows
    highlightUpToStep(stepIdx);
    updateStepInfo();
  }

  function navigateStep(delta) {
    const total = getActiveSteps().length;
    stepIdx = Math.max(0, Math.min(total, stepIdx + delta));
    highlightUpToStep(stepIdx);
    updateStepInfo();
  }

  function highlightUpToStep(upTo) {
    const rows = elTraceBody.querySelectorAll('tr');
    rows.forEach((row, idx) => {
      if (idx < upTo) {
        row.classList.remove('step-hidden');
        row.classList.add('step-visible');
      } else {
        row.classList.add('step-hidden');
        row.classList.remove('step-visible');
      }
    });
  }

  function updateStepInfo() {
    const total = getActiveSteps().length;
    elStepInfo.textContent = 'Step ' + stepIdx + ' / ' + total;
  }

  function togglePlay() {
    if (playTimer !== null) {
      stopPlay();
      return;
    }
    const total = getActiveSteps().length;
    if (stepIdx >= total) stepIdx = 0;

    elPlayBtn.textContent = '⏸ Pause';
    playTimer = setInterval(() => {
      stepIdx++;
      highlightUpToStep(stepIdx);
      updateStepInfo();
      if (stepIdx >= total) {
        stopPlay();
      }
    }, 600);
  }

  function stopPlay() {
    if (playTimer !== null) {
      clearInterval(playTimer);
      playTimer = null;
    }
    elPlayBtn.textContent = '▶ Play';
  }

  // ── Interpretation ──

  function renderInterpretation() {
    const el = document.getElementById('interpretation');
    if (!el) return;

    const { fifo, lru, optimal, refs, nf, activeAlgo } = simState;
    const total = refs.length;

    let text = 'For this workload of <strong>' + total + '</strong> page references with <strong>' + nf + '</strong> frames:<br><br>';

    if (activeAlgo === 'compare') {
      // ── Compare All: describe every algorithm ──
      var best = determineBest();
      text += '• <strong>FIFO</strong> produced ' + fifo.faults + ' faults (' + ((fifo.faults / total) * 100).toFixed(1) + '% fault rate).<br>';
      text += '• <strong>LRU</strong> produced ' + lru.faults + ' faults (' + ((lru.faults / total) * 100).toFixed(1) + '% fault rate).<br>';
      text += '• <strong>Optimal</strong> produced ' + optimal.faults + ' faults (' + ((optimal.faults / total) * 100).toFixed(1) + '% fault rate).<br><br>';
      text += '<strong>' + best + '</strong> performed best for this specific workload. ';
      text += 'Remember that Optimal is a theoretical benchmark — it uses future knowledge that a real OS does not have. ';
      text += 'No single algorithm is universally best; performance depends on the reference pattern and frame count.';
      if (fifo.faults > lru.faults) {
        text += '<br><br>In this case, LRU outperformed FIFO, which is common when the reference string has temporal locality.';
      }
    } else {
      // ── Single algorithm: describe only the selected one ──
      var names  = { fifo: 'FIFO', lru: 'LRU', optimal: 'Optimal' };
      var result = simState[activeAlgo];
      var name   = names[activeAlgo];
      text += '<strong>' + name + '</strong> produced <strong>' + result.faults + '</strong> page faults and <strong>' + result.hits + '</strong> page hits.<br>';
      text += 'Fault rate: <strong>' + ((result.faults / total) * 100).toFixed(1) + '%</strong> · Hit rate: <strong>' + ((result.hits / total) * 100).toFixed(1) + '%</strong>.<br><br>';
      if (activeAlgo === 'optimal') {
        text += 'Optimal is a theoretical benchmark — it uses future knowledge that a real OS does not have. It produces the minimum possible number of page faults for any given reference string.';
      } else if (activeAlgo === 'fifo') {
        text += 'FIFO is the simplest page-replacement algorithm. It uses a queue and evicts the page that has been in memory the longest, regardless of how recently or frequently it was used.';
      } else {
        text += 'LRU approximates optimal by evicting the page that hasn\'t been used for the longest time. It assumes recently-used pages are likely to be used again soon (temporal locality).';
      }
    }

    el.innerHTML = text;
  }
}

// ────────────────────────────────────────────────────────────
// 4. EXPORTS FOR NODE TESTING
// ────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runFIFO, runLRU, runOptimal, parseRefs };
}

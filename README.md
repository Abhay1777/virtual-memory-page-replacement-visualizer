# 🧠 Virtual Memory & Page Replacement Visualizer

An interactive, responsive Operating Systems educational tool for simulating, visualizing, and comparing three classic page replacement algorithms: **FIFO** (First-In, First-Out), **LRU** (Least Recently Used), and **Optimal** (Bélády's Algorithm).

🌐 **Live Demo:** [https://abhay1777.github.io/virtual-memory-page-replacement-visualizer/](https://abhay1777.github.io/virtual-memory-page-replacement-visualizer/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Algorithms Explained](#algorithms-explained)
- [Sample Input & Expected Output](#sample-input--expected-output)
- [Project Structure](#project-structure)
- [Running Locally](#running-locally)
- [Running the Test Suite](#running-the-test-suite)
- [GitHub Pages Deployment](#github-pages-deployment)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [License](#license)

---

## Overview

In modern operating systems, **virtual memory** gives running processes the illusion of contiguous, dedicated memory by dividing address space into fixed-size **pages** mapped to physical RAM **frames**. When a process references a page that is not in physical RAM, a **page fault** occurs, requiring the OS to bring the missing page in from backing storage.

When all memory frames are occupied, the operating system must choose a page to evict. The policy governing this choice is a **page replacement algorithm**. This visualizer provides step-by-step memory frame traces, comparative metrics, and visual fault comparison charts to clearly illustrate how each algorithm behaves.

---

## Key Features

| Feature | Description |
|---|---|
| **Three Core Algorithms** | Complete, pure implementations of **FIFO**, **LRU**, and **Optimal** |
| **Side-by-Side Comparison** | Compare All mode evaluates all three algorithms on the exact same workload |
| **Real-Time Summary Metrics** | Page faults, page hits, fault rate, hit rate, and best-performing algorithm |
| **Visual Comparison Chart** | Horizontal bar chart contrasting page fault counts with high clarity |
| **Step-by-Step Memory Trace** | Interactive memory state table tracking frame contents, HIT/FAULT badges, and evicted pages |
| **Animated Playback Controls** | Play, Pause, Previous Step, Next Step, and Reset for guided classroom demonstrations |
| **Robust Input Validation** | Validates comma- or space-separated references, checks boundaries, and handles errors cleanly |
| **Educational Theory Section** | Clear explanations of demand paging, frames, pages, and Bélády's anomaly |
| **Modern Blue & Cyan UI** | High-contrast, developer-tool aesthetic with deep navy surfaces and vibrant accents |
| **Zero Dependencies** | Pure HTML5, CSS3, and Vanilla JavaScript with no external CDNs or frameworks |

---

## Algorithms Explained

### 1. FIFO (First-In, First-Out)
- **Concept:** Evicts the page that has resided in memory the longest (oldest arrival).
- **Mechanism:** Implemented using a queue (`FIFO` arrival order).
- **Behavior:** Simple to implement with $O(1)$ replacement, but ignores access frequency and recency. Hits do **not** change a page's queue position.
- **Anomaly:** Subject to **Bélády's Anomaly**, where increasing physical frame count can counter-intuitively *increase* page faults.

### 2. LRU (Least Recently Used)
- **Concept:** Evicts the page that has not been referenced for the longest duration in the past.
- **Mechanism:** Tracks access timestamps/recency on **both** hits and new loads.
- **Behavior:** Heavily leverages the principle of *temporal locality* (pages accessed recently are likely to be accessed again soon).
- **Properties:** Belongs to the class of *stack algorithms* and is mathematically immune to Bélády's Anomaly.

### 3. Optimal (OPT / Bélády's Min)
- **Concept:** Evicts the page that will **not be used for the longest period of time in the future**.
- **Mechanism:** Looks ahead through the remaining reference string and selects the resident page whose next occurrence is farthest (or never referenced again).
- **Behavior:** Guarantees the absolute theoretical minimum number of page faults for any reference string and frame count.
- **Real-World Note:** Cannot be implemented in general-purpose operating systems because future page requests cannot be known in advance. Serves as the ultimate benchmark.

---

## Sample Input & Expected Output

### Mandatory Benchmark Workload
- **Page Reference String:** `7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2` (13 references)
- **Number of Frames:** `3`

| Algorithm | Page Faults | Page Hits | Fault Rate | Hit Rate | Status |
|---|---:|---:|---:|---:|:---:|
| **FIFO** | **10** | **3** | **76.9%** | **23.1%** | Verified ✅ |
| **LRU** | **9** | **4** | **69.2%** | **30.8%** | Verified ✅ |
| **Optimal** | **7** | **6** | **53.8%** | **46.2%** | Verified ✅ |

> **Consistency Invariant:** Total Faults + Total Hits = Total References ($10 + 3 = 13$, $9 + 4 = 13$, $7 + 6 = 13$).

---

## Project Structure

```
virtual-memory-page-replacement-visualizer/
├── .github/
│   └── workflows/
│       └── deploy.yml      # Automated GitHub Pages static deployment
├── .gitignore              # Ignored files (OS, IDE, node_modules)
├── index.html              # Main application semantic structure
├── style.css               # Modern deep navy + vibrant blue design system
├── script.js               # Pure algorithm engines, validation & UI logic
├── tests.js                # Automated test suite (101 unit/scenario tests)
└── README.md               # Complete project documentation
```

---

## Running Locally

Since this application is built with standard Web standards (HTML5/CSS3/ES6) and requires no compilation or build tools:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Abhay1777/virtual-memory-page-replacement-visualizer.git
   cd virtual-memory-page-replacement-visualizer
   ```

2. **Open in any modern browser:**
   - Double-click `index.html`, or
   - Right-click `index.html` → **Open With** → **Google Chrome** (or Edge / Firefox / Safari).
   - Alternatively, serve via a local server:
     ```bash
     npx serve .
     # or
     python -m http.server 8000
     ```

---

## Running the Test Suite

The test suite runs directly in **Node.js** with zero external dependencies:

```bash
node tests.js
```

### Test Coverage Highlights
- **101 tests across 20 distinct categories**, including:
  - Exact fault and hit counts for standard reference workloads
  - 1-frame, 2-frame, 3-frame, and 4-frame boundary cases
  - Repeated reference strings and identical reference strings
  - Input parsing (commas, spaces, mixed whitespace, leading zeros)
  - Rejection of invalid inputs (empty, alphabetic, negative, decimal, overflow)
  - Frame invariant checks (no duplicate pages, fault + hit = total)
  - Complete step-by-step trace verification for FIFO, LRU, and Optimal

---

## GitHub Pages Deployment

This repository includes an automated GitHub Actions deployment workflow located at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### How It Works:
1. Every push to the `main` branch triggers the GitHub Pages workflow.
2. The workflow checks out the repository and deploys the static files directly to GitHub Pages.
3. The site becomes accessible at:
   **`https://abhay1777.github.io/virtual-memory-page-replacement-visualizer/`**

### Manual Activation (if required):
1. Navigate to your repository on GitHub: `Settings` → `Pages`.
2. Under **Build and deployment** → **Source**, select **GitHub Actions**.

---

## Architecture & Design Decisions

- **Decoupled Architecture:** Algorithm implementations (`runFIFO`, `runLRU`, `runOptimal`, `parseRefs`) are pure functions without DOM dependencies.
- **Universal Module Compatibility:** Uses standard CommonJS export guards (`if (typeof module !== 'undefined' && module.exports)`) so the exact same logic runs in the browser and in the Node.js test suite.
- **Safe State Updates:** Calculation triggers exclusively on the **Run Simulation** action, preventing premature computation or mismatched states.

---

## License

This project is created for educational purposes as an Operating Systems engineering project. Feel free to use and adapt it for academic study.

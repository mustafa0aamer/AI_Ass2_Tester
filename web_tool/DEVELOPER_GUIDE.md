# Developer Guide - Rescue Robot Test Suite

Welcome to the codebase of the Rescue Robot Test Suite! This document is designed to help any developer quickly understand how the project is built, how it works under the hood, and how to seamlessly extend it with new features.

---

## 1. Architecture & Tech Stack

This project is built to be a **zero-configuration Static Single Page Application (SPA)**. It doesn't rely on Node.js, Webpack, or any backend servers. It can be hosted directly on GitHub Pages or run locally by double-clicking the `index.html` file.

*   **HTML5 & DOM API:** Pure vanilla JavaScript is used for DOM manipulation to guarantee extreme performance and portability.
*   **Tailwind CSS (via CDN):** All UI styling is built using Tailwind CSS. Because we use the CDN runtime, custom theme configurations and `@apply` styles are injected directly within `<style type="text/tailwindcss">` in the `index.html` file.
*   **FontAwesome:** Used for all SVG icons (Robot, Fire, Debris, etc.).

---

## 2. File Structure

*   `index.html`: The main skeleton of the app. It holds the structural layout (Left Panel Setup, Right Panel Simulator), the Tailwind runtime configuration, and all inline component styles.
*   `style.css`: Contains CSS rules that cannot be natively handled by Tailwind utilities (e.g., custom scrollbars, keyframe glow animations, theme specific color transitions).
*   `app.js`: The central brain of the application. It handles user interactions, grid rendering, Prolog string parsing, and the core search algorithms.

---

## 3. Core Logic & State Management (`app.js`)

The app avoids complex framework state (like React Hooks) in favor of simple, fast global variables heavily commented in `app.js`.

### The Grid State
```javascript
let grid = [...]; // 2D Array holding 'r' (robot), 's' (survivor), 'f' (fire), 'd' (debris), 'e' (empty)
let ROWS = 4;
let COLS = 5;
```
When a user clicks on the Grid UI, it updates this `grid` 2D array and calls `renderGrid()`, which recreates the DOM cells based on the matrix.

### Prolog Parsing Bridge
The tool contains a parser that transforms Prolog formatted arrays `grid([[r, e, s],...]).` directly into the JavaScript `grid` variable using regex. This ensures seamless copy-pasting for students.

---

## 4. The Algorithm Engine

The Assignment requires algorithms that navigate a robot using specific battery and step limits. The algorithms are written in JavaScript to simulate the ideal Prolog state-space search.

1.  **Uniform Cost Search (UCS) for Part 1**: Used to find the nearest survivor. Since step cost is uniform ($1$), UCS behaves essentially as BFS. It maintains a Queue and a Closed Set (`r,c` string formats) and halts at 10 steps max (100% battery).
2.  **Greedy Best-First Search (GBFS) for Part 2**: Used to maximize rescued survivors within 10 steps.
    *   **Queue**: Priority Queue sorted by Heuristic value.
    *   **Tie-Breaking Priority**: Stable string sorting handles UP, DOWN, LEFT, RIGHT priorities smoothly. 
    *   **Heuristic Calculation**: $h(n) = (\text{Total Unrescued Survivors} \times 100) + \text{Manhattan Distance to closest unrescued survivor}$.
    *   **Closed List Handling**: Because the robot *can* revisit cells to rescue *different* survivors, the state key in the closed list is hashed as: `${row},${col}|${rescued_ids_list}`.

---

## 5. Modifying & Extending the Tool

### A. How to Add a New Algorithm (e.g., A*)
Adding a new algorithm is incredibly straightforward.

1.  **Add it to the UI (`index.html`)**
    Find the `<select id="sel-algo">` tag and add an option for it:
    ```html
    <option value="astar">A* Search Integration</option>
    ```
2.  **Hook the Logic (`app.js`)**
    Find the `runSimulation()` function and add it to the routing check:
    ```javascript
    const algo = document.getElementById('sel-algo').value;
    if (algo === "astar") {
        result = runAStarSearch(start, survivors); // Build this function
    }
    ```
3.  **Write the Function (`app.js`)**
    Create `runAStarSearch(start, targets)`. You can copy the structure of `runGBFS()`, but modify the sorting method from `a.h - b.h` (Greedy) to `a.f - b.f` (A*). Ensure it returns an object formatted exactly as:
    `{ path: [{r,c}, {r,c}], steps: 5, rescuedCount: 1 }`

### B. Customizing Colors and Themes
The website supports two themes: **Cyber** and **Modern**. If you want to change the color palette (like changing the neon pink primary to green), you do not need to modify thousands of classes. 
1. Open `index.html`.
2. Locate the `tailwind.config` script block exactly inside the `<head>`.
3. Modify the hex codes inside the `colors` object. All UI elements gracefully inherit from these specific tokens (`cyber-primary`, `modern-accent`, etc.).

---

This codebase is clean, procedural, and heavily componentized through Tailwind to make scaling it a breeze. Happy coding!

// Default grid using Example 1
let grid = [
    ['r', 'e', 'd', 'e', 'e'],
    ['e', 'e', 'f', 'e', 's'],
    ['d', 'e', 'e', 'e', 'e'],
    ['e', 's', 'e', 'f', 'e']
];

let ROWS = 4;
let COLS = 5;
let currentTool = 'e';
let simulationPath = [];
let playbackInterval = null;
let currentPlaybackIndex = 0;

// Directions: UP, DOWN, LEFT, RIGHT
const DIRS = [
    { dr: -1, dc: 0, name: 'UP' },
    { dr: 1, dc: 0, name: 'DOWN' },
    { dr: 0, dc: -1, name: 'LEFT' },
    { dr: 0, dc: 1, name: 'RIGHT' }
];

// DOM Elements
const gridContainer = document.getElementById('grid-container');
const prologInput = document.getElementById('prolog-input');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupUI();
    renderGrid();
    updatePrologInput();
});

function setupUI() {
    // Theme Toggle
    document.getElementById('theme-toggle').addEventListener('change', (e) => {
        if (e.target.checked) {
            document.documentElement.classList.remove('theme-cyber');
            document.documentElement.classList.add('theme-modern');
        } else {
            document.documentElement.classList.remove('theme-modern');
            document.documentElement.classList.add('theme-cyber');
        }
    });

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.remove('hidden');
        });
    });

    // Paint Tools
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            currentTool = target.dataset.type;
        });
    });

    // Clear Grid
    document.getElementById('btn-clear-grid').addEventListener('click', () => {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                grid[r][c] = 'e';
            }
        }
        grid[0][0] = 'r'; // default robot
        renderGrid();
        updatePrologInput();
    });

    // Expand
    document.getElementById('btn-expand-grid').addEventListener('click', () => {
        ROWS = 5; COLS = 5;
        grid = Array(ROWS).fill().map(() => Array(COLS).fill('e'));
        grid[0][0] = 'r';
        renderGrid();
        updatePrologInput();
    });

    // Randomizer Sliders
    const rInp = document.getElementById('inp-rows');
    const cInp = document.getElementById('inp-cols');
    const oInp = document.getElementById('inp-obs');
    const sInp = document.getElementById('inp-surv');
    
    [rInp, cInp, oInp, sInp].forEach(inp => {
        inp.addEventListener('input', (e) => {
            document.getElementById(`val-${e.target.id.split('-')[1]}`).innerText = e.target.value;
        });
    });

    document.getElementById('btn-gen-random').addEventListener('click', () => {
        generateRandomGrid(parseInt(rInp.value), parseInt(cInp.value), parseInt(oInp.value), parseInt(sInp.value));
    });

    document.getElementById('btn-gen-chaos').addEventListener('click', () => {
        rInp.value = Math.floor(Math.random() * 6) + 3;
        cInp.value = Math.floor(Math.random() * 6) + 3;
        oInp.value = Math.floor(Math.random() * 40);
        sInp.value = Math.floor(Math.random() * 4) + 1;
        [rInp, cInp, oInp, sInp].forEach(inp => document.getElementById(`val-${inp.id.split('-')[1]}`).innerText = inp.value);
        generateRandomGrid(parseInt(rInp.value), parseInt(cInp.value), parseInt(oInp.value), parseInt(sInp.value));
    });

    // Scenarios
    document.getElementById('btn-load-scenario').addEventListener('click', () => {
        const val = document.getElementById('sel-scenario').value;
        if (val === 'ex1') setGridData([['r','e','d','e','e'],['e','e','f','e','s'],['d','e','e','e','e'],['e','s','e','f','e']]);
        if (val === 'ex2') setGridData([['r','e','e'],['d','f','e'],['e','e','s']]);
        if (val === 'no-path') setGridData([['r','f','e'],['f','d','e'],['e','e','s']]);
        if (val === 'battery-death') setGridData([['r','e','e','e','e','e','e'],['e','e','e','e','e','e','e'],['e','e','e','e','e','e','s']]);
        if (val === 'trapped') setGridData([['r','f','e'],['d','d','e'],['e','e','s']]);
        if (val === 'no-survivor') setGridData([['r','e','e'],['e','e','e'],['e','e','e']]);
    });

    // Prolog Parse
    document.getElementById('btn-parse-prolog').addEventListener('click', () => {
        try {
            const raw = prologInput.value.replace(/\s+/g, '');
            const match = raw.match(/grid\(\[(.*)\]\)\./);
            if (!match) throw "Invalid Format";
            let inner = match[1];
            // Split by arrays
            let rowStrings = inner.split('],[');
            rowStrings = rowStrings.map(rs => rs.replace(/\[|\]/g, ''));
            let newGrid = rowStrings.map(r => r.split(','));
            setGridData(newGrid);
        } catch (e) {
            alert("Error parsing Prolog grid. Ensure it matches grid([[...],...]). format.");
        }
    });

    document.getElementById('btn-copy-prolog').addEventListener('click', () => {
        navigator.clipboard.writeText(prologInput.value);
        const btn = document.getElementById('btn-copy-prolog');
        btn.innerHTML = '<i class="fa-solid fa-check text-green-400"></i> Copied!';
        setTimeout(() => btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy', 2000);
    });

    // Part Selector Changes Heuristic Note
    document.getElementById('sel-part').addEventListener('change', (e) => {
        if(e.target.value === "2") {
            document.getElementById('sel-algo').value = "gbfs";
            document.getElementById('heuristic-note').classList.remove('hidden');
        } else {
            document.getElementById('sel-algo').value = "ucs";
            document.getElementById('heuristic-note').classList.add('hidden');
        }
    });

    // Simulation
    document.getElementById('btn-run').addEventListener('click', runSimulation);

    // Playback
    document.getElementById('btn-play-pause').addEventListener('click', togglePlayback);
    document.getElementById('btn-step-prev').addEventListener('click', () => stepPlayback(-1));
    document.getElementById('btn-step-next').addEventListener('click', () => stepPlayback(1));
}

function setGridData(newGrid) {
    grid = newGrid;
    ROWS = grid.length;
    COLS = grid[0].length;
    renderGrid();
    updatePrologInput();
}

function generateRandomGrid(r, c, obsPct, survCount) {
    ROWS = r; COLS = c;
    grid = Array(r).fill().map(() => Array(c).fill('e'));
    grid[0][0] = 'r';
    
    let emptyCells = [];
    for(let i=0; i<r; i++) {
        for(let j=0; j<c; j++) {
            if(i===0 && j===0) continue;
            emptyCells.push({i,j});
        }
    }
    emptyCells.sort(() => Math.random() - 0.5);

    // Place survivors
    let placedSurv = 0;
    while(placedSurv < survCount && emptyCells.length > 0) {
        let cell = emptyCells.pop();
        grid[cell.i][cell.j] = 's';
        placedSurv++;
    }

    // Place obstacles
    let obsCount = Math.floor((r * c) * (obsPct / 100));
    let placedObs = 0;
    while(placedObs < obsCount && emptyCells.length > 0) {
        let cell = emptyCells.pop();
        grid[cell.i][cell.j] = Math.random() > 0.5 ? 'f' : 'd';
        placedObs++;
    }
    
    renderGrid();
    updatePrologInput();
}

function renderGrid() {
    gridContainer.style.gridTemplateColumns = `repeat(${COLS}, minmax(0, 1fr))`;
    gridContainer.innerHTML = '';
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.className = `grid-cell cell-${grid[r][c]}`;
            
            let icon = '';
            if(grid[r][c] === 'r') icon = '<i class="fa-solid fa-robot"></i>';
            if(grid[r][c] === 's') icon = '<i class="fa-solid fa-heart"></i>';
            if(grid[r][c] === 'f') icon = '<i class="fa-solid fa-fire"></i>';
            if(grid[r][c] === 'd') icon = '<i class="fa-solid fa-cubes-stacked"></i>';
            
            cell.innerHTML = icon;

            // Optional: Show ID for debugging
            // cell.innerHTML += `<span class="absolute bottom-0 right-1 text-[8px] opacity-30">${r+1},${c+1}</span>`;

            cell.addEventListener('mousedown', (e) => {
                if(e.buttons === 1) applyTool(r, c);
            });
            cell.addEventListener('mouseenter', (e) => {
                if(e.buttons === 1) applyTool(r, c);
            });
            cell.dataset.r = r;
            cell.dataset.c = c;
            gridContainer.appendChild(cell);
        }
    }
}

function applyTool(r, c) {
    if (currentTool === 'r') {
        // Find existing robot and remove
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                if (grid[i][j] === 'r') grid[i][j] = 'e';
            }
        }
    }
    grid[r][c] = currentTool;
    renderGrid();
    updatePrologInput();
}

function updatePrologInput() {
    let lines = grid.map(row => '  [' + row.join(', ') + ']');
    prologInput.value = `grid([\n${lines.join(',\n')}\n]).`;
}

// ---------------- ALGORITHMS ---------------- //

function runSimulation() {
    // Collect coordinates
    let start = null;
    let survivors = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c] === 'r') start = { r, c };
            if (grid[r][c] === 's') survivors.push({ r, c, id: `${r},${c}` });
        }
    }

    if (!start) {
        setResults("Error", "No robot 'r' found!");
        return;
    }

    const part = document.getElementById('sel-part').value;
    let result = null;

    if (part === "1") {
        result = runUCS(start);
    } else {
        result = runGBFS(start, survivors);
    }

    if (!result) {
        setResults("No path found or Battery depleted.", "-", "-", "-");
        document.getElementById('res-path').innerHTML = 'No Path';
        simulationPath = [];
    } else {
        setResults("Success! Path Found.", result.steps, `${100 - (result.steps * 10)}%`, result.rescuedCount);
        let pathStr = result.path.map(p => `(${p.r+1},${p.c+1})`).join(' &rarr; ');
        document.getElementById('res-path').innerHTML = pathStr;
        simulationPath = result.path;
        startPlayback();
    }
}

// Uniform Cost Search / BFS for Part 1
function runUCS(start) {
    const queue = [{ r: start.r, c: start.c, path: [{ r: start.r, c: start.c }], steps: 0 }];
    const closed = new Set();

    while (queue.length > 0) {
        // Shift first element (UCS behavior since step cost is exactly 1)
        const curr = queue.shift();
        
        let stateKey = `${curr.r},${curr.c}`;
        if (closed.has(stateKey)) continue;
        closed.add(stateKey);

        if (grid[curr.r][curr.c] === 's') {
            return { path: curr.path, steps: curr.steps, rescuedCount: 1 };
        }

        if (curr.steps >= 10) continue; // Battery limit

        // Expand UP, DOWN, LEFT, RIGHT
        for (let dir of DIRS) {
            let nr = curr.r + dir.dr;
            let nc = curr.c + dir.dc;

            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                if (grid[nr][nc] !== 'd' && grid[nr][nc] !== 'f') {
                    if (!closed.has(`${nr},${nc}`)) {
                        queue.push({
                            r: nr, 
                            c: nc, 
                            path: [...curr.path, { r: nr, c: nc }],
                            steps: curr.steps + 1
                        });
                    }
                }
            }
        }
    }
    return null;
}

// Greedy Best First Search for Part 2
function runGBFS(start, totalSurvivors) {
    // Heuristic: (Total unrescued * 100) + Manhattan distance to nearest unrescued
    const getH = (r, c, rescuedSet) => {
        let unrescuedCount = totalSurvivors.length - rescuedSet.size;
        if (unrescuedCount === 0) return 0;

        let minDist = Infinity;
        for (let s of totalSurvivors) {
            if (!rescuedSet.has(s.id)) {
                let dist = Math.abs(r - s.r) + Math.abs(c - s.c);
                if (dist < minDist) minDist = dist;
            }
        }
        return (unrescuedCount * 100) + minDist;
    };

    let pqueue = [{
        r: start.r, 
        c: start.c, 
        path: [{ r: start.r, c: start.c }], 
        steps: 0,
        rescued: new Set(),
        h: getH(start.r, start.c, new Set())
    }];

    // Closed list stores state as "r,c|rescued_ids_sorted" to allow revisiting cells IF we have rescued someone new.
    // The rules say "cannot revisit a cell already in the current path", so actually we should just check if (nr, nc) is in curr.path!
    const closed = new Set(); 

    let bestRescuedCount = 0;
    let bestResult = null;

    while (pqueue.length > 0) {
        // Sort to get lowest h. Tie break: stable sort preserves order of insertion (U, D, L, R)
        pqueue.sort((a, b) => a.h - b.h);
        const curr = pqueue.shift();

        // Closed check based on path. "robot cannot revisit a cell already in the current path"
        // In this implementation path is unique per node. So checking if nr,nc is in curr.path during expansion is enough.

        let currentRescued = new Set(curr.rescued);
        if (grid[curr.r][curr.c] === 's') {
            currentRescued.add(`${curr.r},${curr.c}`);
        }

        // Track the absolute best path we've seen (max rescued)
        if (currentRescued.size > bestRescuedCount) {
            bestRescuedCount = currentRescued.size;
            bestResult = { path: curr.path, steps: curr.steps, rescuedCount: currentRescued.size };
        }
        
        // If we rescued everyone, we can stop early
        if (currentRescued.size === totalSurvivors.length) {
             return bestResult;
        }

        // We still need to prevent infinite loops globally if students do state saving.
        // We will store states of (r, c, rescued_array.join(','))
        let rescuedKey = Array.from(currentRescued).sort().join(',');
        let stateKey = `${curr.r},${curr.c}|${rescuedKey}`;
        
        if(closed.has(stateKey)) continue;
        closed.add(stateKey);

        if (curr.steps >= 10) continue;

        for (let dir of DIRS) {
            let nr = curr.r + dir.dr;
            let nc = curr.c + dir.dc;

            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                if (grid[nr][nc] !== 'd' && grid[nr][nc] !== 'f') {
                    // Rule: Cannot revisit a cell already in current path
                    let inPath = curr.path.some(p => p.r === nr && p.c === nc);
                    if (!inPath) {
                        pqueue.push({
                            r: nr,
                            c: nc,
                            path: [...curr.path, { r: nr, c: nc }],
                            steps: curr.steps + 1,
                            rescued: currentRescued,
                            h: getH(nr, nc, currentRescued)
                        });
                    }
                }
            }
        }
    }

    return bestResult;
}

function setResults(status, steps, batt, surv) {
    document.getElementById('result-status').innerText = status;
    document.getElementById('res-steps').innerText = steps;
    document.getElementById('res-batt').innerText = batt;
    document.getElementById('res-surv').innerText = surv;
}

// ---------------- PLAYBACK & ANIMATION ---------------- //

function startPlayback() {
    document.getElementById('playback-controls').classList.remove('hidden');
    document.getElementById('playback-controls').classList.add('flex');
    currentPlaybackIndex = 0;
    highlightPathStep(0);
    if(playbackInterval) clearInterval(playbackInterval);
    document.getElementById('btn-play-pause').innerHTML = '<i class="fa-solid fa-pause"></i>';
    playbackInterval = setInterval(() => stepPlayback(1), 800);
}

function togglePlayback() {
    if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
        document.getElementById('btn-play-pause').innerHTML = '<i class="fa-solid fa-play"></i>';
    } else {
        if(currentPlaybackIndex >= simulationPath.length - 1) currentPlaybackIndex = 0;
        document.getElementById('btn-play-pause').innerHTML = '<i class="fa-solid fa-pause"></i>';
        playbackInterval = setInterval(() => stepPlayback(1), 800);
    }
}

function stepPlayback(dir) {
    if (!simulationPath || simulationPath.length === 0) return;
    
    currentPlaybackIndex += dir;
    
    // Bounds
    if (currentPlaybackIndex >= simulationPath.length) {
        currentPlaybackIndex = simulationPath.length - 1;
        clearInterval(playbackInterval);
        playbackInterval = null;
        document.getElementById('btn-play-pause').innerHTML = '<i class="fa-solid fa-play"></i>';
    }
    if (currentPlaybackIndex < 0) currentPlaybackIndex = 0;

    highlightPathStep(currentPlaybackIndex);
}

function highlightPathStep(index) {
    // Reset all cells visually, keeping their roles
    renderGrid();

    // Mark previous steps faintly up to index
    for(let i=0; i<index; i++) {
        let p = simulationPath[i];
        let cellIndex = p.r * COLS + p.c;
        let cell = gridContainer.children[cellIndex];
        cell.classList.add('opacity-50');
        // Add a small trail dot
        if(grid[p.r][p.c] === 'e') {
            cell.innerHTML = '<div class="w-2 h-2 rounded-full bg-cyber-primary animate-pulse"></div>';
        }
    }

    // Highlight current step
    let curr = simulationPath[index];
    let cellIndex = curr.r * COLS + curr.c;
    let cell = gridContainer.children[cellIndex];
    
    cell.classList.add('cell-path', 'scale-110', 'z-20');
    // Draw robot moving into this cell
    if(grid[curr.r][curr.c] !== 'r') {
        cell.innerHTML = '<i class="fa-solid fa-robot text-blue-300"></i>';
    }
}

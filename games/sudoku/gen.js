// 스도쿠 생성 (브라우저와 node 검사 공용)
// 시드 난수로 정답판을 채운 뒤, 해가 하나로 유지되는 동안 칸을 하나씩 비웁니다.
const SUDOKU_CLUES = { easy: 40, normal: 32, hard: 26 }; // 남길 숫자 수 (어려움은 더 못 지우면 조금 많을 수 있음)
const sudokuBox = i => Math.floor(i / 27) * 3 + Math.floor(i % 9 / 3);

// 비트마스크 백트래킹: 해를 limit개까지 세고 첫 해를 돌려줍니다. r을 주면 숫자 시도 순서를 섞습니다.
function sudokuSolve(grid, limit, r) {
  const g = grid.slice(), row = Array(9).fill(0), col = Array(9).fill(0), box = Array(9).fill(0);
  g.forEach((v, i) => { if (v) { row[i / 9 | 0] |= 1 << v; col[i % 9] |= 1 << v; box[sudokuBox(i)] |= 1 << v; } });
  let count = 0, first = null;
  (function go() {
    // 후보가 가장 적은 빈칸부터 채웁니다.
    let best = -1, bestMask = 0, bestN = 10;
    for (let i = 0; i < 81 && bestN > 1; i++) {
      if (g[i]) continue;
      const mask = ~(row[i / 9 | 0] | col[i % 9] | box[sudokuBox(i)]) & 0x3FE;
      let n = 0;
      for (let m = mask; m; m &= m - 1) n++;
      if (n < bestN) { best = i; bestMask = mask; bestN = n; }
    }
    if (best < 0) { count++; first ??= g.slice(); return; }
    const ds = [];
    for (let d = 1; d <= 9; d++) if (bestMask >> d & 1) ds.push(d);
    if (r) shuffle(ds, r);
    const ri = best / 9 | 0, ci = best % 9, bi = sudokuBox(best);
    for (const d of ds) {
      const m = 1 << d;
      g[best] = d; row[ri] |= m; col[ci] |= m; box[bi] |= m;
      go();
      g[best] = 0; row[ri] &= ~m; col[ci] &= ~m; box[bi] &= ~m;
      if (count >= limit) return;
    }
  })();
  return { count, first };
}

function sudokuGen(r, level) {
  const solution = sudokuSolve(Array(81).fill(0), 1, r).first;
  const puzzle = solution.slice();
  let clues = 81;
  for (const i of shuffle([...Array(81).keys()], r)) {
    if (clues <= SUDOKU_CLUES[level]) break;
    const v = puzzle[i];
    puzzle[i] = 0;
    if (sudokuSolve(puzzle, 2).count > 1) puzzle[i] = v;
    else clues--;
  }
  return { puzzle, solution };
}

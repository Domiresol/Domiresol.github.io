// 노노그램 생성 (브라우저와 node 검사 공용)
// 무작위 그림을 만들고, 줄 단위 추론만으로 끝까지 풀리는(= 답이 하나인) 그림이 나올 때까지 다시 만듭니다.
const NONO_SIZE = { easy: 5, normal: 10, hard: 15 };

// [1,1,0,1] -> [2,1]
function nonoClue(line) {
  const out = [];
  let k = 0;
  for (const v of line) { if (v === 1) k++; else if (k) { out.push(k); k = 0; } }
  if (k) out.push(k);
  return out;
}

// 한 줄 추론: s는 -1(모름)/0(빈칸)/1(칠함). 힌트 c와 맞는 모든 배치를 따져 확정되는 칸을 채운 새 줄을 돌려줍니다.
function nonoLine(c, s) {
  const L = s.length, k = c.length;
  const Z = [0]; // Z[i]: 앞 i칸 중 빈칸(0) 수
  s.forEach(v => Z.push(Z.at(-1) + (v === 0)));
  const fits = (a, b) => Z[b] === Z[a]; // a..b-1 칸에 블록을 놓을 수 있음
  // F[j][i]: 앞 i칸에 블록 0..j-1을 놓을 수 있음 / B[j][i]: i칸부터 끝까지 블록 j..k-1을 놓을 수 있음
  const F = Array.from({ length: k + 1 }, () => Array(L + 1).fill(false));
  const B = Array.from({ length: k + 1 }, () => Array(L + 1).fill(false));
  F[0][0] = B[k][L] = true;
  for (let i = 1; i <= L; i++) for (let j = 0; j <= k; j++) {
    if (s[i - 1] !== 1 && F[j][i - 1]) F[j][i] = true;
    else if (j && i >= c[j - 1]) {
      const st = i - c[j - 1];
      F[j][i] = fits(st, i) && (st === 0 ? j === 1 : s[st - 1] !== 1 && F[j - 1][st - 1]);
    }
  }
  for (let i = L - 1; i >= 0; i--) for (let j = k; j >= 0; j--) {
    if (s[i] !== 1 && B[j][i + 1]) B[j][i] = true;
    else if (j < k && i + c[j] <= L) {
      const e = i + c[j];
      B[j][i] = fits(i, e) && (e === L ? j === k - 1 : s[e] !== 1 && B[j + 1][e + 1]);
    }
  }
  const canFill = Array(L).fill(false), canEmpty = Array(L).fill(false);
  for (let x = 0; x < L; x++) {
    if (s[x] !== 1) for (let j = 0; j <= k; j++) if (F[j][x] && B[j][x + 1]) { canEmpty[x] = true; break; }
  }
  for (let j = 0; j < k; j++) for (let st = 0; st + c[j] <= L; st++) {
    const e = st + c[j];
    if (fits(st, e) && (st === 0 ? j === 0 : s[st - 1] !== 1 && F[j][st - 1]) &&
        (e === L ? j === k - 1 : s[e] !== 1 && B[j + 1][e + 1])) for (let x = st; x < e; x++) canFill[x] = true;
  }
  return s.map((v, x) => canFill[x] && !canEmpty[x] ? 1 : canEmpty[x] && !canFill[x] ? 0 : v);
}

// 줄 추론을 더 바뀌지 않을 때까지 반복. 남은 -1이 없으면 답이 하나로 정해진 것입니다.
function nonoSolve(rows, cols) {
  const h = rows.length, w = cols.length, g = Array(h * w).fill(-1);
  for (let changed = true; changed;) {
    changed = false;
    const apply = (idx, clue) => {
      const res = nonoLine(clue, idx.map(i => g[i]));
      idx.forEach((i, k) => { if (res[k] !== g[i]) { g[i] = res[k]; changed = true; } });
    };
    for (let y = 0; y < h; y++) apply(Array.from({ length: w }, (_, x) => y * w + x), rows[y]);
    for (let x = 0; x < w; x++) apply(Array.from({ length: h }, (_, y) => y * w + x), cols[x]);
  }
  return g;
}

function nonoGen(r, level) {
  const n = NONO_SIZE[level];
  for (;;) {
    const sol = Array.from({ length: n * n }, () => r() < .6 ? 1 : 0);
    const rows = Array.from({ length: n }, (_, y) => nonoClue(sol.slice(y * n, y * n + n)));
    const cols = Array.from({ length: n }, (_, x) => nonoClue(rows.map((_, y) => sol[y * n + x])));
    if (!nonoSolve(rows, cols).includes(-1)) return { n, sol, rows, cols };
  }
}

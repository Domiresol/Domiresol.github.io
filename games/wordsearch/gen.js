// 단어 찾기 생성 (브라우저와 node 검사 공용)
// [격자 크기, 단어 수, 쓸 방향 수]: 쉬움은 →↓, 보통은 대각선까지, 어려움은 거꾸로 방향까지
const WS_LEVEL = { easy: [6, 5, 2], normal: [8, 7, 4], hard: [10, 9, 8] };
const WS_DIRS = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];

// pool: 정렬된 단어 목록 (순서가 바뀌면 같은 시드라도 판이 달라짐)
function wordsGen(r, level, pool) {
  const [n, count, nd] = WS_LEVEL[level];
  const grid = Array(n * n).fill(''), placed = [];
  for (const w of shuffle(pool.filter(w => w.length >= 2 && w.length <= 4), r)) {
    if (placed.length === count) break;
    if (placed.some(p => p.word.includes(w) || w.includes(p.word))) continue; // 다른 단어에 포함되면 헷갈리므로 제외
    for (let t = 0; t < 100; t++) {
      const [dy, dx] = WS_DIRS[rand(nd, r)], y = rand(n, r), x = rand(n, r);
      const ey = y + dy * (w.length - 1), ex = x + dx * (w.length - 1);
      if (ey < 0 || ey >= n || ex < 0 || ex >= n) continue;
      const cells = [...w].map((_, k) => (y + dy * k) * n + x + dx * k);
      if (cells.some((c, k) => grid[c] && grid[c] !== w[k])) continue; // 같은 글자끼리만 겹칠 수 있음
      cells.forEach((c, k) => grid[c] = w[k]);
      placed.push({ word: w, cells });
      break;
    }
  }
  // ponytail: 빈칸을 무작위 글자로 채우므로 드물게 목록 단어가 한 번 더 생길 수 있음. 정답 칸과 같은 선택만 인정.
  const fill = [...new Set(pool.join(''))];
  return { n, words: placed, grid: grid.map(c => c || fill[rand(fill.length, r)]) };
}

// 두 칸을 잇는 직선(가로·세로·대각선) 칸 목록. 직선이 아니면 null
function wordsLine(n, a, b) {
  const ay = a / n | 0, ax = a % n, dy = (b / n | 0) - ay, dx = b % n - ax;
  if (dy && dx && Math.abs(dy) !== Math.abs(dx)) return null;
  const len = Math.max(Math.abs(dy), Math.abs(dx)), sy = Math.sign(dy), sx = Math.sign(dx);
  return Array.from({ length: len + 1 }, (_, k) => (ay + sy * k) * n + ax + sx * k);
}

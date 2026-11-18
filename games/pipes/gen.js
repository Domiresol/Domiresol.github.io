// 파이프 연결 생성과 판정 (브라우저와 node 검사 공용)
// 연결 비트: 위 1, 오른쪽 2, 아래 4, 왼쪽 8
const PIPE_SIZE = { easy: 5, normal: 7, hard: 9 };
const PIPE_DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const pipeRotate = m => ((m << 1) | (m >> 3)) & 15; // 시계 방향 90도

// 가운데 수원에서 무작위 Prim 방식으로 모든 칸을 잇는 나무 구조를 만든 뒤, 조각을 무작위로 돌립니다.
function pipesGen(r, level) {
  const n = PIPE_SIZE[level], src = (n >> 1) * n + (n >> 1);
  const conn = Array(n * n).fill(0), seen = new Set([src]), edges = [];
  const addEdges = i => PIPE_DIRS.forEach((_, d) => edges.push([i, d]));
  addEdges(src);
  while (seen.size < n * n) {
    const [i, d] = edges.splice(rand(edges.length, r), 1)[0];
    const y = (i / n | 0) + PIPE_DIRS[d][0], x = i % n + PIPE_DIRS[d][1], j = y * n + x;
    if (y < 0 || y >= n || x < 0 || x >= n || seen.has(j)) continue;
    conn[i] |= 1 << d;
    conn[j] |= 1 << (d + 2) % 4;
    seen.add(j);
    addEdges(j);
  }
  const tiles = conn.map(m => { for (let k = rand(4, r); k > 0; k--) m = pipeRotate(m); return m; });
  return { n, src, tiles, answer: conn };
}

// 수원에서 물이 닿는 칸과, 새는 곳 없이 모든 칸에 닿았는지 여부
function pipesFlow(n, tiles, src) {
  const wet = new Set([src]), stack = [src];
  let leak = false;
  while (stack.length) {
    const i = stack.pop();
    PIPE_DIRS.forEach(([dy, dx], d) => {
      if (!(tiles[i] >> d & 1)) return;
      const y = (i / n | 0) + dy, x = i % n + dx, j = y * n + x;
      if (y < 0 || y >= n || x < 0 || x >= n || !(tiles[j] >> (d + 2) % 4 & 1)) { leak = true; return; }
      if (!wet.has(j)) { wet.add(j); stack.push(j); }
    });
  }
  return { wet, solved: !leak && wet.size === n * n };
}

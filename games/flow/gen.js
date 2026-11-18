// 색 점 잇기 생성과 판정 (브라우저와 node 검사 공용)
// 판 전체를 한 번에 지나는 무작위 경로를 만들고, 그것을 색 수만큼 잘라 양 끝을 점으로 남깁니다.
// ponytail: 답이 하나라는 보장은 없음. 판을 모두 채우며 같은 색 점을 이으면 어떤 연결이든 정답으로 인정.
const FLOW_LEVEL = { easy: [5, 5], normal: [7, 7], hard: [9, 10] }; // [판 크기, 색 수]

function flowNeighbors(n, i) {
  const y = i / n | 0, x = i % n, out = [];
  if (y > 0) out.push(i - n);
  if (y < n - 1) out.push(i + n);
  if (x > 0) out.push(i - 1);
  if (x < n - 1) out.push(i + 1);
  return out;
}

function flowGen(r, level) {
  const [n, k] = FLOW_LEVEL[level];
  // 지그재그 경로에서 시작해 backbite 이동(끝 칸을 옆 칸에 붙이고 뒷부분을 뒤집기)을 반복해 섞습니다.
  let P = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) P.push(y * n + (y % 2 ? n - 1 - x : x));
  for (let t = 0; t < n * n * 50; t++) {
    if (r() < .5) P.reverse();
    const end = P.at(-1), opts = flowNeighbors(n, end).filter(j => j !== P.at(-2));
    const i = P.indexOf(opts[rand(opts.length, r)]);
    P = P.slice(0, i + 1).concat(P.slice(i + 1).reverse());
  }
  // 길이 3 이상인 조각 k개로 자르기
  const len = Array(k).fill(3);
  for (let t = 0; t < n * n - 3 * k; t++) len[rand(k, r)]++;
  const paths = [];
  let at = 0;
  for (const l of len) { paths.push(P.slice(at, at + l)); at += l; }
  return { n, ends: paths.map(p => [p[0], p.at(-1)]), answer: paths };
}

// 모든 색이 양 끝 점을 잇고, 판의 모든 칸이 채워졌는지
function flowSolved(n, ends, paths) {
  const all = paths.flat();
  return all.length === n * n && new Set(all).size === n * n && paths.length === ends.length && paths.every((p, c) =>
    p.length > 1 && ends[c].includes(p[0]) && ends[c].includes(p.at(-1)) && p[0] !== p.at(-1) &&
    p.every((v, i) => i === 0 || flowNeighbors(n, p[i - 1]).includes(v)));
}

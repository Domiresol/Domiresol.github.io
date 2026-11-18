// 매일 문제 게임의 생성 로직 검사. 실행: node check.js
// 생성 코드를 고치면 같은 날짜·번호의 판이 달라지므로, 대표 판의 지문이 바뀌면 실패합니다.
// 의도한 변경이라면 출력된 새 지문으로 FINGERPRINT를 갱신하세요.
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const files = ['common.js', 'words_common.js', 'sudoku/gen.js', 'pipes/gen.js', 'wordsearch/gen.js', 'nonogram/gen.js', 'flow/gen.js'];
vm.runInThisContext(files.map(f => fs.readFileSync(`${__dirname}/${f}`, 'utf8')).join('\n'));
const { seeded, fnv, kstDate, sudokuGen, sudokuSolve, pipesGen, pipesFlow, wordsGen, nonoGen, nonoSolve, flowGen, flowSolved, COMMON } =
  vm.runInThisContext('({ seeded, fnv, kstDate, sudokuGen, sudokuSolve, pipesGen, pipesFlow, wordsGen, nonoGen, nonoSolve, flowGen, flowSolved, COMMON })');

// 공통: 날짜·시드
assert.strictEqual(kstDate(Date.UTC(2026, 0, 1, 15)), '2026-01-02'); // UTC 15시 = KST 다음날 0시
const a = seeded('x'), b = seeded('x');
assert.deepStrictEqual([a(), a(), a()], [b(), b(), b()]);
assert.notStrictEqual(seeded('x')(), seeded('y')());

const GEN = {
  sudoku: (r, lv) => sudokuGen(r, lv),
  pipes: (r, lv) => pipesGen(r, lv),
  wordsearch: (r, lv) => wordsGen(r, lv, COMMON),
  nonogram: (r, lv) => nonoGen(r, lv),
  flow: (r, lv) => flowGen(r, lv),
};
// 각 판이 실제로 풀 수 있는지
const VALID = {
  sudoku: p => sudokuSolve(p.puzzle, 2).count === 1 && p.puzzle.every((v, i) => !v || v === p.solution[i]),
  pipes: p => pipesFlow(p.n, p.answer, p.src).solved,
  wordsearch: p => p.words.length === { 6: 5, 8: 7, 10: 9 }[p.n] && p.words.every(w => w.cells.map(c => p.grid[c]).join('') === w.word),
  nonogram: p => nonoSolve(p.rows, p.cols).every((v, i) => v === p.sol[i]),
  flow: p => flowSolved(p.n, p.ends, p.answer),
};
const FINGERPRINT = {
  'sudoku.easy': 2513127207, 'sudoku.normal': 1244121828, 'sudoku.hard': 1879140390,
  'pipes.easy': 58312493, 'pipes.normal': 3461775887, 'pipes.hard': 352227757,
  'wordsearch.easy': 3542861876, 'wordsearch.normal': 756022850, 'wordsearch.hard': 980333394,
  'nonogram.easy': 2670284164, 'nonogram.normal': 2777543082, 'nonogram.hard': 1104494041,
  'flow.easy': 2955216571, 'flow.normal': 4028748514, 'flow.hard': 1765670141,
};

const LEVELS = ['easy', 'normal', 'hard'];
const out = {};
for (const id of Object.keys(GEN)) for (const lv of LEVELS) {
  // 하루치(1~10번)를 모두 만들어 보고, 1번 판은 지문을 비교
  for (let num = 1; num <= 10; num++) {
    const p = GEN[id](seeded(`${id}#2026-01-01#${num}#${lv}`), lv);
    assert(VALID[id](p), `${id} ${lv} ${num}번 풀 수 없음`);
    if (num === 1) out[`${id}.${lv}`] = fnv(JSON.stringify(p));
  }
}
console.log(JSON.stringify(out));
for (const [k, v] of Object.entries(FINGERPRINT)) assert.strictEqual(out[k], v, `${k} 판이 바뀌었습니다`);
assert.strictEqual(Object.keys(FINGERPRINT).length, Object.keys(out).length, 'FINGERPRINT를 채우세요');
console.log('OK');

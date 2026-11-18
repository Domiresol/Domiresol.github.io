// 실행: node check.js
const assert = require('assert');
const fs = require('fs');
const { toJamo, judge, kstDate, pickIndex } = require('./jamo.js');

assert.deepStrictEqual(toJamo('괜찮'), [...'ㄱㅗㅏㅣㄴㅊㅏㄴㅎ']);
assert.deepStrictEqual(toJamo('짜'), [...'ㅈㅈㅏ']);
assert.deepStrictEqual(toJamo('쌀'), [...'ㅅㅅㅏㄹ']);
assert.deepStrictEqual(toJamo('의'), [...'ㅇㅡㅣ']);

// 중복 자모: 정답에 ㄱ·ㅏ가 1개씩이면 초록/노랑도 1개씩만
assert.deepStrictEqual(judge([...'ㄱㄱㅏㅏㄴ'], [...'ㅏㄱㄴㅇㅇ']).join(''), 'bgyby');
assert.deepStrictEqual(judge([...'ㄱㅏㄴㄷㄹ'], [...'ㄱㅏㄴㄷㄹ']).join(''), 'ggggg');

assert.strictEqual(kstDate(Date.UTC(2026, 0, 1, 15)), '2026-01-02'); // UTC 15시 = KST 다음날 0시
assert.strictEqual(pickIndex('2026-01-01', 1, 100), pickIndex('2026-01-01', 1, 100));
assert.notStrictEqual(pickIndex('2026-01-01', 1, 1e6), pickIndex('2026-01-02', 1, 1e6));

// words.js의 모든 단어가 해당 자모 개수인지 (build_words.py와 분해 표 일치 확인)
eval(fs.readFileSync(__dirname + '/words.js', 'utf8').replace(/const /g, 'global.'));
for (const [n, { A, B, C, valid }] of Object.entries(WORDS)) {
  const answers = [...A, ...B, ...C];
  for (const w of [...answers, ...valid]) assert.strictEqual(toJamo(w).length, +n, w);
  const set = new Set(valid);
  assert(answers.every(w => set.has(w)));
  assert.strictEqual(new Set(answers).size, answers.length); // 한 단어는 한 등급에만
  console.log(n, A.length, B.length, C.length, valid.length);
}

// 배포된 정답 목록(index.html이 합치는 순서 그대로)은 바뀌면 안 됩니다. 같은 날짜·번호의 문제가 달라집니다.
const fp = (lengths, grades) =>
  pickIndex(lengths.flatMap(n => [...grades].flatMap(g => WORDS[n][g])).join(' '), 0, 2 ** 32);
assert.strictEqual(fp([5, 6], 'AB'), 393122483); // 쉬움
assert.strictEqual(fp([6, 7], 'BC'), 1489354676); // 어려움

console.log('OK');

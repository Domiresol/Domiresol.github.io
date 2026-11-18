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

// words.js의 모든 단어가 자모 5개인지 (build_words.py와 분해 표 일치 확인)
eval(fs.readFileSync(__dirname + '/words.js', 'utf8').replace(/const /g, 'global.'));
for (const w of [...ANSWERS, ...VALID]) assert.strictEqual(toJamo(w).length, 5, w);
assert(ANSWERS.every(w => VALID.includes(w)));

console.log('OK', ANSWERS.length, VALID.length);

// 한글 자모 분해, 판정, 문제 선택 로직 (브라우저와 node 공용)
const CHO = ['ㄱ', 'ㄱㄱ', 'ㄴ', 'ㄷ', 'ㄷㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅂㅂ', 'ㅅ', 'ㅅㅅ', 'ㅇ', 'ㅈ', 'ㅈㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNG = ['ㅏ', 'ㅏㅣ', 'ㅑ', 'ㅑㅣ', 'ㅓ', 'ㅓㅣ', 'ㅕ', 'ㅕㅣ', 'ㅗ', 'ㅗㅏ', 'ㅗㅏㅣ', 'ㅗㅣ', 'ㅛ', 'ㅜ', 'ㅜㅓ', 'ㅜㅓㅣ', 'ㅜㅣ', 'ㅠ', 'ㅡ', 'ㅡㅣ', 'ㅣ'];
const JONG = ['', 'ㄱ', 'ㄱㄱ', 'ㄱㅅ', 'ㄴ', 'ㄴㅈ', 'ㄴㅎ', 'ㄷ', 'ㄹ', 'ㄹㄱ', 'ㄹㅁ', 'ㄹㅂ', 'ㄹㅅ', 'ㄹㅌ', 'ㄹㅍ', 'ㄹㅎ', 'ㅁ', 'ㅂ', 'ㅂㅅ', 'ㅅ', 'ㅅㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// '괜찮' -> ['ㄱ','ㅗ','ㅏ','ㅣ','ㄴ','ㅊ','ㅏ','ㄴ','ㅎ']
function toJamo(word) {
  let out = '';
  for (const ch of word) {
    const c = ch.charCodeAt(0) - 0xAC00;
    out += CHO[Math.floor(c / 588)] + JUNG[Math.floor(c / 28) % 21] + JONG[c % 28];
  }
  return [...out];
}

// 'g'=초록, 'y'=노랑, 'b'=회색. 같은 자모가 중복될 때를 위해 초록을 먼저 확정합니다.
function judge(guess, answer) {
  const res = guess.map(() => 'b');
  const left = {};
  answer.forEach((a, i) => {
    if (guess[i] === a) res[i] = 'g';
    else left[a] = (left[a] || 0) + 1;
  });
  guess.forEach((g, i) => {
    if (res[i] !== 'g' && left[g] > 0) { res[i] = 'y'; left[g]--; }
  });
  return res;
}

// 한국 날짜(KST) 'YYYY-MM-DD'. 접속 지역과 무관하게 모두 같은 날짜를 씁니다.
function kstDate(now = Date.now()) {
  return new Date(now + 9 * 3600e3).toISOString().slice(0, 10);
}

// 날짜 + 문제 번호를 FNV-1a로 해시해 정답 인덱스를 고릅니다.
function pickIndex(date, num, size) {
  let h = 0x811c9dc5;
  for (const ch of `${date}#${num}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % size;
}

if (typeof module !== 'undefined') module.exports = { toJamo, judge, kstDate, pickIndex };

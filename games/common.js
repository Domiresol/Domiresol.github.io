// 미니 퍼즐 공통 스크립트: <head>에서 불러와 테마를 그리기 전에 적용합니다.
// 테마 키 'theme'은 목록·자모 맞추기와 공유합니다.
try { const t = localStorage.getItem('theme'); if (['light', 'dark', 'darker'].includes(t)) document.documentElement.dataset.theme = t; } catch {}

const $ = id => document.getElementById(id);
// r: 난수 함수. 매일 문제는 seeded()로 만든 함수를 넘겨 누구에게나 같은 결과가 나오게 합니다.
const rand = (n, r = Math.random) => Math.floor(r() * n);
const seg = name => document.querySelector(`input[name="${name}"]:checked`).value;
function shuffle(a, r = Math.random) {
  for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1, r); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// 한국 날짜(KST)와 FNV-1a 해시: 자모 맞추기(noravoca/jamo.js)와 같은 방식
const kstDate = (now = Date.now()) => new Date(now + 9 * 3600e3).toISOString().slice(0, 10);
function fnv(s) {
  let h = 0x811c9dc5;
  for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
// 문자열 시드로 0 이상 1 미만 난수를 만드는 함수 (mulberry32)
function seeded(s) {
  let a = fnv(s);
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// '2026-11-18' -> '2026년 11월 18일 (수)'
function fmtDate(d) {
  const [y, m, day] = d.split('-').map(Number);
  return `${y}년 ${m}월 ${day}일 (${'일월화수목금토'[new Date(Date.UTC(y, m - 1, day)).getUTCDay()]})`;
}

// 매일 문제 공통 틀 (자모 맞추기와 같은 방식)
// 주소에 ?n=번호&d=난이도가 없으면 시작 화면을, 있으면 run(난수, 난이도, 완료 함수)을 실행합니다.
// 같은 날짜·번호·난이도면 누구나 같은 판이 나옵니다. id를 바꾸면 모든 판이 바뀌니 고정해 두세요.
const DAILY_MAX = 10;

// 오늘 푼 문제 기록: localStorage 'daily:<게임id>:<날짜>:<번호>:<난이도>' = { summary, time, ...게임별 상태 }
// 날짜가 지난 기록은 지웁니다. 저장이 막힌 환경이면 기록 없이 동작합니다.
function dailyStore(id, date) {
  const pre = `daily:${id}:`, today = `${pre}${date}:`;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k.startsWith(pre) && !k.startsWith(today)) localStorage.removeItem(k);
    }
  } catch {}
  return {
    get(num, level) { try { return JSON.parse(localStorage.getItem(`${today}${num}:${level}`)); } catch { return null; } },
    set(num, level, v) { try { localStorage.setItem(`${today}${num}:${level}`, JSON.stringify(v)); } catch {} },
  };
}

// run(난수, 난이도, 완료 함수, 기록)
// - 완료 함수 finish(요약, 상태): 기록을 저장하고 완료 메시지를 보여 줍니다. 상태는 다시 열 때 판을 되살리는 데 씁니다.
// - 기록이 있으면(오늘 이미 푼 문제) run은 판을 푼 상태로 되살리고 입력을 막아야 합니다. 메시지와 시간은 이 틀이 표시합니다.
function daily({ id, name, desc, levels, run }) {
  const date = kstDate(), q = new URLSearchParams(location.search), store = dailyStore(id, date);
  const num = parseInt(q.get('n'), 10);
  const keys = Object.keys(levels), level = keys.includes(q.get('d')) ? q.get('d') : keys[0];
  if (!(num >= 1 && num <= DAILY_MAX)) {
    // 오늘 푼 문제를 난이도별로 바로 열 수 있게 표시
    const done = keys.map(k => {
      const nums = Array.from({ length: DAILY_MAX }, (_, i) => i + 1).filter(n => store.get(n, k));
      return nums.length ? `<span>${levels[k][0]} ${nums.map(n => `<a href="?n=${n}&d=${k}">${n}</a>`).join(' ')}</span>` : '';
    }).join('');
    $('entry').innerHTML = `
      <h1>${name}</h1>
      <p class="date-pill">${fmtDate(date)}</p>
      <p class="desc">${desc}<br>같은 날 같은 번호·난이도면 모두 같은 문제예요.</p>
      ${done ? `<p class="solved">오늘 푼 문제 ✓ ${done}</p>` : ''}
      <label class="field">문제 번호
        <input name="n" type="number" inputmode="numeric" min="1" max="${DAILY_MAX}" required placeholder="1 ~ ${DAILY_MAX}" autofocus>
      </label>
      <div class="seg" role="radiogroup" aria-label="난이도">${keys.map((k, i) =>
        `<label><input type="radio" name="d" value="${k}"${i ? '' : ' checked'}><span>${levels[k][0]}<small>${levels[k][1]}</small></span></label>`).join('')}</div>
      <button class="start">시작하기</button>`;
    $('entry').hidden = false;
    return;
  }
  const rec = store.get(num, level);
  const paintTitle = solved => { $('title').textContent = `${num}번 · ${levels[level][0]}${solved ? ' ✓' : ''}`; };
  paintTitle(rec);
  $('date').textContent = fmtDate(date);
  $('prev').href = `?n=${num - 1}&d=${level}`;
  $('next').href = `?n=${num + 1}&d=${level}`;
  $('prev').classList.toggle('off', num <= 1);
  $('next').classList.toggle('off', num >= DAILY_MAX);
  Object.assign($('home'), { href: '?', textContent: '처음' });
  $('mid').hidden = $('game').hidden = false;

  // 완료 메시지와 결과 복사 (판 내용은 빼고 기록만 공유)
  const showDone = (summary, again) => {
    const text = `${name} ${date} · ${num}번 · ${levels[level][0]} · ${summary}\n${location.origin}${location.pathname}?n=${num}&d=${level}`;
    $('msg').innerHTML = '';
    $('msg').append(`${again ? '오늘 이미 푼 문제예요. ' : '완료! '}${summary}`, document.createElement('br'), Object.assign(document.createElement('button'), {
      type: 'button', className: 'share', textContent: '결과 복사',
      onclick: () => navigator.clipboard.writeText(text)
        .then(() => alert('결과를 복사했습니다.'))
        .catch(() => prompt('아래 내용을 복사하세요.', text)),
    }));
  };
  const finish = (summary, state) => {
    store.set(num, level, { summary, time: $('time')?.textContent, ...state });
    paintTitle(true);
    showDone(summary);
  };
  run(seeded(`${id}#${date}#${num}#${level}`), level, finish, rec);
  if (rec) {
    if ($('time') && rec.time) $('time').textContent = rec.time;
    showDone(rec.summary, true);
  }
}

// 경과 시간 표시: start()는 reset() 뒤 처음 한 번만 시작하고, stop() 뒤에는 멈춘 값을 유지합니다.
function timer(el) {
  let t0 = 0, id = 0, state = 'idle';
  const paint = () => {
    const s = Math.floor((Date.now() - t0) / 1000);
    el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  return {
    start() { if (state !== 'idle') return; state = 'run'; t0 = Date.now(); id = setInterval(paint, 1000); },
    stop() { if (state === 'run') paint(); clearInterval(id); state = 'done'; },
    reset() { clearInterval(id); state = 'idle'; el.textContent = '0:00'; },
    get text() { return el.textContent; },
  };
}

// 테마 토글: 라이트 → 다크 → 더 다크 (node 검사(check.js)에서 불러올 때는 건너뜀)
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement, btn = $('theme');
  const THEMES = { light: ['☀️', '라이트'], dark: ['🌙', '다크'], darker: ['🌑', '더 다크'] };
  const ORDER = Object.keys(THEMES);
  const theme = () => THEMES[root.dataset.theme] ? root.dataset.theme
    : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const next = () => ORDER[(ORDER.indexOf(theme()) + 1) % ORDER.length];
  const paint = () => {
    btn.textContent = THEMES[theme()][0];
    btn.title = `${THEMES[theme()][1]} 모드 (누르면 ${THEMES[next()][1]} 모드)`;
    btn.setAttribute('aria-label', btn.title);
  };
  btn.onclick = () => {
    root.dataset.theme = next();
    try { localStorage.setItem('theme', root.dataset.theme); } catch {}
    paint();
    btn.blur();
  };
  paint();
});

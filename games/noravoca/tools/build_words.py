"""표준국어대사전 parquet에서 자모 5~7개 단어를 뽑아 words.js를 생성합니다.

사용법: python build_words.py <stdict.parquet 경로> <학습용 어휘 목록.txt 경로> [출력 경로]
데이터:
  - 입력 허용 목록: https://huggingface.co/datasets/hac541309/stdict_kor (표준국어대사전, CC BY-SA)
  - 정답 목록: https://www.korean.go.kr/front_eng/down/down_02V.do?etc_seq=70 (한국어 학습용 어휘 목록, cp949)
필요 패키지: pyarrow
"""
import re
import sys

import pyarrow.parquet as pq

# jamo.js의 분해 표와 동일해야 합니다. (check.js가 결과를 검증)
CHO = ['ㄱ', 'ㄱㄱ', 'ㄴ', 'ㄷ', 'ㄷㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅂㅂ', 'ㅅ', 'ㅅㅅ', 'ㅇ', 'ㅈ', 'ㅈㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
JUNG = ['ㅏ', 'ㅏㅣ', 'ㅑ', 'ㅑㅣ', 'ㅓ', 'ㅓㅣ', 'ㅕ', 'ㅕㅣ', 'ㅗ', 'ㅗㅏ', 'ㅗㅏㅣ', 'ㅗㅣ', 'ㅛ', 'ㅜ', 'ㅜㅓ', 'ㅜㅓㅣ', 'ㅜㅣ', 'ㅠ', 'ㅡ', 'ㅡㅣ', 'ㅣ']
JONG = ['', 'ㄱ', 'ㄱㄱ', 'ㄱㅅ', 'ㄴ', 'ㄴㅈ', 'ㄴㅎ', 'ㄷ', 'ㄹ', 'ㄹㄱ', 'ㄹㅁ', 'ㄹㅂ', 'ㄹㅅ', 'ㄹㅌ', 'ㄹㅍ', 'ㄹㅎ', 'ㅁ', 'ㅂ', 'ㅂㅅ', 'ㅅ', 'ㅅㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']


def jamo(word):
    out = ''
    for ch in word:
        c = ord(ch) - 0xAC00
        out += CHO[c // 588] + JUNG[c // 28 % 21] + JONG[c % 28]
    return out


LENGTHS = (5, 6, 7)  # 지원하는 자모 개수
GRADES = 'ABC'  # 학습용 어휘 목록 등급 (A가 가장 쉬움)

HEAD = re.compile(r'^어휘: ([^,]+), 구성 단위: 단어,')
HANGUL = re.compile(r'^[가-힣]+$')


def learner_nouns(path):
    """학습용 어휘 목록의 명사를 {단어: 등급}으로 돌려줍니다. 줄 형식: 순위\t단어\t품사\t풀이\t등급
    동음이의어처럼 등급이 여러 개면 가장 쉬운 등급을 씁니다."""
    nouns = {}
    with open(path, encoding='cp949') as f:
        for line in f:
            cols = line.rstrip('\r\n').split('\t')
            if len(cols) >= 5 and cols[2] == '명' and cols[4] in GRADES:
                word = re.sub(r'\d+$', '', cols[1])
                nouns[word] = min(nouns.get(word, 'C'), cols[4])
    return nouns


def main(src, learner, dst):
    valid = {n: set() for n in LENGTHS}
    for text in pq.read_table(src, columns=['text']).column('text').to_pylist():
        m = HEAD.match(text)
        if not m or m.group(1).startswith('-') or m.group(1).endswith('-'):
            continue  # 구/속담/관용구, 접사·어미 제외
        word = re.sub(r'\(\d+\)$', '', m.group(1)).replace('-', '').replace('^', '')
        if HANGUL.match(word) and len(jamo(word)) in valid:
            valid[len(jamo(word))].add(word)

    nouns = learner_nouns(learner)

    # 정답 후보: 학습용 어휘 목록의 명사 중 사전에 있는 단어
    # 정답 목록 순서가 바뀌면 같은 날짜·번호의 문제가 달라지므로 정렬해 고정합니다.
    with open(dst, 'w', encoding='utf-8') as f:
        f.write('// 자동 생성 파일입니다. tools/build_words.py로 다시 만드세요.\n')
        f.write('// 출처: 국립국어원 표준국어대사전 (CC BY-SA), 한국어 학습용 어휘 목록\n')
        f.write('const WORDS = {\n')
        for n in LENGTHS:
            f.write(f'  {n}: {{\n')
            counts = []
            for g in GRADES:
                answers = sorted(w for w in valid[n] if nouns.get(w) == g)
                f.write(f'    {g}: "{" ".join(answers)}".split(" "),\n')
                counts.append(f'{g}={len(answers)}')
            f.write(f'    valid: "{" ".join(sorted(valid[n]))}".split(" "),\n')
            f.write('  },\n')
            print(n, *counts, f'valid={len(valid[n])}')
        f.write('};\n')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'words.js')

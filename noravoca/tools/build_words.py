"""표준국어대사전 parquet에서 자모 5개 단어를 뽑아 words.js를 생성합니다.

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


HEAD = re.compile(r'^어휘: ([^,]+), 구성 단위: 단어,')
HANGUL = re.compile(r'^[가-힣]+$')


def learner_nouns(path):
    """학습용 어휘 목록에서 명사만 뽑습니다. 줄 형식: 순위\t단어\t품사\t풀이\t등급"""
    nouns = set()
    with open(path, encoding='cp949') as f:
        for line in f:
            cols = line.rstrip('\r\n').split('\t')
            if len(cols) >= 3 and cols[2] == '명':
                nouns.add(re.sub(r'\d+$', '', cols[1]))
    return nouns


def main(src, learner, dst):
    valid = set()
    for text in pq.read_table(src, columns=['text']).column('text').to_pylist():
        m = HEAD.match(text)
        if not m or m.group(1).startswith('-') or m.group(1).endswith('-'):
            continue  # 구/속담/관용구, 접사·어미 제외
        word = re.sub(r'\(\d+\)$', '', m.group(1)).replace('-', '').replace('^', '')
        if not HANGUL.match(word) or len(jamo(word)) != 5:
            continue
        valid.add(word)

    # 정답 후보: 학습용 어휘 목록의 명사 중 사전에 있는 자모 5개 단어
    answers = learner_nouns(learner) & valid

    # 정답 목록 순서가 바뀌면 같은 날짜·번호의 문제가 달라지므로 정렬해 고정합니다.
    with open(dst, 'w', encoding='utf-8') as f:
        f.write('// 자동 생성 파일입니다. tools/build_words.py로 다시 만드세요.\n')
        f.write('// 출처: 국립국어원 표준국어대사전 (CC BY-SA), 한국어 학습용 어휘 목록\n')
        f.write(f'const ANSWERS = "{" ".join(sorted(answers))}".split(" ");\n')
        f.write(f'const VALID = "{" ".join(sorted(valid))}".split(" ");\n')
    print(f'answers={len(answers)} valid={len(valid)}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'words.js')

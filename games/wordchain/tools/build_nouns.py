"""표준국어대사전 parquet에서 끝말잇기용 명사 목록(nouns.js)을 생성합니다.

사용법: python build_nouns.py <stdict.parquet 경로>
출력: ../nouns.js (사전 전체 명사), ../../words_common.js (쉬운 명사, 여러 게임 공용)
데이터: https://huggingface.co/datasets/hac541309/stdict_kor (표준국어대사전, CC BY-SA)
컴퓨터가 내는 쉬운 단어는 ../../noravoca/words.js의 정답 목록(한국어 학습용 어휘 명사)을 씁니다.
필요 패키지: pyarrow
"""
import os
import re
import sys

import pyarrow.parquet as pq

HEAD = re.compile(r'^어휘: ([^,]+), 구성 단위: 단어,')
HANGUL = re.compile(r'^[가-힣]{2,}$')  # 두 글자 이상 한글만
NOUN = '「명사」'  # '「의존 명사」'는 포함하지 않음
CATEGORY = re.compile(r'범주: ([^,]*)')


def main(src, dst, common_dst):
    nouns = set()
    for text in pq.read_table(src, columns=['text']).column('text').to_pylist():
        m = HEAD.match(text)
        if not m or NOUN not in text:
            continue
        cat = CATEGORY.search(text)
        if cat and '일반어' not in cat.group(1):
            continue  # 방언·북한어·옛말 제외
        word = re.sub(r'\(\d+\)$', '', m.group(1)).replace('-', '').replace('^', '')
        if HANGUL.match(word):
            nouns.add(word)

    # 컴퓨터용 쉬운 단어: 자모 맞추기 정답 목록(A·B·C 등급) 중 사전 명사에 있는 것
    words_js = os.path.join(os.path.dirname(__file__), '..', '..', 'noravoca', 'words.js')
    with open(words_js, encoding='utf-8') as f:
        lists = re.findall(r'^\s+[ABC]: "([^"]*)"', f.read(), re.M)
    common = sorted({w for s in lists for w in s.split(' ')} & nouns)

    head = ('// 자동 생성 파일입니다. wordchain/tools/build_nouns.py로 다시 만드세요.\n'
            '// 출처: 국립국어원 표준국어대사전 (CC BY-SA), 한국어 학습용 어휘 목록\n')
    with open(dst, 'w', encoding='utf-8') as f:
        f.write(head + f'const NOUNS = "{" ".join(sorted(nouns))}".split(" ");\n')
    # 쉬운 명사는 단어 찾기 등 다른 게임도 쓰므로 games/ 바로 아래에 따로 둡니다.
    # 순서가 바뀌면 단어 찾기의 같은 날짜·번호 판이 달라지므로 정렬해 고정합니다.
    with open(common_dst, 'w', encoding='utf-8') as f:
        f.write(head + f'const COMMON = "{" ".join(common)}".split(" ");\n')
    print(f'nouns={len(nouns)} common={len(common)}')


if __name__ == '__main__':
    here = os.path.dirname(__file__)
    main(sys.argv[1], os.path.join(here, '..', 'nouns.js'), os.path.join(here, '..', '..', 'words_common.js'))

#!/usr/bin/env python3
"""Audit <err>-marked i18n resource lines against zh_CN baselines.

This helper intentionally does not translate. It reports the scope of marked
lines and validates that edited lines preserve HTML tag sequences.
"""

from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path


def decode(data: bytes, encoding: str) -> str:
    return data.decode(encoding)


def read_file(path: Path, encoding: str) -> str:
    return decode(path.read_bytes(), encoding)


def git_show(commit: str, path: Path, encoding: str) -> str:
    return decode(subprocess.check_output(['git', 'show', f'{commit}:{path.as_posix()}']), encoding)


def iter_properties_entries(text: str):
    current = []
    start = 0
    for lineno, line in enumerate(text.splitlines(), 1):
        if current:
            current.append(line)
        else:
            current = [line]
            start = lineno
        slash_count = len(line) - len(line.rstrip('\\'))
        if slash_count % 2 == 0:
            raw = '\n'.join(current)
            match = re.match(r'([^#!\s][^=:\s]*)\s*=\s*(.*)', raw, re.S)
            if match:
                yield match.group(1), match.group(2).split('\n'), start
            current = []


def tag_sequence(line: str) -> list[str]:
    clean = line.replace(' <err>', '').replace('<err>', '')
    return re.findall(r'<[^>]+>', clean)


def zh_baseline_for(path: Path) -> Path:
    name = path.name
    replaced = re.sub(r'_[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)?(?=\.)', '_zh_CN', name)
    return path.with_name(replaced)


def marked_files(lang_dir: Path, encoding: str) -> list[Path]:
    return sorted(path for path in lang_dir.glob('*') if path.is_file() and b'<err>' in path.read_bytes())


def report_current(lang_dir: Path, encoding: str) -> int:
    total = 0
    for path in marked_files(lang_dir, encoding):
        text = read_file(path, encoding)
        print(f'\n## {path.name}')
        zh_path = zh_baseline_for(path)
        zh_entries = {}
        if zh_path.exists():
            zh_entries = {key: (lines, start) for key, lines, start in iter_properties_entries(read_file(zh_path, encoding))}
        for key, lines, start in iter_properties_entries(text):
            if '<err>' not in '\n'.join(lines):
                continue
            zh_lines, _ = zh_entries.get(key, ([], 0))
            for offset, line in enumerate(lines):
                if '<err>' not in line:
                    continue
                total += 1
                print(f'{start + offset}: {key} line+{offset}')
                if offset < len(zh_lines):
                    print(f'  zh: {zh_lines[offset]}')
                print(f'  to: {line}')
    print(f'\ntotal_err_lines {total}')
    return 0


def report_commit(lang_dir: Path, commit: str, encoding: str) -> int:
    output = subprocess.check_output(['git', 'show', '--name-only', '--format=', commit], text=True)
    total = 0
    for raw in output.splitlines():
        path = Path(raw)
        if not raw or path.name.endswith('_zh_CN.properties'):
            continue
        if path.parent != lang_dir:
            continue
        try:
            text = git_show(commit, path, encoding)
        except subprocess.CalledProcessError:
            continue
        if '<err>' not in text:
            continue
        print(f'\n## {path.name}')
        for key, lines, start in iter_properties_entries(text):
            if '<err>' not in '\n'.join(lines):
                continue
            for offset, line in enumerate(lines):
                if '<err>' in line:
                    total += 1
                    print(f'{start + offset}: {key} line+{offset}')
    print(f'\ntotal_err_lines {total}')
    return 0


def validate(lang_dir: Path, commit: str, encoding: str) -> int:
    output = subprocess.check_output(['git', 'show', '--name-only', '--format=', commit], text=True)
    remaining = sum(path.read_bytes().count(b'<err>') for path in lang_dir.glob('*') if path.is_file())
    mismatches = []
    decode_failures = []
    for raw in output.splitlines():
        path = Path(raw)
        if not raw or path.parent != lang_dir or not (lang_dir / path.name).exists():
            continue
        current_path = lang_dir / path.name
        try:
            current = read_file(current_path, encoding).splitlines()
        except UnicodeDecodeError as exc:
            decode_failures.append(f'{current_path}:{exc}')
            continue
        try:
            original = git_show(commit, path, encoding).splitlines()
        except subprocess.CalledProcessError:
            continue
        for index, line in enumerate(original, 1):
            if '<err>' not in line:
                continue
            if index > len(current) or tag_sequence(line) != tag_sequence(current[index - 1]):
                mismatches.append(f'{path}:{index}')
    print(f'err_markers {remaining}')
    print(f'gb_decode_failures {len(decode_failures)}')
    print(f'html_tag_mismatches {len(mismatches)}')
    for item in decode_failures + mismatches:
        print(item)
    return 1 if remaining or decode_failures or mismatches else 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--lang-dir', required=True, type=Path)
    parser.add_argument('--commit')
    parser.add_argument('--encoding', default='gb18030')
    parser.add_argument('--mode', choices=['report', 'validate'], default='report')
    args = parser.parse_args()

    lang_dir = args.lang_dir
    if args.mode == 'validate':
        if not args.commit:
            parser.error('--commit is required for validate')
        return validate(lang_dir, args.commit, args.encoding)
    if args.commit:
        return report_commit(lang_dir, args.commit, args.encoding)
    return report_current(lang_dir, args.encoding)


if __name__ == '__main__':
    raise SystemExit(main())

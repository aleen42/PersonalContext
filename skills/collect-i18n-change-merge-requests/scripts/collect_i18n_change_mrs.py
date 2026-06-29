#!/usr/bin/env python3
"""Collect whitespace-prefixed !MR ids behind i18n diff keys."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass


DEFAULT_LOCALES = (
    'ar',
    'bn',
    'es',
    'fr_FR',
    'in',
    'ja',
    'ko',
    'lo',
    'ms',
    'pt',
    'ru',
    'th',
    'tr',
    'ug',
    'vi',
)


DEFAULT_EXTENSIONS = (
    'cf',
    'eml',
    'html',
    'jsp',
    'letter',
    'properties',
    'txt',
    'js',
)


@dataclass
class ResourceMatch:
    file_path: str
    group: str
    source: str


@dataclass
class GroupResult:
    group: str
    representative: str
    source: str
    strategy: str
    changed_keys: list[str]
    changed_lines: list[int]
    blame_commits: list[str]
    ids: list[str]
    missing_keys: list[str]
    missing_lines: list[int]


def run_git(args: list[str]) -> str:
    result = subprocess.run(
        ['git', *args],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return result.stdout.decode('utf-8', errors='replace')


def changed_files(commit: str) -> list[str]:
    output = run_git(['show', '--name-only', '--format=', commit])
    return [line for line in output.splitlines() if line.strip()]


def locale_tokens(locales: tuple[str, ...]) -> dict[str, str]:
    tokens: dict[str, str] = {}
    for locale in locales:
        new_locale = {'in' : 'id', 'he' : 'iw', 'yi' : 'ji'}.get(locale, locale)
        for token in {locale, new_locale, locale.replace('_', '-'), new_locale.replace('_', '-')}:
            tokens[token] = locale
    return dict(sorted(tokens.items(), key=lambda item: len(item[0]), reverse=True))


def match_resource(file_path: str, tokens: dict[str, str], extensions: tuple[str, ...]) -> ResourceMatch | None:
    for extension in extensions:
        ext = extension.lstrip('.')
        for token in tokens:
            suffix = f'_{token}.{ext}'
            if file_path.endswith(suffix):
                prefix = file_path[:-len(suffix)]
                return ResourceMatch(
                    file_path=file_path,
                    group=f'{prefix}_<lang>.{ext}',
                    source=f'{prefix}_zh_CN.{ext}',
                )

            basename = f'{token}.{ext}'
            if ext == 'js' and file_path.endswith(basename):
                prefix = file_path[:-len(basename)]
                if prefix.endswith('_'):
                    continue
                return ResourceMatch(
                    file_path=file_path,
                    group=f'{prefix}<lang>.{ext}',
                    source=f'{prefix}zh-CN.{ext}',
                )
    return None


def group_language_files(files: list[str], locales: tuple[str, ...], extensions: tuple[str, ...]) -> dict[str, list[ResourceMatch]]:
    groups: dict[str, list[ResourceMatch]] = {}
    tokens = locale_tokens(locales)
    for file_path in files:
        matched = match_resource(file_path, tokens, extensions)
        if not matched:
            continue
        groups.setdefault(matched.group, []).append(matched)
    return groups


def changed_property_keys(commit: str, file_path: str) -> list[str]:
    output = run_git(['show', '--unified=0', '--format=', commit, '--', file_path])
    keys: list[str] = []
    seen: set[str] = set()
    for line in output.splitlines():
        if not line.startswith('+') or line.startswith('+++'):
            continue
        match = re.match(r'^([^#!\s:=][^:=]*?)\s*[:=]', line[1:])
        if not match:
            continue
        key = match.group(1).strip()
        if key not in seen:
            keys.append(key)
            seen.add(key)
    return keys


def changed_line_numbers(commit: str, file_path: str) -> list[int]:
    output = run_git(['show', '--unified=0', '--format=', commit, '--', file_path])
    line_numbers: list[int] = []
    new_line = 0
    for line in output.splitlines():
        hunk = re.match(r'^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@', line)
        if hunk:
            new_line = int(hunk.group(1))
            continue
        if line.startswith('+++') or line.startswith('---') or line.startswith('diff ') or line.startswith('index '):
            continue
        if line.startswith('+'):
            line_numbers.append(new_line)
            new_line += 1
        elif line.startswith(' '):
            new_line += 1
    return sorted(set(line_numbers))


def line_for_key(file_path: str, key: str) -> int | None:
    if not os.path.exists(file_path):
        return None
    key_pattern = re.compile(rf'^{re.escape(key)}\s*[:=]')
    with open(file_path, 'r', encoding='utf-8', errors='replace') as handle:
        for index, line in enumerate(handle, start=1):
            if key_pattern.search(line):
                return index
    return None


def file_line_count(file_path: str) -> int:
    if not os.path.exists(file_path):
        return 0
    with open(file_path, 'r', encoding='utf-8', errors='replace') as handle:
        return sum(1 for _ in handle)


def blame_commit(file_path: str, line: int) -> str | None:
    output = run_git(['blame', '-L', f'{line},{line}', '--', file_path])
    token = output.split(maxsplit=1)[0] if output.strip() else ''
    return token.lstrip('^') or None


def commit_message(commit: str) -> str:
    return run_git(['show', '-s', '--format=%B', commit])


def unique_sorted_ids(ids: list[str]) -> list[str]:
    return sorted(set(ids), key=lambda value: int(value[1:]))


def files_by_id(results: list[GroupResult]) -> dict[str, list[str]]:
    mapping: dict[str, list[str]] = {}
    for result in results:
        for mr_id in result.ids:
            mapping.setdefault(mr_id, []).append(result.group)
    return {
        mr_id : sorted(set(files))
        for mr_id, files in sorted(mapping.items(), key=lambda item: int(item[0][1:]))
    }


def collect(commit: str, locales: tuple[str, ...], extensions: tuple[str, ...]) -> tuple[list[GroupResult], list[str]]:
    groups = group_language_files(changed_files(commit), locales, extensions)
    results: list[GroupResult] = []
    all_ids: list[str] = []

    for group_name in sorted(groups):
        representative_match = sorted(groups[group_name], key=lambda item: item.file_path)[0]
        representative = representative_match.file_path
        source = representative_match.source
        is_properties = representative.endswith('.properties')
        strategy = 'property-key' if is_properties else 'line-number'
        keys = changed_property_keys(commit, representative) if is_properties else []
        lines = [] if is_properties else changed_line_numbers(commit, representative)
        commits: list[str] = []
        missing_keys: list[str] = []
        missing_lines: list[int] = []

        if is_properties:
            for key in keys:
                line = line_for_key(source, key)
                if line is None:
                    missing_keys.append(key)
                    continue
                blamed = blame_commit(source, line)
                if blamed and blamed not in commits:
                    commits.append(blamed)
        else:
            max_line = file_line_count(source)
            for line in lines:
                if line > max_line:
                    missing_lines.append(line)
                    continue
                blamed = blame_commit(source, line)
                if blamed and blamed not in commits:
                    commits.append(blamed)

        ids: list[str] = []
        for blamed in commits:
            ids.extend(re.findall(r'(?<=\s)!\d+', commit_message(blamed)))
        ids = unique_sorted_ids(ids)
        all_ids.extend(ids)
        results.append(GroupResult(
            group=group_name,
            representative=representative,
            source=source,
            strategy=strategy,
            changed_keys=keys,
            changed_lines=lines,
            blame_commits=commits,
            ids=ids,
            missing_keys=missing_keys,
            missing_lines=missing_lines,
        ))

    return results, unique_sorted_ids(all_ids)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('commit', help='Git commit to analyze, for example HEAD or a SHA.')
    parser.add_argument(
        '--locales',
        default=','.join(DEFAULT_LOCALES),
        help='Comma-separated locale suffixes to treat as translated files.',
    )
    parser.add_argument(
        '--extensions',
        default=','.join(DEFAULT_EXTENSIONS),
        help='Comma-separated file extensions to treat as translated resources.',
    )
    parser.add_argument('--json', action='store_true', help='Emit machine-readable JSON.')
    parser.add_argument('--no-groups', action='store_true', help='Only print the final deduplicated id list.')
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    locales = tuple(locale.strip() for locale in args.locales.split(',') if locale.strip())
    extensions = tuple(extension.strip().lstrip('.') for extension in args.extensions.split(',') if extension.strip())
    results, all_ids = collect(args.commit, locales, extensions)
    id_files = files_by_id(results)

    if args.json:
        payload = {
            'commit' : args.commit,
            'strict_pattern' : r'(?<=\s)!\d+',
            'ids' : all_ids,
            'count' : len(all_ids),
            'files_by_id' : id_files,
            'groups' : [result.__dict__ for result in results],
        }
        print(json.dumps(payload, ensure_ascii=False, indent=4))
        return 0

    if not args.no_groups:
        for result in results:
            print(f'FILE\t{result.group}')
            print(f'  representative\t{result.representative}')
            print(f'  source\t{result.source}')
            print(f'  strategy\t{result.strategy}')
            print(f'  ids\t{" ".join(result.ids)}')
            if result.missing_keys:
                print(f'  missing_keys: {", ".join(result.missing_keys)}', file=sys.stderr)
            if result.missing_lines:
                print(f'  missing_lines: {", ".join(str(line) for line in result.missing_lines)}', file=sys.stderr)

    print(f'ALL\t{" ".join(all_ids)}')
    print(f'COUNT\t{len(all_ids)}')
    if not args.no_groups:
        print('FILES_BY_ID')
        for mr_id, files in id_files.items():
            print(f'{mr_id}\t{", ".join(files)}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

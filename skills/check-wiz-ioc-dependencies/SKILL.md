---
name: check-wiz-ioc-dependencies
description: Use when checking a Node.js repository, monorepo, npm workspace, package.json directory, node_modules tree, npm-shrinkwrap.json, or package-lock.json against the latest Wiz keyv-packages IOC CSV for malicious dependency versions.
---

# Check Wiz IOC Dependencies

## Overview

Use this skill to compare local Node dependency state against the latest Wiz `keyv-packages.csv` IOC data. Always fetch the current CSV from Wiz unless the user explicitly provides a local CSV for offline or historical verification.

Default IOC source:

```text
https://github.com/wiz-sec-public/wiz-research-iocs/blob/main/reports/keyv-packages.csv
```

The bundled script converts that GitHub page URL to the raw CSV URL before scanning.

## Workflow

1. Run the bundled scanner from the repository root. By default it downloads the latest Wiz IOC CSV:

```bash
node /path/to/check-wiz-ioc-dependencies/scripts/check_wiz_ioc_dependencies.cjs --root .
```

2. If downloading fails because of network sandboxing, rerun the same command with escalation.
3. Use `--csv /path/to/keyv-packages.csv` only when the user explicitly asks for a local, pinned, or offline CSV check.
4. Report matches first. Include package name, malicious version, source type, and path.
5. If there are no matches, say that no malicious package/version pairs were found in the scanned installed packages or lockfiles. Mention that the scan fetched the latest Wiz CSV and used current `node_modules` and lockfiles without reinstalling.

## Scope

The scanner checks:

* non-`node_modules` directories containing `package.json`;
* all reachable `node_modules` install trees;
* `npm-shrinkwrap.json` and `package-lock.json` outside `node_modules`;
* lockfile v2/v3 `packages` and old `dependencies` structures;
* direct dependency declarations whose package names appear in the IOC CSV.

It does not run package managers or mutate the repository.

## Interpretation

* `installedMatches` means a malicious package/version exists in local installed dependencies.
* `lockMatches` means a malicious package/version exists in shrinkwrap/package-lock and may install reproducibly.
* `declarationHits` means a direct dependency name is in the IOC list, but the declared spec must be resolved before deciding whether the version is malicious.
* No matches does not prove remote registries are safe; it only covers the scanned local state and lockfiles.

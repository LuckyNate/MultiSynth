#!/usr/bin/env python3
import json
import os
import re
import subprocess
import urllib.request
from pathlib import Path

repo = os.environ["REPOSITORY"]
current_sha = os.environ["CURRENT_SHA"]
current_run = int(os.environ["RUN_NUMBER"])
token = os.environ["GH_TOKEN"]

# Catch-up release notes intentionally begin with the first successful build
# made by this system. Older repository/build history is not imported.
# This commit is the epoch: future builds may include successful builds at or
# after it, while the epoch build itself contains only its own notes.
RELEASE_NOTES_EPOCH_SHA = "7f85c8998ea875538b4755634cca0650d0ab9718"

headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

runs = []
page = 1
while True:
    req = urllib.request.Request(
        f"https://api.github.com/repos/{repo}/actions/workflows/build-apk.yml/runs?branch=main&status=success&per_page=100&page={page}",
        headers=headers,
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            batch = json.load(response).get("workflow_runs", [])
    except Exception as exc:
        print(f"Release-note history lookup failed on page {page}: {exc}")
        break
    runs.extend(batch)
    if len(batch) < 100:
        break
    page += 1

# Only successful builds produced after the release-note epoch participate in
# catch-up notes. Never walk backward into the old repository history.
history = []
seen_runs = set()
for run in runs:
    number = int(run.get("run_number") or 0)
    sha = run.get("head_sha")
    if not number or not sha or number >= current_run or number in seen_runs:
        continue
    is_after_epoch = subprocess.run(
        ["git", "merge-base", "--is-ancestor", RELEASE_NOTES_EPOCH_SHA, sha],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    ).returncode == 0
    if not is_after_epoch:
        continue
    seen_runs.add(number)
    history.append({"build": number, "sha": sha})
history.sort(key=lambda x: x["build"])
history.append({"build": current_run, "sha": current_sha})

friendly_verbs = {
    "add": "Added", "fix": "Fixed", "update": "Updated", "replace": "Replaced",
    "remove": "Removed", "simplify": "Simplified", "register": "Registered",
    "wire": "Wired", "style": "Styled", "scale": "Scaled", "align": "Aligned",
    "make": "Made", "give": "Gave", "show": "Now showing", "generate": "Generated",
    "use": "Used", "rework": "Reworked", "build": "Built", "keep": "Kept",
}

def friendly(subject):
    s = re.sub(r"^(feat|fix|chore|refactor|style|docs|test)(\([^)]*\))?:\s*", "", subject, flags=re.I).strip()
    parts = s.split(None, 1)
    if parts:
        replacement = friendly_verbs.get(parts[0].lower())
        if replacement:
            s = replacement + (" " + parts[1] if len(parts) > 1 else "")
    if s:
        s = s[0].upper() + s[1:]
    if s and s[-1] not in ".!?":
        s += "."
    return s

def subjects_between(previous_sha, sha):
    if previous_sha:
        rev_range = f"{previous_sha}..{sha}"
        subjects = subprocess.check_output(["git", "log", "--reverse", "--format=%s", rev_range], text=True).splitlines()
    else:
        # The epoch/current first build deliberately starts here, not at any
        # older successful build.
        subjects = [subprocess.check_output(["git", "show", "-s", "--format=%s", sha], text=True).strip()]
    return [s.strip() for s in subjects if s.strip()]

notes = []
previous_sha = None
for item in history:
    build = item["build"]
    sha = item["sha"]
    try:
        subjects = subjects_between(previous_sha, sha)
    except Exception as exc:
        print(f"Could not read commit subjects for build {build}: {exc}")
        subjects = []
    updates = [friendly(s) for s in subjects]
    if not updates:
        updates = ["Maintenance build."]
    notes.append({
        "id": f"build-{build}-{sha[:12]}",
        "build": build,
        "title": f"BUILD {build}",
        "lines": updates,
    })
    previous_sha = sha

payload = (
    '"use strict";\n(function(global){\n'
    f'  global.MultiSynthReleaseBuild={current_run};\n'
    '  global.MultiSynthReleaseNotes=Object.freeze('
    + json.dumps(notes, ensure_ascii=False)
    + '.map(Object.freeze));\n})(window);\n'
)
Path("app/src/main/assets/release-notes.js").write_text(payload, encoding="utf-8")
print(f"Generated {len(notes)} catch-up build note section(s), through build {current_run}")

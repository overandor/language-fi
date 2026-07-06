#!/usr/bin/env python3
"""
agentic_web_cube_indexer.py

A small, real, stdlib-only first implementation of the Agentic Web Cube Indexer.

It does not "browse like a bot army." It disassembles authorized local repo files
and explicitly supplied public URLs into bounded function-cubes with evidence,
policy state, side-effect level, route metadata, and a conservative value score.

Outputs:
  - agentic-web-cube-indexer.surfaces.jsonl
  - agentic-web-cube-indexer.cubes.jsonl
  - agentic-web-cube-indexer.edges.jsonl
  - agentic-web-cube-indexer.routes.jsonl
  - agentic-web-cube-indexer.report.md

Design rules:
  - Read-only by default.
  - No login bypass.
  - No captcha bypass.
  - No secret collection.
  - No personal-data extraction by default.
  - State-changing cubes are detection-only and require human approval.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import json
import os
import re
import urllib.parse
import urllib.request
import urllib.robotparser
from dataclasses import asdict, dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple


SAFE_TEXT_EXTENSIONS = {
    ".astro",
    ".css",
    ".csv",
    ".html",
    ".js",
    ".json",
    ".jsx",
    ".md",
    ".mdx",
    ".mjs",
    ".py",
    ".rs",
    ".sql",
    ".svg",
    ".toml",
    ".ts",
    ".tsx",
    ".txt",
    ".vue",
    ".yaml",
    ".yml",
}

DEFAULT_EXCLUDED_DIRS = {
    ".git",
    ".hg",
    ".svn",
    ".next",
    ".turbo",
    ".venv",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "__pycache__",
}

SIDE_EFFECT_INFORMATION = 0
SIDE_EFFECT_NAVIGATION = 1
SIDE_EFFECT_DRAFT = 2
SIDE_EFFECT_TRANSACTION = 3


def utc_now() -> str:
    return _dt.datetime.now(tz=_dt.timezone.utc).isoformat(timespec="seconds")


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8", errors="replace")).hexdigest()


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def short_hash(value: str, n: int = 16) -> str:
    return sha256_text(value)[:n]


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def json_dumps(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def write_jsonl(path: Path, rows: Iterable[Dict[str, Any]]) -> None:
    ensure_dir(path.parent)
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json_dumps(row) + "\n")


def read_text_limited(path: Path, max_bytes: int) -> Tuple[str, str]:
    data = path.read_bytes()[:max_bytes]
    digest = sha256_bytes(data)
    return data.decode("utf-8", errors="replace"), digest


def is_url(seed: str) -> bool:
    parsed = urllib.parse.urlparse(seed)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def normalize_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    parsed = parsed._replace(fragment="")
    return urllib.parse.urlunparse(parsed)


@dataclass
class Surface:
    surface_id: str
    surface_type: str
    url_or_path: str
    owner_scope: str
    visibility: str
    last_seen_at: str
    content_hash: str
    status: str = "observed"
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Cube:
    cube_id: str
    surface_id: str
    capability_type: str
    human_label: str
    inputs: Dict[str, Any]
    outputs: Dict[str, Any]
    preconditions: List[str]
    postconditions: List[str]
    evidence: Dict[str, Any]
    policy: Dict[str, Any]
    risk: Dict[str, Any]
    agent_affordance: Dict[str, Any]
    side_effect_level: int
    cube_value_usd: float
    created_at: str


@dataclass
class Edge:
    edge_id: str
    from_cube: str
    to_cube: str
    edge_type: str
    reason: str
    confidence: float


@dataclass
class Route:
    route_id: str
    cube_id: str
    agent_intent: str
    route_score: float
    outcome: str
    reason: str


class HtmlCapabilityParser(HTMLParser):
    def __init__(self, base_url: str) -> None:
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.title_parts: List[str] = []
        self.in_title = False
        self.headings: List[Dict[str, str]] = []
        self._heading_tag: Optional[str] = None
        self._heading_text: List[str] = []
        self.links: List[Dict[str, str]] = []
        self.forms: List[Dict[str, Any]] = []
        self.buttons: List[str] = []
        self.tables = 0
        self.meta: Dict[str, str] = {}
        self.text_chunks: List[str] = []

    def handle_starttag(self, tag: str, attrs: Sequence[Tuple[str, Optional[str]]]) -> None:
        attr = {k.lower(): v or "" for k, v in attrs}
        tag = tag.lower()

        if tag == "title":
            self.in_title = True
        elif tag in {"h1", "h2", "h3"}:
            self._heading_tag = tag
            self._heading_text = []
        elif tag == "a":
            href = attr.get("href", "")
            if href:
                self.links.append(
                    {
                        "href": normalize_url(urllib.parse.urljoin(self.base_url, href)),
                        "text": "",
                    }
                )
        elif tag == "form":
            self.forms.append(
                {
                    "method": (attr.get("method") or "GET").upper(),
                    "action": normalize_url(urllib.parse.urljoin(self.base_url, attr.get("action", ""))),
                    "name": attr.get("name") or attr.get("id") or "",
                }
            )
        elif tag == "button":
            label = attr.get("aria-label") or attr.get("title") or attr.get("name") or "button"
            self.buttons.append(label)
        elif tag == "table":
            self.tables += 1
        elif tag == "meta":
            name = attr.get("name") or attr.get("property")
            content = attr.get("content")
            if name and content:
                self.meta[name] = content

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "title":
            self.in_title = False
        elif tag == self._heading_tag:
            text = " ".join("".join(self._heading_text).split())
            if text:
                self.headings.append({"level": tag, "text": text})
            self._heading_tag = None
            self._heading_text = []

    def handle_data(self, data: str) -> None:
        clean = " ".join(data.split())
        if not clean:
            return
        if self.in_title:
            self.title_parts.append(clean)
        if self._heading_tag:
            self._heading_text.append(clean)
        if len(clean) > 20:
            self.text_chunks.append(clean)

    @property
    def title(self) -> str:
        return " ".join(self.title_parts).strip()


class AgenticWebCubeIndexer:
    def __init__(
        self,
        output_dir: Path,
        max_file_bytes: int = 500_000,
        max_repo_files: int = 500,
        max_url_bytes: int = 1_000_000,
        timeout_seconds: float = 10.0,
        user_agent: str = "LanguageFiAgenticWebCubeIndexer/0.1 (+read-only metadata indexing)",
    ) -> None:
        self.output_dir = output_dir
        self.max_file_bytes = max_file_bytes
        self.max_repo_files = max_repo_files
        self.max_url_bytes = max_url_bytes
        self.timeout_seconds = timeout_seconds
        self.user_agent = user_agent
        self.surfaces: List[Surface] = []
        self.cubes: List[Cube] = []
        self.edges: List[Edge] = []
        self.routes: List[Route] = []
        self._cube_ids_by_surface: Dict[str, List[str]] = {}

    def index_seed(self, seed: str) -> None:
        if is_url(seed):
            self.index_url(seed)
            return

        path = Path(seed).expanduser().resolve()
        if path.is_dir():
            self.index_repo_path(path)
        elif path.is_file():
            self.index_file(path, owner_scope="local_file")
        else:
            self._add_error_surface(seed, f"Seed does not exist and is not a URL: {seed}")

    def index_repo_path(self, root: Path) -> None:
        count = 0
        for file_path in self._iter_repo_files(root):
            if count >= self.max_repo_files:
                break
            self.index_file(file_path, owner_scope=f"repo:{root.name}", root=root)
            count += 1

    def index_file(self, file_path: Path, owner_scope: str, root: Optional[Path] = None) -> None:
        try:
            text, digest = read_text_limited(file_path, self.max_file_bytes)
        except OSError as exc:
            self._add_error_surface(str(file_path), f"Cannot read file: {exc}")
            return

        rel = str(file_path.relative_to(root)) if root else str(file_path)
        surface_type = self._surface_type_for_file(file_path)
        surface = self._add_surface(
            surface_type=surface_type,
            url_or_path=rel,
            owner_scope=owner_scope,
            visibility="local",
            content_hash=digest,
            metadata={"bytes_indexed_limit": self.max_file_bytes},
        )

        if file_path.name == "package.json":
            self._extract_package_json_cubes(surface, text)
        elif file_path.suffix.lower() in {".md", ".mdx", ".txt"}:
            self._extract_markdown_cubes(surface, text)
        elif file_path.suffix.lower() in {".html", ".htm"}:
            self._extract_html_cubes(surface, text, base_url=f"file://{file_path}")
        elif file_path.suffix.lower() in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".py", ".rs"}:
            self._extract_code_cubes(surface, text, file_path)
        elif file_path.suffix.lower() in {".json", ".toml", ".yaml", ".yml"}:
            self._extract_config_cubes(surface, text, file_path)
        else:
            self._add_information_cube(
                surface=surface,
                label=f"Read {rel}",
                outputs={"text_hash": digest, "max_bytes": self.max_file_bytes},
                intent="read local file metadata and content hash",
                snippet=text[:400],
            )

    def index_url(self, url: str) -> None:
        url = normalize_url(url)
        if not self._robots_allows(url):
            surface = self._add_surface(
                surface_type="web_page",
                url_or_path=url,
                owner_scope="public_url",
                visibility="blocked_by_robots",
                content_hash=short_hash(url),
                status="policy_blocked",
                metadata={"reason": "robots.txt disallowed fetch"},
            )
            self._add_policy_blocked_cube(surface, "Robots policy blocked URL fetch")
            return

        try:
            request = urllib.request.Request(url, headers={"User-Agent": self.user_agent})
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                raw = response.read(self.max_url_bytes)
                status_code = getattr(response, "status", None) or response.getcode()
                content_type = response.headers.get("content-type", "")
                final_url = normalize_url(response.geturl())
        except Exception as exc:
            surface = self._add_surface(
                surface_type="web_page",
                url_or_path=url,
                owner_scope="public_url",
                visibility="public_unknown",
                content_hash=short_hash(url),
                status="fetch_error",
                metadata={"error": str(exc)},
            )
            self._add_policy_blocked_cube(surface, f"URL fetch failed: {exc}")
            return

        digest = sha256_bytes(raw)
        text = raw.decode("utf-8", errors="replace")
        surface = self._add_surface(
            surface_type="web_page",
            url_or_path=final_url,
            owner_scope="public_url",
            visibility="public",
            content_hash=digest,
            metadata={
                "status_code": status_code,
                "content_type": content_type,
                "bytes_indexed": len(raw),
            },
        )

        if "html" in content_type.lower() or "<html" in text[:1000].lower():
            self._extract_html_cubes(surface, text, base_url=final_url)
        else:
            self._add_information_cube(
                surface=surface,
                label=f"Read public resource {final_url}",
                outputs={"content_type": content_type, "content_hash": digest},
                intent="read public URL content metadata",
                snippet=text[:500],
            )

    def _iter_repo_files(self, root: Path) -> Iterable[Path]:
        for current_root, dirs, files in os.walk(root):
            dirs[:] = [d for d in dirs if d not in DEFAULT_EXCLUDED_DIRS and not d.startswith(".cache")]
            for file_name in files:
                file_path = Path(current_root) / file_name
                if file_path.suffix.lower() in SAFE_TEXT_EXTENSIONS:
                    yield file_path

    def _surface_type_for_file(self, file_path: Path) -> str:
        name = file_path.name.lower()
        suffix = file_path.suffix.lower()
        if name in {"package.json", "vite.config.ts", "vite.config.js", "next.config.js", "tsconfig.json"}:
            return "repository_config"
        if suffix in {".md", ".mdx", ".txt"}:
            return "document"
        if suffix in {".html", ".htm"}:
            return "web_page"
        if suffix in {".json", ".toml", ".yaml", ".yml"}:
            return "config"
        return "repository_file"

    def _add_surface(
        self,
        surface_type: str,
        url_or_path: str,
        owner_scope: str,
        visibility: str,
        content_hash: str,
        status: str = "observed",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Surface:
        payload = f"{surface_type}|{url_or_path}|{owner_scope}|{content_hash}"
        surface = Surface(
            surface_id=f"surface:{short_hash(payload)}",
            surface_type=surface_type,
            url_or_path=url_or_path,
            owner_scope=owner_scope,
            visibility=visibility,
            last_seen_at=utc_now(),
            content_hash=content_hash,
            status=status,
            metadata=metadata or {},
        )
        self.surfaces.append(surface)
        return surface

    def _add_error_surface(self, seed: str, message: str) -> None:
        surface = self._add_surface(
            surface_type="unknown",
            url_or_path=seed,
            owner_scope="seed",
            visibility="unknown",
            content_hash=short_hash(seed),
            status="error",
            metadata={"error": message},
        )
        self._add_policy_blocked_cube(surface, message)

    def _cube_id(self, surface: Surface, label: str, capability_type: str) -> str:
        payload = f"{surface.surface_id}|{label}|{capability_type}|{surface.content_hash}"
        return f"cube:{short_hash(payload)}:v1"

    def _add_cube(
        self,
        surface: Surface,
        capability_type: str,
        human_label: str,
        inputs: Dict[str, Any],
        outputs: Dict[str, Any],
        preconditions: List[str],
        postconditions: List[str],
        evidence: Dict[str, Any],
        policy: Dict[str, Any],
        risk: Dict[str, Any],
        agent_affordance: Dict[str, Any],
        side_effect_level: int,
    ) -> Cube:
        value = self._score_cube_value(capability_type, side_effect_level, evidence, risk, agent_affordance)
        cube = Cube(
            cube_id=self._cube_id(surface, human_label, capability_type),
            surface_id=surface.surface_id,
            capability_type=capability_type,
            human_label=human_label,
            inputs=inputs,
            outputs=outputs,
            preconditions=preconditions,
            postconditions=postconditions,
            evidence=evidence,
            policy=policy,
            risk=risk,
            agent_affordance=agent_affordance,
            side_effect_level=side_effect_level,
            cube_value_usd=value,
            created_at=utc_now(),
        )
        self.cubes.append(cube)
        self._cube_ids_by_surface.setdefault(surface.surface_id, []).append(cube.cube_id)
        self._add_route_for_cube(cube)
        return cube

    def _default_policy(self, side_effect_level: int) -> Dict[str, Any]:
        return {
            "robots_allowed": True,
            "auth_required": False,
            "rate_limit_required": True,
            "human_approval_required": side_effect_level >= SIDE_EFFECT_DRAFT,
            "forbidden_actions": [
                "login_bypass",
                "captcha_bypass",
                "secret_collection",
                "personal_data_extraction_by_default",
            ],
            "policy_state": "allowed_read_only" if side_effect_level <= 1 else "approval_required",
        }

    def _default_evidence(self, surface: Surface, snippet: str = "") -> Dict[str, Any]:
        return {
            "retrieved_at": surface.last_seen_at,
            "surface_hash": surface.content_hash,
            "snippet_hash": sha256_text(snippet[:1000]) if snippet else surface.content_hash,
            "source": surface.url_or_path,
            "evidence_hash": sha256_text(f"{surface.surface_id}|{surface.content_hash}|{snippet[:1000]}"),
        }

    def _add_information_cube(
        self,
        surface: Surface,
        label: str,
        outputs: Dict[str, Any],
        intent: str,
        snippet: str,
        inputs: Optional[Dict[str, Any]] = None,
    ) -> None:
        self._add_cube(
            surface=surface,
            capability_type="information_cube",
            human_label=label,
            inputs=inputs or {"source": surface.url_or_path},
            outputs=outputs,
            preconditions=["surface is readable"],
            postconditions=["agent receives read-only information"],
            evidence=self._default_evidence(surface, snippet),
            policy=self._default_policy(SIDE_EFFECT_INFORMATION),
            risk={"risk_level": "low", "risk_discount": 1.0},
            agent_affordance={
                "agent_intent": intent,
                "tool_hint": "read",
                "required_inputs": list((inputs or {"source": None}).keys()),
                "expected_outputs": list(outputs.keys()),
                "confidence": 0.8,
                "fallback": "route_to_human_review",
            },
            side_effect_level=SIDE_EFFECT_INFORMATION,
        )

    def _add_policy_blocked_cube(self, surface: Surface, reason: str) -> None:
        self._add_cube(
            surface=surface,
            capability_type="information_cube",
            human_label=f"Blocked or failed surface: {surface.url_or_path}",
            inputs={"source": surface.url_or_path},
            outputs={"reason": reason},
            preconditions=["policy and access must be clear"],
            postconditions=["agent rejects cube or asks human"],
            evidence=self._default_evidence(surface, reason),
            policy={**self._default_policy(SIDE_EFFECT_INFORMATION), "policy_state": "blocked_or_failed"},
            risk={"risk_level": "blocked", "risk_discount": 0.0, "reason": reason},
            agent_affordance={
                "agent_intent": "reject unsafe or unavailable surface",
                "tool_hint": "reject",
                "required_inputs": ["source"],
                "expected_outputs": ["reason"],
                "confidence": 1.0,
                "fallback": "ask_human",
            },
            side_effect_level=SIDE_EFFECT_INFORMATION,
        )

    def _extract_package_json_cubes(self, surface: Surface, text: str) -> None:
        try:
            package = json.loads(text)
        except json.JSONDecodeError:
            self._add_information_cube(surface, "Read invalid package.json", {"parse_error": True}, "inspect package file", text[:500])
            return

        scripts = package.get("scripts", {})
        if isinstance(scripts, dict):
            for name, command in scripts.items():
                side = SIDE_EFFECT_INFORMATION
                if any(word in str(command) for word in ["deploy", "publish", "release"]):
                    side = SIDE_EFFECT_TRANSACTION
                elif any(word in str(command) for word in ["build", "test", "typecheck", "lint", "dev"]):
                    side = SIDE_EFFECT_NAVIGATION
                self._add_cube(
                    surface=surface,
                    capability_type="monitor_cube" if name in {"build", "test", "typecheck", "lint"} else "information_cube",
                    human_label=f"Package script: {name}",
                    inputs={"script_name": name, "working_directory": surface.url_or_path},
                    outputs={"command": command, "script_kind": name},
                    preconditions=["dependencies installed", "run in repository context"],
                    postconditions=["command output can be captured as proof"],
                    evidence=self._default_evidence(surface, f"{name}:{command}"),
                    policy=self._default_policy(side),
                    risk={
                        "risk_level": "medium" if side >= SIDE_EFFECT_TRANSACTION else "low",
                        "risk_discount": 0.2 if side >= SIDE_EFFECT_TRANSACTION else 0.9,
                    },
                    agent_affordance={
                        "agent_intent": f"run or inspect package script {name}",
                        "tool_hint": "shell_command_requires_human_approval" if side >= SIDE_EFFECT_TRANSACTION else "shell_command",
                        "required_inputs": ["script_name", "working_directory"],
                        "expected_outputs": ["exit_code", "stdout", "stderr"],
                        "confidence": 0.9,
                        "fallback": "read_package_json",
                    },
                    side_effect_level=side,
                )

        deps = {}
        for field_name in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
            value = package.get(field_name, {})
            if isinstance(value, dict):
                deps[field_name] = sorted(value.keys())
        if deps:
            self._add_information_cube(
                surface=surface,
                label="Package dependency map",
                outputs={"dependency_groups": deps},
                intent="inspect dependency surface for build and runtime capability",
                snippet=json_dumps(deps)[:1000],
            )

    def _extract_markdown_cubes(self, surface: Surface, text: str) -> None:
        headings = re.findall(r"^(#{1,6})\s+(.+)$", text, flags=re.MULTILINE)
        links = re.findall(r"\[([^\]]+)\]\((https?://[^)]+)\)", text)
        for marks, title in headings[:50]:
            self._add_information_cube(
                surface=surface,
                label=f"Document section: {title.strip()[:80]}",
                outputs={"heading": title.strip(), "level": len(marks)},
                intent="read documentation section",
                snippet=title,
            )
        for label, url in links[:50]:
            self._add_cube(
                surface=surface,
                capability_type="navigation_cube",
                human_label=f"Safe documentation link: {label.strip()[:80]}",
                inputs={"url": normalize_url(url)},
                outputs={"target_url": normalize_url(url), "link_text": label.strip()},
                preconditions=["link is public or user-authorized"],
                postconditions=["agent may navigate after policy check"],
                evidence=self._default_evidence(surface, f"{label}:{url}"),
                policy=self._default_policy(SIDE_EFFECT_NAVIGATION),
                risk={"risk_level": "low", "risk_discount": 0.9},
                agent_affordance={
                    "agent_intent": "follow safe documentation link",
                    "tool_hint": "open_url_read_only",
                    "required_inputs": ["url"],
                    "expected_outputs": ["target_surface"],
                    "confidence": 0.75,
                    "fallback": "ask_human",
                },
                side_effect_level=SIDE_EFFECT_NAVIGATION,
            )

    def _extract_html_cubes(self, surface: Surface, text: str, base_url: str) -> None:
        parser = HtmlCapabilityParser(base_url=base_url)
        parser.feed(text)

        if parser.title:
            self._add_information_cube(
                surface=surface,
                label=f"HTML title: {parser.title[:80]}",
                outputs={"title": parser.title, "meta": parser.meta},
                intent="read web page title and metadata",
                snippet=parser.title,
            )

        for heading in parser.headings[:50]:
            self._add_information_cube(
                surface=surface,
                label=f"HTML heading: {heading['text'][:80]}",
                outputs={"heading": heading["text"], "level": heading["level"]},
                intent="read web page section",
                snippet=heading["text"],
            )

        for link in parser.links[:100]:
            self._add_cube(
                surface=surface,
                capability_type="navigation_cube",
                human_label=f"Safe link cube: {link['href'][:100]}",
                inputs={"url": link["href"]},
                outputs={"target_url": link["href"]},
                preconditions=["target URL is allowed by policy"],
                postconditions=["agent can fetch/read target only after policy check"],
                evidence=self._default_evidence(surface, link["href"]),
                policy=self._default_policy(SIDE_EFFECT_NAVIGATION),
                risk={"risk_level": "low", "risk_discount": 0.9},
                agent_affordance={
                    "agent_intent": "follow safe link",
                    "tool_hint": "open_url_read_only",
                    "required_inputs": ["url"],
                    "expected_outputs": ["target_surface"],
                    "confidence": 0.7,
                    "fallback": "reject_cube",
                },
                side_effect_level=SIDE_EFFECT_NAVIGATION,
            )

        for form in parser.forms[:25]:
            self._add_cube(
                surface=surface,
                capability_type="draft_cube",
                human_label=f"Form draft cube: {form.get('name') or form.get('action') or surface.url_or_path}",
                inputs={"form_action": form.get("action"), "method": form.get("method"), "payload": "human_review_required"},
                outputs={"draft_payload": True, "submitted": False},
                preconditions=["user authorizes form drafting", "no automatic submission"],
                postconditions=["draft exists for human review only"],
                evidence=self._default_evidence(surface, json_dumps(form)),
                policy=self._default_policy(SIDE_EFFECT_DRAFT),
                risk={"risk_level": "medium", "risk_discount": 0.5},
                agent_affordance={
                    "agent_intent": "prepare allowed form draft without submission",
                    "tool_hint": "draft_only",
                    "required_inputs": ["form_action", "method", "payload"],
                    "expected_outputs": ["draft_payload"],
                    "confidence": 0.65,
                    "fallback": "ask_human",
                },
                side_effect_level=SIDE_EFFECT_DRAFT,
            )

        if parser.tables:
            self._add_information_cube(
                surface=surface,
                label=f"Extract {parser.tables} HTML table(s)",
                outputs={"table_count": parser.tables},
                intent="extract table from page",
                snippet=f"tables:{parser.tables}",
            )

    def _extract_code_cubes(self, surface: Surface, text: str, file_path: Path) -> None:
        rel = surface.url_or_path
        function_names = re.findall(r"\b(?:function|def|fn)\s+([A-Za-z_][A-Za-z0-9_]*)", text)
        exported_symbols = re.findall(r"\bexport\s+(?:default\s+)?(?:function|const|class)\s+([A-Za-z_][A-Za-z0-9_]*)", text)
        route_matches = re.findall(r"\b(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*['\"]([^'\"]+)['\"]", text)
        fetch_matches = re.findall(r"\bfetch\s*\(\s*['\"]([^'\"]+)['\"]", text)
        config_like = "defineConfig" in text or file_path.name.endswith(".config.ts") or file_path.name.endswith(".config.js")

        for name in (function_names + exported_symbols)[:100]:
            self._add_information_cube(
                surface=surface,
                label=f"Code symbol: {name}",
                outputs={"symbol": name, "file": rel},
                intent="inspect callable or exported code symbol",
                snippet=name,
            )

        for method, route in route_matches[:100]:
            side = SIDE_EFFECT_INFORMATION if method.lower() == "get" else SIDE_EFFECT_TRANSACTION
            self._add_cube(
                surface=surface,
                capability_type="api_or_endpoint_cube" if side == 0 else "transaction_cube",
                human_label=f"Route {method.upper()} {route}",
                inputs={"method": method.upper(), "path": route},
                outputs={"endpoint": route, "method": method.upper()},
                preconditions=["server context exists", "auth policy unknown until tested"],
                postconditions=["endpoint schema can be tested or documented"],
                evidence=self._default_evidence(surface, f"{method}:{route}"),
                policy=self._default_policy(side),
                risk={"risk_level": "medium" if side else "low", "risk_discount": 0.2 if side else 0.8},
                agent_affordance={
                    "agent_intent": "inspect API route",
                    "tool_hint": "http_request_requires_policy_check",
                    "required_inputs": ["method", "path"],
                    "expected_outputs": ["status_code", "response_shape"],
                    "confidence": 0.75,
                    "fallback": "read_source_file",
                },
                side_effect_level=side,
            )

        for url in fetch_matches[:50]:
            self._add_cube(
                surface=surface,
                capability_type="navigation_cube",
                human_label=f"Fetch target: {url[:100]}",
                inputs={"url_or_path": url},
                outputs={"target": url},
                preconditions=["target is authorized and safe"],
                postconditions=["target can be fetched read-only if policy allows"],
                evidence=self._default_evidence(surface, url),
                policy=self._default_policy(SIDE_EFFECT_NAVIGATION),
                risk={"risk_level": "low", "risk_discount": 0.8},
                agent_affordance={
                    "agent_intent": "inspect code-defined fetch target",
                    "tool_hint": "open_url_read_only",
                    "required_inputs": ["url_or_path"],
                    "expected_outputs": ["target_surface"],
                    "confidence": 0.7,
                    "fallback": "ask_human",
                },
                side_effect_level=SIDE_EFFECT_NAVIGATION,
            )

        if config_like:
            self._add_information_cube(
                surface=surface,
                label=f"Build/runtime config surface: {rel}",
                outputs={"config_surface": True, "file": rel},
                intent="inspect config controlling build, dev launch, or runtime",
                snippet=text[:1000],
            )

    def _extract_config_cubes(self, surface: Surface, text: str, file_path: Path) -> None:
        keys: List[str] = []
        if file_path.suffix.lower() == ".json":
            try:
                obj = json.loads(text)
                keys = self._flatten_json_keys(obj)[:200]
            except json.JSONDecodeError:
                keys = []
        else:
            keys = re.findall(r"^\s*([A-Za-z0-9_.-]+)\s*[:=]", text, flags=re.MULTILINE)[:200]

        if keys:
            self._add_information_cube(
                surface=surface,
                label=f"Config key index: {surface.url_or_path}",
                outputs={"keys": keys, "key_count": len(keys)},
                intent="inspect config keys",
                snippet=",".join(keys[:100]),
            )
        else:
            self._add_information_cube(
                surface=surface,
                label=f"Config text hash: {surface.url_or_path}",
                outputs={"config_hash": surface.content_hash},
                intent="inspect config file hash",
                snippet=text[:500],
            )

    def _flatten_json_keys(self, obj: Any, prefix: str = "") -> List[str]:
        keys: List[str] = []
        if isinstance(obj, dict):
            for k, v in obj.items():
                full = f"{prefix}.{k}" if prefix else str(k)
                keys.append(full)
                keys.extend(self._flatten_json_keys(v, full))
        elif isinstance(obj, list):
            for i, v in enumerate(obj[:20]):
                keys.extend(self._flatten_json_keys(v, f"{prefix}[{i}]"))
        return keys

    def _robots_allows(self, url: str) -> bool:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in {"http", "https"}:
            return False
        robots_url = urllib.parse.urlunparse((parsed.scheme, parsed.netloc, "/robots.txt", "", "", ""))
        rp = urllib.robotparser.RobotFileParser()
        rp.set_url(robots_url)
        try:
            rp.read()
            return bool(rp.can_fetch(self.user_agent, url))
        except Exception:
            return True

    def _score_cube_value(
        self,
        capability_type: str,
        side_effect_level: int,
        evidence: Dict[str, Any],
        risk: Dict[str, Any],
        affordance: Dict[str, Any],
    ) -> float:
        if capability_type == "transaction_cube":
            base = 100.0
        elif capability_type == "monitor_cube":
            base = 10.0
        elif capability_type == "draft_cube":
            base = 1.0
        elif capability_type == "navigation_cube":
            base = 0.05
        elif capability_type == "api_or_endpoint_cube":
            base = 5.0
        else:
            base = 0.01

        proof_multiplier = 1.0 if evidence.get("evidence_hash") else 0.1
        rarity_multiplier = 1.0
        automation_multiplier = 1.0 + min(float(affordance.get("confidence", 0.0)), 1.0)
        risk_discount = float(risk.get("risk_discount", 1.0))

        if side_effect_level >= SIDE_EFFECT_TRANSACTION:
            risk_discount = min(risk_discount, 0.2)
        elif side_effect_level == SIDE_EFFECT_DRAFT:
            risk_discount = min(risk_discount, 0.5)

        return round(base * proof_multiplier * rarity_multiplier * automation_multiplier * risk_discount, 6)

    def _add_route_for_cube(self, cube: Cube) -> None:
        policy_clearance = 1.0 if cube.policy.get("policy_state") in {"allowed_read_only", "approval_required"} else 0.0
        freshness = 1.0
        proof_strength = 1.0 if cube.evidence.get("evidence_hash") else 0.1
        input_fit = 1.0 if cube.inputs else 0.5
        output_fit = 1.0 if cube.outputs else 0.5
        intent_match = float(cube.agent_affordance.get("confidence", 0.5))
        value_density = min(cube.cube_value_usd / 10.0, 1.0)
        score = round(intent_match * input_fit * output_fit * proof_strength * freshness * policy_clearance * max(value_density, 0.01), 6)

        if cube.policy.get("policy_state") == "blocked_or_failed":
            outcome = "reject_cube"
            reason = "policy blocked or fetch failed"
        elif cube.side_effect_level >= SIDE_EFFECT_TRANSACTION:
            outcome = "ask_human"
            reason = "state-changing capability requires approval"
        elif cube.side_effect_level == SIDE_EFFECT_DRAFT:
            outcome = "ask_human"
            reason = "draft capability requires human review"
        else:
            outcome = "use_cube"
            reason = "read-only or navigation capability"

        route = Route(
            route_id=f"route:{short_hash(cube.cube_id)}",
            cube_id=cube.cube_id,
            agent_intent=cube.agent_affordance.get("agent_intent", ""),
            route_score=score,
            outcome=outcome,
            reason=reason,
        )
        self.routes.append(route)

    def build_edges(self) -> None:
        for cube_ids in self._cube_ids_by_surface.values():
            for a, b in zip(cube_ids, cube_ids[1:]):
                edge_payload = f"{a}|{b}|same_surface"
                self.edges.append(
                    Edge(
                        edge_id=f"edge:{short_hash(edge_payload)}",
                        from_cube=a,
                        to_cube=b,
                        edge_type="same_surface_sequence",
                        reason="Cubes extracted from the same surface in parse order",
                        confidence=0.5,
                    )
                )

    def emit(self) -> Dict[str, Path]:
        self.build_edges()
        ensure_dir(self.output_dir)
        paths = {
            "surfaces": self.output_dir / "agentic-web-cube-indexer.surfaces.jsonl",
            "cubes": self.output_dir / "agentic-web-cube-indexer.cubes.jsonl",
            "edges": self.output_dir / "agentic-web-cube-indexer.edges.jsonl",
            "routes": self.output_dir / "agentic-web-cube-indexer.routes.jsonl",
            "report": self.output_dir / "agentic-web-cube-indexer.report.md",
        }
        write_jsonl(paths["surfaces"], (asdict(s) for s in self.surfaces))
        write_jsonl(paths["cubes"], (asdict(c) for c in self.cubes))
        write_jsonl(paths["edges"], (asdict(e) for e in self.edges))
        write_jsonl(paths["routes"], (asdict(r) for r in self.routes))
        paths["report"].write_text(self._build_report(paths), encoding="utf-8")
        return paths

    def _build_report(self, paths: Dict[str, Path]) -> str:
        by_type: Dict[str, int] = {}
        by_outcome: Dict[str, int] = {}
        total_value = 0.0
        for cube in self.cubes:
            by_type[cube.capability_type] = by_type.get(cube.capability_type, 0) + 1
            total_value += cube.cube_value_usd
        for route in self.routes:
            by_outcome[route.outcome] = by_outcome.get(route.outcome, 0) + 1

        lines = [
            "# Agentic Web Cube Indexer Report",
            "",
            f"Generated: {utc_now()}",
            "",
            "## Summary",
            "",
            f"- Surfaces indexed: {len(self.surfaces)}",
            f"- Cubes emitted: {len(self.cubes)}",
            f"- Edges emitted: {len(self.edges)}",
            f"- Routes emitted: {len(self.routes)}",
            f"- Conservative cube value total: ${total_value:.6f}",
            "",
            "## Cube types",
            "",
        ]
        for key, value in sorted(by_type.items()):
            lines.append(f"- {key}: {value}")

        lines.extend(["", "## Route outcomes", ""])
        for key, value in sorted(by_outcome.items()):
            lines.append(f"- {key}: {value}")

        lines.extend(
            [
                "",
                "## Output files",
                "",
                f"- Surfaces: `{paths['surfaces']}`",
                f"- Cubes: `{paths['cubes']}`",
                f"- Edges: `{paths['edges']}`",
                f"- Routes: `{paths['routes']}`",
                "",
                "## Policy",
                "",
                "- Read-only indexing by default.",
                "- No login bypass.",
                "- No captcha bypass.",
                "- No secret collection.",
                "- No personal-data extraction by default.",
                "- State-changing cubes are detection-only and route to human approval.",
                "",
            ]
        )
        return "\n".join(lines)


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Disassemble authorized web/repo surfaces into agentic function-cubes.")
    parser.add_argument("--seed", action="append", default=[], help="Seed URL or local path. Can be repeated.")
    parser.add_argument("--repo", default=None, help="Local repo path to index.")
    parser.add_argument("--out-dir", default="artifacts/valuation", help="Output directory for JSONL ledgers and report.")
    parser.add_argument("--emit", default=None, help="Optional exact report path; JSONL files still go to --out-dir.")
    parser.add_argument("--max-repo-files", type=int, default=500)
    parser.add_argument("--max-file-bytes", type=int, default=500_000)
    parser.add_argument("--max-url-bytes", type=int, default=1_000_000)
    parser.add_argument("--timeout", type=float, default=10.0)
    return parser.parse_args(argv)


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)
    seeds = list(args.seed)
    if args.repo:
        seeds.append(args.repo)
    if not seeds:
        seeds.append(".")

    indexer = AgenticWebCubeIndexer(
        output_dir=Path(args.out_dir),
        max_file_bytes=args.max_file_bytes,
        max_repo_files=args.max_repo_files,
        max_url_bytes=args.max_url_bytes,
        timeout_seconds=args.timeout,
    )

    for seed in seeds:
        indexer.index_seed(seed)

    paths = indexer.emit()

    if args.emit:
        emit_path = Path(args.emit)
        ensure_dir(emit_path.parent)
        emit_path.write_text(paths["report"].read_text(encoding="utf-8"), encoding="utf-8")
        paths["report"] = emit_path

    print(json_dumps({name: str(path) for name, path in paths.items()}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

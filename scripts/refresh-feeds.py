#!/usr/bin/env python3
"""Phase 51: Continuous journal-RSS ingestion pipeline.

Reads scripts/feeds/registry.json, fetches each feed's RSS/Atom XML,
parses the entries, normalises them to a common schema, deduplicates
against the previous snapshot, and writes:
  * docs/feeds/all.json           — unified timeline (newest first)
  * docs/feeds/<domain>.json      — per-domain filter files
  * docs/feeds/_meta.json         — refresh timestamp + per-feed stats

The script is pure stdlib — no third-party deps. Uses urllib for HTTP,
xml.etree.ElementTree for RSS/Atom parsing, and json for output.

Runs in two contexts:
  1. CI: GitHub Actions cron every 6 hours (refresh-feeds.yml)
  2. Local: developer can run `python3 scripts/refresh-feeds.py` to
     test the pipeline offline (uses cached entries if a feed is
     unreachable).

Failure modes are graceful:
  * If a feed 404s / times out / has invalid XML, that feed's entries
    are skipped (the previous snapshot's entries for that feed are
    retained if available).
  * If the entire script crashes, the workflow's continue-on-error
    means historical snapshots remain intact.

Output schema (all.json):
  {
    "generated_at": "2026-10-21T12:00:00Z",
    "total_entries": 480,
    "feeds_polled": 12,
    "feeds_succeeded": 11,
    "feeds_failed": 1,
    "entries": [
      {
        "title": "...",
        "link": "...",
        "summary": "...",   # may be truncated
        "published": "2026-10-21T10:30:00Z",  # ISO 8601
        "journal": "Nature",
        "feed_id": "nature-all",
        "domain": "general",
        "guid": "..."  # for dedup
      },
      ...
    ]
  }
"""
import datetime
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET


REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTRY_PATH = os.path.join(REPO, "scripts", "feeds", "registry.json")
OUT_DIR = os.path.join(REPO, "docs", "feeds")
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AIHPC-Feeds-Bot/1.0"
HTTP_TIMEOUT = 15  # seconds per feed


def log(msg):
    print(f"[refresh-feeds] {msg}", flush=True)


def fetch_url(url):
    """Fetch a URL with timeout + UA. Returns (status_code, content_bytes)
    or (None, error_message) on failure."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml"})
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, f"HTTP {e.code}: {e.reason}"
    except Exception as e:
        return None, str(e)


def parse_date(date_str):
    """Parse a date string into ISO 8601 format. Best-effort — returns
    the original string if parsing fails."""
    if not date_str:
        return None
    # Try ISO 8601 (already correct)
    try:
        # Try parsing with timezone
        dt = datetime.datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.isoformat()
    except Exception:
        pass
    # Try RFC 822 (RSS pubDate: "Wed, 21 Oct 2026 10:30:00 +0000")
    for fmt in ("%a, %d %b %Y %H:%M:%S %z", "%a, %d %b %Y %H:%M:%S %Z", "%Y-%m-%dT%H:%M:%S%z"):
        try:
            dt = datetime.datetime.strptime(date_str.strip(), fmt)
            return dt.isoformat()
        except Exception:
            pass
    return date_str  # fall back to raw string


def parse_rss(xml_bytes):
    """Parse RSS 2.0 XML. Returns list of dicts with title, link, summary,
    published, guid."""
    entries = []
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        return entries, f"XML parse error: {e}"
    channel = root.find("channel")
    if channel is None:
        return entries, "no <channel> element (not RSS 2.0?)"
    for item in channel.findall("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        description = (item.findtext("description") or "").strip()
        pub_date = (item.findtext("pubDate") or "").strip()
        guid = (item.findtext("guid") or link or title).strip()
        # Strip HTML from description (RSS descriptions often contain HTML)
        summary = re.sub(r"<[^>]+>", " ", description)[:300]
        summary = re.sub(r"\s+", " ", summary).strip()
        entries.append({
            "title": title,
            "link": link,
            "summary": summary,
            "published": parse_date(pub_date),
            "guid": guid,
        })
    return entries, None


def parse_atom(xml_bytes):
    """Parse Atom 1.0 XML. Returns list of dicts."""
    entries = []
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        return entries, f"XML parse error: {e}"
    # Atom namespace
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    atom_entries = root.findall("atom:entry", ns)
    if not atom_entries:
        atom_entries = root.findall("{http://www.w3.org/2005/Atom}entry")
    for entry in atom_entries:
        title = entry.findtext("atom:title", namespaces=ns)
        if title is None:
            title = entry.findtext("{http://www.w3.org/2005/Atom}title")
        title = (title or "").strip()
        # link is an attribute on <link> elements
        link = ""
        link_els = entry.findall("atom:link", namespaces=ns)
        if not link_els:
            link_els = entry.findall("{http://www.w3.org/2005/Atom}link")
        for link_el in link_els:
            href = link_el.get("href")
            rel = link_el.get("rel", "alternate")
            if rel == "alternate" and href:
                link = href
                break
        # summary or content
        summary_el = entry.find("atom:summary", namespaces=ns)
        if summary_el is None:
            summary_el = entry.find("{http://www.w3.org/2005/Atom}summary")
        content_el = entry.find("atom:content", namespaces=ns)
        if content_el is None:
            content_el = entry.find("{http://www.w3.org/2005/Atom}content")
        desc = ""
        if summary_el is not None and summary_el.text:
            desc = summary_el.text
        elif content_el is not None and content_el.text:
            desc = content_el.text
        summary = re.sub(r"<[^>]+>", " ", desc)[:300]
        summary = re.sub(r"\s+", " ", summary).strip()
        # published or updated
        pub = entry.findtext("atom:published", namespaces=ns)
        if pub is None:
            pub = entry.findtext("{http://www.w3.org/2005/Atom}published")
        pub = (pub or "").strip()
        if not pub:
            upd = entry.findtext("atom:updated", namespaces=ns)
            if upd is None:
                upd = entry.findtext("{http://www.w3.org/2005/Atom}updated")
            pub = (upd or "").strip()
        # id
        guid = entry.findtext("atom:id", namespaces=ns)
        if guid is None:
            guid = entry.findtext("{http://www.w3.org/2005/Atom}id")
        guid = (guid or link or title).strip()
        entries.append({
            "title": title,
            "link": link,
            "summary": summary,
            "published": parse_date(pub),
            "guid": guid,
        })
    return entries, None


def parse_rdf(xml_bytes):
    """Parse RSS 1.0 / RDF (used by nature.com/nature.rss).
    Structure: <rdf:RDF><item rdf:about="..."><title>...</title>...<item/>
    """
    entries = []
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        return entries, f"XML parse error: {e}"
    # RSS 1.0 uses namespaces; item elements are at the root level (not inside channel)
    ns_rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns-"
    ns_rss10 = "http://purl.org/rss/1.0/"
    ns_dc = "http://purl.org/dc/elements/1.1/"
    # Find all <item> elements (could be namespaced or not)
    items = root.findall(f"{{{ns_rss10}}}item")
    if not items:
        items = root.findall("item")
    for item in items:
        # Title
        title_el = item.find(f"{{{ns_rss10}}}title")
        if title_el is None:
            title_el = item.find("title")
        title = (title_el.text or "").strip() if title_el is not None else ""
        # Link
        link_el = item.find(f"{{{ns_rss10}}}link")
        if link_el is None:
            link_el = item.find("link")
        link = (link_el.text or "").strip() if link_el is not None else ""
        # Description
        desc_el = item.find(f"{{{ns_rss10}}}description")
        if desc_el is None:
            desc_el = item.find("description")
        desc = (desc_el.text or "") if desc_el is not None else ""
        summary = re.sub(r"<[^>]+>", " ", desc)[:300]
        summary = re.sub(r"\s+", " ", summary).strip()
        # Date (Dublin Core)
        date_el = item.find(f"{{{ns_dc}}}date")
        if date_el is None:
            date_el = item.find(f"{{{ns_dc}}}date")
        pub = (date_el.text or "").strip() if date_el is not None else ""
        # GUID — use rdf:about attribute or link
        guid = item.get(f"{{{ns_rdf}}}about") or link or title
        entries.append({
            "title": title,
            "link": link,
            "summary": summary,
            "published": parse_date(pub),
            "guid": guid,
        })
    return entries, None


def main():
    if not os.path.isfile(REGISTRY_PATH):
        log(f"ERROR: registry not found at {REGISTRY_PATH}")
        return 1
    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        registry = json.load(f)
    log(f"Loaded registry: {len(registry)} feeds")

    os.makedirs(OUT_DIR, exist_ok=True)

    # Load previous snapshot for dedup
    prev_path = os.path.join(OUT_DIR, "all.json")
    prev_entries = []
    prev_guids = set()
    if os.path.isfile(prev_path):
        try:
            with open(prev_path, "r", encoding="utf-8") as f:
                prev_data = json.load(f)
            prev_entries = prev_data.get("entries", [])
            prev_guids = {e.get("guid") for e in prev_entries if e.get("guid")}
            log(f"Loaded previous snapshot: {len(prev_entries)} entries")
        except Exception as e:
            log(f"Could not load previous snapshot: {e}")

    all_entries = []
    per_feed_stats = []
    feeds_succeeded = 0
    feeds_failed = 0

    for feed in registry:
        if not feed.get("enabled", True):
            log(f"  SKIP  {feed['id']} (disabled)")
            per_feed_stats.append({"id": feed["id"], "name": feed["name"], "status": "skipped", "entries": 0})
            continue
        log(f"  POLL  {feed['id']}  {feed['rss']}")
        status, content = fetch_url(feed["rss"])
        if status != 200:
            log(f"    FAIL  status={status}  err={content if isinstance(content, str) else '...'}")
            feeds_failed += 1
            per_feed_stats.append({"id": feed["id"], "name": feed["name"], "status": f"failed: {status}", "entries": 0})
            # Retain previous entries for this feed_id if available
            retained = [e for e in prev_entries if e.get("feed_id") == feed["id"]]
            for e in retained:
                all_entries.append(e)
            continue
        # Try RSS first, then Atom
        if isinstance(content, bytes):
            try:
                content_str = content.decode("utf-8", errors="replace")
            except Exception:
                content_str = content.decode("latin-1", errors="replace")
        else:
            content_str = content
        # Decide format — check RDF FIRST because RSS 1.0/RDF also has
        # <channel> (which would otherwise match the RSS 2.0 check)
        entries = []
        parse_err = None
        if "<rdf:RDF" in content_str[:500] or "xmlns:rdf=" in content_str[:500]:
            entries, parse_err = parse_rdf(content)
        elif "<feed" in content_str[:500] or "xmlns=\"http://www.w3.org/2005/Atom\"" in content_str[:500]:
            entries, parse_err = parse_atom(content)
        elif "<rss" in content_str[:500] or "<channel" in content_str[:500]:
            entries, parse_err = parse_rss(content)
        else:
            # Try RSS as default
            entries, parse_err = parse_rss(content)
        if parse_err:
            log(f"    PARSE-ERR  {parse_err}")
            feeds_failed += 1
            per_feed_stats.append({"id": feed["id"], "name": feed["name"], "status": f"parse error: {parse_err}", "entries": 0})
            continue
        # Tag entries with feed metadata
        for e in entries:
            e["feed_id"] = feed["id"]
            e["journal"] = feed["journal"]
            e["domain"] = feed["domain"]
        log(f"    OK  {len(entries)} entries")
        feeds_succeeded += 1
        per_feed_stats.append({"id": feed["id"], "name": feed["name"], "status": "ok", "entries": len(entries)})
        all_entries.extend(entries)

    log(f"Total raw entries: {len(all_entries)}")

    # Dedup by guid (keep newest)
    seen = {}
    for e in all_entries:
        g = e.get("guid") or e.get("link") or e.get("title")
        if g in seen:
            # Keep the one with the more recent published date
            existing = seen[g]
            if (e.get("published") or "") > (existing.get("published") or ""):
                seen[g] = e
        else:
            seen[g] = e
    deduped = list(seen.values())
    log(f"After dedup: {len(deduped)} entries")

    # Sort by published date (newest first); entries without dates go to the end
    def sort_key(e):
        p = e.get("published") or ""
        return (p != "", p)
    deduped.sort(key=sort_key, reverse=True)

    # Cap at 500 entries per snapshot (keeps git history small)
    if len(deduped) > 500:
        deduped = deduped[:500]
        log(f"Capped at 500 entries (newest 500 kept)")

    # Group by domain for per-domain files
    by_domain = {}
    for e in deduped:
        d = e.get("domain", "general")
        by_domain.setdefault(d, []).append(e)

    # Write all.json
    snapshot = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z"),
        "total_entries": len(deduped),
        "feeds_polled": len(registry),
        "feeds_succeeded": feeds_succeeded,
        "feeds_failed": feeds_failed,
        "per_feed_stats": per_feed_stats,
        "entries": deduped,
    }
    with open(prev_path, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2, ensure_ascii=False)
    log(f"Written: {prev_path} ({os.path.getsize(prev_path):,} bytes)")

    # Write per-domain files
    for domain, entries in by_domain.items():
        path = os.path.join(OUT_DIR, f"{domain}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump({
                "domain": domain,
                "generated_at": snapshot["generated_at"],
                "total_entries": len(entries),
                "entries": entries,
            }, f, indent=2, ensure_ascii=False)
        log(f"Written: {path} ({len(entries)} entries)")

    # Write _meta.json (small summary for quick checks)
    meta = {
        "generated_at": snapshot["generated_at"],
        "total_entries": snapshot["total_entries"],
        "feeds_polled": snapshot["feeds_polled"],
        "feeds_succeeded": snapshot["feeds_succeeded"],
        "feeds_failed": snapshot["feeds_failed"],
        "per_feed_stats": per_feed_stats,
    }
    meta_path = os.path.join(OUT_DIR, "_meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
    log(f"Written: {meta_path}")

    log("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

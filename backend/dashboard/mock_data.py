"""
Mock data layer — mirrors what real Postgres queries would return.
Uses random.Random(seed=42) for reproducibility.
Generates ~1000 interactions over 30 days with realistic weekday variation.
"""
from __future__ import annotations

import random
import uuid
from datetime import date, datetime, timedelta, timezone

from dashboard.models import (
    CommandStat,
    ErrorStat,
    InteractionTypeStat,
    MetricSummary,
    TimeSeriesPoint,
)

_SEED = 42
_COMMANDS = ["ping", "profile", "event", "feedback", "purge"]
_INTERACTION_TYPES = ["slash_command", "button", "modal", "dropdown"]
_INTERACTION_WEIGHTS = [0.70, 0.20, 0.10, 0.0]  # dropdown unused for now
_ERROR_TYPES = ["RuntimeError", "ValueError", "PermissionError"]
_GUILD_NAMES = ["CAPY Server", "RCOS Discord", "Test Server"]
_BOT_VERSIONS = ["1.2.0", "1.2.1", "1.3.0"]

# Fixed pool of 80 user IDs so we get realistic repeat-user counts
_USER_POOL = [
    100_000_000 + i * 9_999_983  # deterministic spread, avoids obvious patterns
    for i in range(80)
]

# ---------------------------------------------------------------------------
# Core dataset — generated once at module load, filtered per request
# ---------------------------------------------------------------------------

def _build_dataset() -> list[dict]:
    """Build ~1000 interactions spread over the last 30 days."""
    rng = random.Random(_SEED)
    today = datetime.now(timezone.utc).date()
    records: list[dict] = []

    # Daily target: ~33/day with weekday boost (Mon–Fri ~40, Sat–Sun ~20)
    for offset in range(30):
        day = today - timedelta(days=29 - offset)
        weekday = day.weekday()  # 0=Mon, 6=Sun
        if weekday < 5:  # weekday
            count = rng.randint(30, 50)
        else:  # weekend
            count = rng.randint(12, 25)

        for _ in range(count):
            itype_roll = rng.random()
            if itype_roll < 0.70:
                itype = "slash_command"
            elif itype_roll < 0.90:
                itype = "button"
            else:
                itype = "modal"

            cmd = rng.choice(_COMMANDS) if itype == "slash_command" else rng.choice([None, rng.choice(_COMMANDS)])
            guild_name = rng.choice(_GUILD_NAMES)
            user_id = rng.choice(_USER_POOL)
            duration_ms = round(rng.uniform(30.0, 280.0), 1) if rng.random() < 0.85 else None

            # Success weighted by command
            if duration_ms is None:
                status = "internal_error"
                error_type = rng.choice(_ERROR_TYPES)
            elif rng.random() < 0.05:
                status = rng.choice(["user_error", "internal_error"])
                error_type = rng.choice(_ERROR_TYPES) if status == "internal_error" else None
            else:
                status = "success"
                error_type = None

            ts_hour = rng.randint(0, 23)
            ts_minute = rng.randint(0, 59)
            ts_second = rng.randint(0, 59)
            timestamp = datetime(
                day.year, day.month, day.day,
                ts_hour, ts_minute, ts_second,
                tzinfo=timezone.utc,
            )

            corr_id = str(uuid.UUID(int=rng.getrandbits(128)))
            records.append({
                "correlation_id": corr_id,
                "timestamp": timestamp,
                "interaction_type": itype,
                "user_id": user_id,
                "command_name": cmd,
                "guild_name": guild_name,
                "status": status,
                "duration_ms": duration_ms,
                "error_type": error_type,
                "bot_version": rng.choice(_BOT_VERSIONS),
            })

    return records


_DATASET: list[dict] = _build_dataset()


def _filter(days: int) -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    return [r for r in _DATASET if r["timestamp"] >= cutoff]


def _filter_prior(days: int) -> list[dict]:
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days * 2)
    end = now - timedelta(days=days)
    return [r for r in _DATASET if start <= r["timestamp"] < end]


# ---------------------------------------------------------------------------
# Public API — matches what DB queries would return
# ---------------------------------------------------------------------------

def get_metrics(days: int) -> MetricSummary:
    current = _filter(days)
    prior = _filter_prior(days)

    def _summarise(records: list[dict]) -> tuple[int, int, float, float]:
        total = len(records)
        users = len({r["user_id"] for r in records})
        completions = [r for r in records if r["duration_ms"] is not None]
        successes = [r for r in records if r["status"] == "success"]
        sr = len(successes) / len(records) if records else 0.0
        latency = (
            sum(r["duration_ms"] for r in completions) / len(completions)
            if completions
            else 0.0
        )
        return total, users, round(sr, 4), round(latency, 1)

    def pct_change(cur: float, pri: float) -> float:
        if pri == 0:
            return 0.0
        return round((cur - pri) / abs(pri) * 100, 2)

    c_total, c_users, c_sr, c_lat = _summarise(current)
    p_total, p_users, p_sr, p_lat = _summarise(prior)

    return MetricSummary(
        total_interactions=c_total,
        unique_users=c_users,
        success_rate=c_sr,
        avg_latency_ms=c_lat,
        total_interactions_change=pct_change(c_total, p_total),
        unique_users_change=pct_change(c_users, p_users),
        success_rate_change=pct_change(c_sr, p_sr),
        avg_latency_change=pct_change(c_lat, p_lat),
    )


def get_commands(days: int) -> list[CommandStat]:
    records = _filter(days)
    cmd_records: dict[str, list[dict]] = {}
    for r in records:
        if r["command_name"]:
            cmd_records.setdefault(r["command_name"], []).append(r)

    result: list[CommandStat] = []
    for cmd, recs in sorted(cmd_records.items(), key=lambda x: -len(x[1])):
        completions = [r for r in recs if r["duration_ms"] is not None]
        successes = [r for r in recs if r["status"] == "success"]
        avg_lat = (
            round(sum(r["duration_ms"] for r in completions) / len(completions), 1)
            if completions
            else None
        )
        sr = round(len(successes) / len(recs), 4) if recs else None
        result.append(
            CommandStat(
                command_name=cmd,
                invocations=len(recs),
                avg_latency_ms=avg_lat,
                success_rate=sr,
            )
        )
    return result


def get_timeseries(days: int) -> list[TimeSeriesPoint]:
    records = _filter(days)
    pivot: dict[str, dict[str, int]] = {}
    for r in records:
        day_str = r["timestamp"].date().isoformat()
        itype = r["interaction_type"]
        pivot.setdefault(day_str, {"slash_command": 0, "button": 0, "modal": 0})
        if itype in pivot[day_str]:
            pivot[day_str][itype] += 1

    return [
        TimeSeriesPoint(
            timestamp=day,
            slash_command=counts["slash_command"],
            button=counts["button"],
            modal=counts["modal"],
        )
        for day, counts in sorted(pivot.items())
    ]


def get_errors(days: int) -> list[ErrorStat]:
    records = _filter(days)
    counts: dict[str, int] = {}
    for r in records:
        if r["error_type"]:
            counts[r["error_type"]] = counts.get(r["error_type"], 0) + 1
    return [
        ErrorStat(error_type=et, count=c)
        for et, c in sorted(counts.items(), key=lambda x: -x[1])
    ]


def get_command_breakdown(command_name: str, days: int) -> list[InteractionTypeStat]:
    records = [r for r in _filter(days) if r["command_name"] == command_name]
    counts: dict[str, int] = {}
    for r in records:
        itype = r["interaction_type"]
        counts[itype] = counts.get(itype, 0) + 1
    return [
        InteractionTypeStat(interaction_type=itype, count=c)
        for itype, c in sorted(counts.items(), key=lambda x: -x[1])
    ]


def get_interaction_types(days: int) -> list[InteractionTypeStat]:
    records = _filter(days)
    counts: dict[str, int] = {}
    for r in records:
        itype = r["interaction_type"]
        counts[itype] = counts.get(itype, 0) + 1
    return [
        InteractionTypeStat(interaction_type=itype, count=c)
        for itype, c in sorted(counts.items(), key=lambda x: -x[1])
    ]

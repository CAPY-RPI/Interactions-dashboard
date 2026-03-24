import json

import psycopg2
import psycopg2.extras

from dashboard.config import settings
from dashboard.models import (
    CommandStat,
    CompletionEventIn,
    ErrorStat,
    HeatmapPoint,
    InteractionEventIn,
    InteractionTypeStat,
    MetricSummary,
    RecentEvent,
    TimeSeriesPoint,
)


def get_connection():
    return psycopg2.connect(settings.database_url, cursor_factory=psycopg2.extras.RealDictCursor)


def insert_interaction(conn, event: InteractionEventIn) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO telemetry_interactions
                (correlation_id, timestamp, received_at, interaction_type, user_id,
                 command_name, guild_id, guild_name, channel_id, options, bot_version)
            VALUES (%s, %s, NOW(), %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                event.correlation_id,
                event.timestamp,
                event.interaction_type,
                event.user_id,
                event.command_name,
                event.guild_id,
                event.guild_name,
                event.channel_id,
                json.dumps(event.options),
                event.bot_version,
            ),
        )


def insert_completion(conn, event: CompletionEventIn) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO telemetry_completions
                (correlation_id, timestamp, received_at, command_name, status, duration_ms, error_type)
            VALUES (%s, %s, NOW(), %s, %s, %s, %s)
            """,
            (
                event.correlation_id,
                event.timestamp,
                event.command_name,
                event.status,
                event.duration_ms,
                event.error_type,
            ),
        )


def get_recent() -> list[RecentEvent]:
    query = """
        SELECT
            i.timestamp,
            i.user_id,
            i.interaction_type,
            i.command_name,
            c.status,
            c.duration_ms,
            c.error_type
        FROM telemetry_interactions i
        LEFT JOIN telemetry_completions c ON i.correlation_id = c.correlation_id
        ORDER BY i.timestamp DESC
        LIMIT 50
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()

    return [
        RecentEvent(
            timestamp=row["timestamp"].isoformat(),
            user_id="..." + str(row["user_id"])[-4:],
            interaction_type=row["interaction_type"],
            command_name=row["command_name"],
            status=row["status"],
            duration_ms=float(row["duration_ms"]) if row["duration_ms"] is not None else None,
            error_type=row["error_type"],
        )
        for row in rows
    ]


def get_metrics(range_days: int) -> MetricSummary:
    query = """
        SELECT
            COUNT(i.id) AS total_interactions,
            COUNT(DISTINCT i.user_id) AS unique_users,
            ROUND(
                SUM(CASE WHEN c.status = 'success' THEN 1 ELSE 0 END)::numeric
                / NULLIF(COUNT(c.id), 0), 4
            ) AS success_rate,
            ROUND(AVG(c.duration_ms), 1) AS avg_latency_ms
        FROM telemetry_interactions i
        LEFT JOIN telemetry_completions c ON i.correlation_id = c.correlation_id
        WHERE i.timestamp > NOW() - (%s || ' days')::INTERVAL
    """

    def _pct_change(cur: float | None, pri: float | None) -> float:
        if cur is None or pri is None or pri == 0:
            return 0.0
        return round((cur - pri) / abs(pri) * 100, 2)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (str(range_days),))
            current = cur.fetchone()
            cur.execute(query, (str(range_days * 2),))
            prior = cur.fetchone()

    cur_interactions = int(current["total_interactions"] or 0)
    cur_users = int(current["unique_users"] or 0)
    cur_sr = float(current["success_rate"] or 0.0)
    cur_latency = float(current["avg_latency_ms"] or 0.0)

    pri_interactions = int(prior["total_interactions"] or 0)
    pri_users = int(prior["unique_users"] or 0)
    pri_sr = float(prior["success_rate"] or 0.0)
    pri_latency = float(prior["avg_latency_ms"] or 0.0)

    return MetricSummary(
        total_interactions=cur_interactions,
        unique_users=cur_users,
        success_rate=cur_sr,
        avg_latency_ms=cur_latency,
        total_interactions_change=_pct_change(cur_interactions, pri_interactions),
        unique_users_change=_pct_change(cur_users, pri_users),
        success_rate_change=_pct_change(cur_sr, pri_sr),
        avg_latency_change=_pct_change(cur_latency, pri_latency),
    )


def get_commands(range_days: int) -> list[CommandStat]:
    query = """
        SELECT
            i.command_name,
            COUNT(i.id) AS invocations,
            ROUND(AVG(c.duration_ms), 1) AS avg_latency_ms,
            ROUND(
                SUM(CASE WHEN c.status = 'success' THEN 1 ELSE 0 END)::numeric
                / NULLIF(COUNT(c.id), 0), 4
            ) AS success_rate
        FROM telemetry_interactions i
        LEFT JOIN telemetry_completions c ON i.correlation_id = c.correlation_id
        WHERE i.timestamp > NOW() - (%s || ' days')::INTERVAL
          AND i.command_name IS NOT NULL
        GROUP BY i.command_name
        ORDER BY invocations DESC
        LIMIT 10
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (str(range_days),))
            rows = cur.fetchall()

    return [
        CommandStat(
            command_name=row["command_name"],
            invocations=int(row["invocations"]),
            avg_latency_ms=float(row["avg_latency_ms"]) if row["avg_latency_ms"] is not None else None,
            success_rate=float(row["success_rate"]) if row["success_rate"] is not None else None,
        )
        for row in rows
    ]


def get_timeseries(range_days: int) -> list[TimeSeriesPoint]:
    if range_days == 1:
        trunc = "hour"
        interval = "1 day"
    else:
        trunc = "day"
        interval = f"{range_days} days"

    query = f"""
        SELECT
            DATE_TRUNC('{trunc}', timestamp) AS bucket,
            interaction_type,
            COUNT(*) AS count
        FROM telemetry_interactions
        WHERE timestamp > NOW() - INTERVAL '{interval}'
        GROUP BY bucket, interaction_type
        ORDER BY bucket
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()

    pivot: dict[str, dict[str, int]] = {}
    for row in rows:
        if range_days == 1:
            bucket_str = row["bucket"].isoformat()[:16]  # "2026-03-20T14:00"
        else:
            bucket_str = row["bucket"].date().isoformat()
        itype = row["interaction_type"]
        count = int(row["count"])
        if bucket_str not in pivot:
            pivot[bucket_str] = {"slash_command": 0, "button": 0, "modal": 0}
        if itype in pivot[bucket_str]:
            pivot[bucket_str][itype] += count

    return [
        TimeSeriesPoint(
            timestamp=bucket,
            slash_command=counts["slash_command"],
            button=counts["button"],
            modal=counts["modal"],
        )
        for bucket, counts in sorted(pivot.items())
    ]


def get_heatmap(range_days: int) -> list[HeatmapPoint]:
    query = """
        SELECT
            EXTRACT(DOW FROM timestamp)::int AS dow,
            EXTRACT(HOUR FROM timestamp)::int AS hour,
            COUNT(*) AS count
        FROM telemetry_interactions
        WHERE timestamp > NOW() - (%s || ' days')::INTERVAL
        GROUP BY dow, hour
        ORDER BY dow, hour
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (str(range_days),))
            rows = cur.fetchall()
    return [
        HeatmapPoint(dow=int(r["dow"]), hour=int(r["hour"]), count=int(r["count"]))
        for r in rows
    ]


def get_errors(range_days: int) -> list[ErrorStat]:
    query = """
        SELECT error_type, COUNT(*) AS count
        FROM telemetry_completions
        WHERE timestamp > NOW() - (%s || ' days')::INTERVAL
          AND error_type IS NOT NULL
        GROUP BY error_type
        ORDER BY count DESC
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (str(range_days),))
            rows = cur.fetchall()

    return [ErrorStat(error_type=row["error_type"], count=int(row["count"])) for row in rows]


def get_interaction_types(range_days: int) -> list[InteractionTypeStat]:
    query = """
        SELECT interaction_type, COUNT(*) AS count
        FROM telemetry_interactions
        WHERE timestamp > NOW() - (%s || ' days')::INTERVAL
        GROUP BY interaction_type
        ORDER BY count DESC
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (str(range_days),))
            rows = cur.fetchall()

    return [
        InteractionTypeStat(interaction_type=row["interaction_type"], count=int(row["count"]))
        for row in rows
    ]

import psycopg2
import psycopg2.extras

from dashboard.config import settings
from dashboard.models import (
    CommandStat,
    ErrorStat,
    InteractionTypeStat,
    MetricSummary,
    TimeSeriesPoint,
)


def get_connection():
    return psycopg2.connect(settings.database_url, cursor_factory=psycopg2.extras.RealDictCursor)


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
    query = """
        SELECT
            DATE_TRUNC('day', timestamp) AS day,
            interaction_type,
            COUNT(*) AS count
        FROM telemetry_interactions
        WHERE timestamp > NOW() - (%s || ' days')::INTERVAL
        GROUP BY day, interaction_type
        ORDER BY day
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (str(range_days),))
            rows = cur.fetchall()

    pivot: dict[str, dict[str, int]] = {}
    for row in rows:
        day_str = row["day"].date().isoformat()
        itype = row["interaction_type"]
        count = int(row["count"])
        if day_str not in pivot:
            pivot[day_str] = {"slash_command": 0, "button": 0, "modal": 0}
        if itype in pivot[day_str]:
            pivot[day_str][itype] += count

    return [
        TimeSeriesPoint(
            timestamp=day,
            slash_command=counts["slash_command"],
            button=counts["button"],
            modal=counts["modal"],
        )
        for day, counts in sorted(pivot.items())
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

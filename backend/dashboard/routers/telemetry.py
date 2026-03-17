from fastapi import APIRouter, Query

from dashboard import database, mock_data
from dashboard.config import settings
from dashboard.models import (
    CommandStat,
    ErrorStat,
    InteractionTypeStat,
    MetricSummary,
    TimeSeriesPoint,
)

router = APIRouter()

_RANGE_MAP = {"24h": 1, "7d": 7, "30d": 30}


def _range_days(range_str: str) -> int:
    return _RANGE_MAP.get(range_str, 7)


@router.get("/metrics", response_model=MetricSummary)
def get_metrics(range: str = Query("7d", description="Time range: 24h, 7d, or 30d")):
    # Real Postgres query (used when USE_MOCK=false):
    # SELECT
    #     COUNT(i.id) AS total_interactions,
    #     COUNT(DISTINCT i.user_id) AS unique_users,
    #     ROUND(SUM(CASE WHEN c.status = 'success' THEN 1 ELSE 0 END)::numeric
    #           / NULLIF(COUNT(c.id), 0), 4) AS success_rate,
    #     ROUND(AVG(c.duration_ms), 1) AS avg_latency_ms
    # FROM telemetry_interactions i
    # LEFT JOIN telemetry_completions c ON i.correlation_id = c.correlation_id
    # WHERE i.timestamp > NOW() - (%s || ' days')::INTERVAL
    days = _range_days(range)
    if settings.use_mock:
        return mock_data.get_metrics(days)
    return database.get_metrics(days)


@router.get("/commands", response_model=list[CommandStat])
def get_commands(range: str = Query("7d", description="Time range: 24h, 7d, or 30d")):
    # Real Postgres query (used when USE_MOCK=false):
    # SELECT
    #     i.command_name,
    #     COUNT(i.id) AS invocations,
    #     ROUND(AVG(c.duration_ms), 1) AS avg_latency_ms,
    #     ROUND(SUM(CASE WHEN c.status = 'success' THEN 1 ELSE 0 END)::numeric
    #           / NULLIF(COUNT(c.id), 0), 4) AS success_rate
    # FROM telemetry_interactions i
    # LEFT JOIN telemetry_completions c ON i.correlation_id = c.correlation_id
    # WHERE i.timestamp > NOW() - (%s || ' days')::INTERVAL
    #   AND i.command_name IS NOT NULL
    # GROUP BY i.command_name
    # ORDER BY invocations DESC
    # LIMIT 10
    days = _range_days(range)
    if settings.use_mock:
        return mock_data.get_commands(days)
    return database.get_commands(days)


@router.get("/timeseries", response_model=list[TimeSeriesPoint])
def get_timeseries(range: str = Query("7d", description="Time range: 24h, 7d, or 30d")):
    # Real Postgres query (used when USE_MOCK=false):
    # SELECT
    #     DATE_TRUNC('day', timestamp) AS day,
    #     interaction_type,
    #     COUNT(*) AS count
    # FROM telemetry_interactions
    # WHERE timestamp > NOW() - (%s || ' days')::INTERVAL
    # GROUP BY day, interaction_type
    # ORDER BY day
    days = _range_days(range)
    if settings.use_mock:
        return mock_data.get_timeseries(days)
    return database.get_timeseries(days)


@router.get("/errors", response_model=list[ErrorStat])
def get_errors(range: str = Query("7d", description="Time range: 24h, 7d, or 30d")):
    # Real Postgres query (used when USE_MOCK=false):
    # SELECT error_type, COUNT(*) AS count
    # FROM telemetry_completions
    # WHERE timestamp > NOW() - (%s || ' days')::INTERVAL
    #   AND error_type IS NOT NULL
    # GROUP BY error_type
    # ORDER BY count DESC
    days = _range_days(range)
    if settings.use_mock:
        return mock_data.get_errors(days)
    return database.get_errors(days)


@router.get("/interaction-types", response_model=list[InteractionTypeStat])
def get_interaction_types(range: str = Query("7d", description="Time range: 24h, 7d, or 30d")):
    # Real Postgres query (used when USE_MOCK=false):
    # SELECT interaction_type, COUNT(*) AS count
    # FROM telemetry_interactions
    # WHERE timestamp > NOW() - (%s || ' days')::INTERVAL
    # GROUP BY interaction_type
    # ORDER BY count DESC
    days = _range_days(range)
    if settings.use_mock:
        return mock_data.get_interaction_types(days)
    return database.get_interaction_types(days)

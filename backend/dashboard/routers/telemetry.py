import psycopg2
from fastapi import APIRouter, Depends, HTTPException, Query, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from dashboard import database, mock_data
from dashboard.config import settings
from dashboard.models import (
    BatchRequest,
    CommandStat,
    ErrorStat,
    InteractionTypeStat,
    MetricSummary,
    RecentEvent,
    TimeSeriesPoint,
)

router = APIRouter()

_RANGE_MAP = {"24h": 1, "7d": 7, "30d": 30}

security = HTTPBearer(auto_error=False)


def _range_days(range_str: str) -> int:
    return _RANGE_MAP.get(range_str, 7)


def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(security)):
    if not settings.telemetry_api_key:
        return   # auth disabled in dev
    if not credentials or credentials.credentials != settings.telemetry_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")


@router.post("/telemetry/batch", status_code=202, dependencies=[Depends(verify_api_key)])
def post_batch(body: BatchRequest):
    if not body.events:
        return {"written": 0}

    if settings.use_mock:
        return {"written": len(body.events)}

    written = 0
    errors = []

    try:
        with database.get_connection() as conn:
            for idx, event in enumerate(body.events):
                try:
                    if event.type == "interaction":
                        database.insert_interaction(conn, event)
                    else:
                        database.insert_completion(conn, event)
                    written += 1
                except Exception as exc:
                    errors.append({"index": idx, "reason": str(exc)})
    except psycopg2.Error as exc:
        return {"written": 0, "rejected": len(body.events), "errors": [{"index": 0, "reason": str(exc)}]}

    response = {"written": written}
    if errors:
        response["rejected"] = len(errors)
        response["errors"] = errors
    return response


@router.get("/recent", response_model=list[RecentEvent])
def get_recent_events():
    if settings.use_mock:
        return mock_data.get_recent()
    return database.get_recent()


@router.get("/metrics", response_model=MetricSummary)
def get_metrics(range: str = Query("7d", description="Time range: 24h, 7d, or 30d")):
    days = _range_days(range)
    if settings.use_mock:
        return mock_data.get_metrics(days)
    return database.get_metrics(days)


@router.get("/commands", response_model=list[CommandStat])
def get_commands(range: str = Query("7d", description="Time range: 24h, 7d, or 30d")):
    days = _range_days(range)
    if settings.use_mock:
        return mock_data.get_commands(days)
    return database.get_commands(days)


@router.get("/timeseries", response_model=list[TimeSeriesPoint])
def get_timeseries(range: str = Query("7d", description="Time range: 24h, 7d, or 30d")):
    days = _range_days(range)
    if settings.use_mock:
        return mock_data.get_timeseries(days)
    return database.get_timeseries(days)


@router.get("/errors", response_model=list[ErrorStat])
def get_errors(range: str = Query("7d", description="Time range: 24h, 7d, or 30d")):
    days = _range_days(range)
    if settings.use_mock:
        return mock_data.get_errors(days)
    return database.get_errors(days)


@router.get("/interaction-types", response_model=list[InteractionTypeStat])
def get_interaction_types(range: str = Query("7d", description="Time range: 24h, 7d, or 30d")):
    days = _range_days(range)
    if settings.use_mock:
        return mock_data.get_interaction_types(days)
    return database.get_interaction_types(days)

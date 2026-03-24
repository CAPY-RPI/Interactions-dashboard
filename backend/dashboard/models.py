from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class MetricSummary(BaseModel):
    total_interactions: int
    unique_users: int
    success_rate: float        # 0.0 – 1.0
    avg_latency_ms: float
    total_interactions_change: float   # % change vs prior period
    unique_users_change: float
    success_rate_change: float
    avg_latency_change: float


class CommandStat(BaseModel):
    command_name: str
    invocations: int
    avg_latency_ms: float | None
    success_rate: float | None


class TimeSeriesPoint(BaseModel):
    timestamp: str             # ISO date string e.g. "2026-03-10"
    slash_command: int
    button: int
    modal: int


class ErrorStat(BaseModel):
    error_type: str
    count: int


class InteractionTypeStat(BaseModel):
    interaction_type: str
    count: int


class InteractionEventIn(BaseModel):
    type: Literal["interaction"]
    correlation_id: str
    timestamp: datetime
    interaction_type: str
    user_id: int
    command_name: str | None = None
    guild_id: int | None = None
    guild_name: str | None = None
    channel_id: int
    options: dict = {}
    bot_version: str = "unknown"


class CompletionEventIn(BaseModel):
    type: Literal["completion"]
    correlation_id: str
    timestamp: datetime
    command_name: str
    status: Literal["success", "user_error", "internal_error"]
    duration_ms: float | None = None
    error_type: str | None = None


class BatchRequest(BaseModel):
    events: list[InteractionEventIn | CompletionEventIn]


class RecentEvent(BaseModel):
    timestamp: str
    user_id: str        # masked: "...1234"
    interaction_type: str
    command_name: str | None
    status: str | None
    duration_ms: float | None
    error_type: str | None


class HeatmapPoint(BaseModel):
    dow: int    # 0=Sunday, 6=Saturday (Postgres EXTRACT(DOW) convention)
    hour: int   # 0-23 UTC
    count: int

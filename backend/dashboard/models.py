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

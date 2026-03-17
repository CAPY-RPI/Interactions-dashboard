from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dashboard.routers import telemetry
from dashboard.config import settings

app = FastAPI(title="Interactions Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(telemetry.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "mock": settings.use_mock}

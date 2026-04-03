ARG python_version=3.11-slim
ARG uv_version=0.9.10

FROM ghcr.io/astral-sh/uv:${uv_version} AS uv

FROM python:${python_version} AS builder
COPY --from=uv /uv /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-dev --no-install-project

FROM python:${python_version}

COPY --from=builder /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

WORKDIR /app
COPY dashboard/ ./dashboard/

CMD ["uvicorn", "dashboard.main:app", "--host", "0.0.0.0", "--port", "8000"]

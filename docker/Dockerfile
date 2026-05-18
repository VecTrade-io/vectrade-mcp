FROM python:3.12-slim AS base

LABEL org.opencontainers.image.title="VecTrade MCP Server"
LABEL org.opencontainers.image.description="Model Context Protocol server for AI IDE integration"
LABEL org.opencontainers.image.source="https://github.com/VecTrade-io/vectrade-mcp"
LABEL org.opencontainers.image.licenses="MIT"

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN adduser --system --no-create-home --group mcp && \
    apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt pyproject.toml ./
RUN pip install --no-cache-dir -r requirements.txt

COPY vectrade_mcp/ ./vectrade_mcp/
COPY scripts/ ./scripts/

USER mcp

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

ENTRYPOINT ["python", "-m", "vectrade_mcp.verify"]

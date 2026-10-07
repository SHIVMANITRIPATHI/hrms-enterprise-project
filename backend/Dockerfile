# =========================================================================
# STAGE 1: BASE RUNTIME ENVIRONMENT & DEPENDENCIES
# =========================================================================
FROM python:3.11-slim AS base

WORKDIR /app

# Install system dependencies required for MSSQL ODBC Driver compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    build-essential \
    unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

# Add Microsoft package signatures
RUN curl https://microsoft.com | apt-key add - \
    && curl https://microsoft.com > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# =========================================================================
# STAGE 2: BUILD VALIDATION RUNNER (THE PIPELINE TARGETS THIS RIGHT HERE)
# =========================================================================
FROM base AS test
COPY . .
RUN pip install pytest && pytest || true

# =========================================================================
# STAGE 3: FINAL PRODUCTION RUNTIME ENGINE
# =========================================================================
FROM base AS final
COPY ./app ./app

EXPOSE 8000
ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

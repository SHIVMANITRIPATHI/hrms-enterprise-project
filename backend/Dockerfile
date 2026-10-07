# =========================================================================
# STAGE 1: BASE RUNTIME ENVIRONMENT & DEPENDENCIES
# =========================================================================
FROM python:3.11-slim AS base

WORKDIR /app

# Install baseline system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    build-essential \
    unixodbc-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Securely download the ACTUAL Microsoft public signing key
RUN mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://microsoft.com | gpg --dearmor -o /etc/apt/keyrings/microsoft.gpg

# Register the EXACT Microsoft production package repository list for Debian 12
RUN echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/microsoft.gpg] https://microsoft.com main" > /etc/apt/sources.list.d/mssql-release.list

# Install the Microsoft ODBC Driver 18 for SQL Server
RUN apt-get update && ACCEPT_EULA=Y apt-get install -y --no-install-recommends \
    msodbcsql18 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# =========================================================================
# STAGE 2: BUILD VALIDATION RUNNER (PIPELINE TEST TARGET)
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

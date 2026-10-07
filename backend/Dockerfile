# =========================================================================
# STAGE 1: BASE RUNTIME ENVIRONMENT & DEPENDENCIES
# =========================================================================
FROM python:3.11-slim-bookworm AS base

WORKDIR /app

# Install baseline system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    build-essential \
    unixodbc-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# -------------------------------------------------------------------------
# Microsoft SQL Server repository
# Debian 12 / Bookworm
# -------------------------------------------------------------------------

RUN mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
       | gpg --dearmor \
       -o /etc/apt/keyrings/microsoft.gpg \
    && chmod 644 /etc/apt/keyrings/microsoft.gpg

RUN echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/microsoft.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" \
    > /etc/apt/sources.list.d/microsoft-prod.list

# Install Microsoft ODBC Driver 18
RUN apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends \
       msodbcsql18 \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt


# =========================================================================
# STAGE 2: BUILD VALIDATION RUNNER
# =========================================================================
FROM base AS test

COPY . .

RUN pip install --no-cache-dir pytest

RUN pytest


# =========================================================================
# STAGE 3: FINAL PRODUCTION RUNTIME
# =========================================================================
FROM base AS final

COPY ./app ./app

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
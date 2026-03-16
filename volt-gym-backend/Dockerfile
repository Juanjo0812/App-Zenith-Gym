FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (e.g. for building asyncpg)
RUN apt-get update && apt-get install -y gcc build-essential && rm -rf /var/lib/apt/lists/*

# Copy core requirements
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src /app/src
COPY alembic /app/alembic
COPY alembic.ini /app/
# (Optional) COPY tests /app/tests 

# Run FastAPI using Uvicorn
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]

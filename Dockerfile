FROM python:3.10-slim

WORKDIR /app

COPY requirements_hf.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY hf_app.py app.py
COPY landing_neomorphic.html .
COPY claim.html .
COPY dashboard_neomorphic.html .
COPY kpi_dashboard.html .
COPY oracle_*.html .
COPY README_HF.md README.md

ENV PORT=7860
EXPOSE 7860

CMD ["python", "app.py"]

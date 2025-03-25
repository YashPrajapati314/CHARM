FROM python:3.12-slim

WORKDIR /services/charm-flask

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./paddle /services/charm-flask/

EXPOSE 5000

CMD ["python3", "ocr_api.py"]
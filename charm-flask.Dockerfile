FROM python:3.11-bookworm

WORKDIR /services/charm-flask

RUN apt-get update
RUN apt-get install ffmpeg libsm6 libxext6 -y

COPY paddle/requirements.txt /services/charm-flask
RUN pip install --no-cache-dir -r requirements.txt

COPY ./paddle /services/charm-flask/

EXPOSE 5000

CMD ["python3", "ocr_api.py"]

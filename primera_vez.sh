#!/bin/bash



sudo rm -rf mongo-data
python3 -m venv distri
source distri/bin/activate
pip install mongodb -y
pip install redis -y

sudo docker-compose up -d cache mongodb storage-api
sudo docker exec -it storage-api npm run init
sudo docker-compose up -d --build scraper
sudo docker-compose logs -f scraper
sudo docker-compose up -d --build traffic-generator
sudo docker-compose logs -f traffic-generator


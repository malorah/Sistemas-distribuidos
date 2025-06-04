#!/bin/bash
sudo docker network create hadoop-net
sudo docker compose -f docker-compose-hadoop.yml up -d
sudo docker compose up -d
sudo docker logs hadoop-pig

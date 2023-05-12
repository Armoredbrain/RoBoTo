#!/bin/sh

PORT=5005

CONTAINERID=`docker ps -a | grep rasa/rasa:3.0.8-full | grep "Up " | cut -d" " -f 1`
CONTAINERIP=`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $CONTAINERID`

echo "Connected to NLU server on $CONTAINERIP:$PORT"
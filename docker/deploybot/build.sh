#!/usr/bin/env bash

# SET THE FOLLOWING VARIABLES
# docker hub username
USERNAME=situation
# image name
IMAGE=deploybot-base
cp -r ../../deploy ./scripts
docker build --no-cache -t $USERNAME/$IMAGE:latest .
rm -rf scripts
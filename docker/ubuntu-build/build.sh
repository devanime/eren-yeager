#!/usr/bin/env bash

# SET THE FOLLOWING VARIABLES
# docker hub username
USERNAME=situation
# image name
IMAGE=ubuntu-build
docker build --no-cache -t $USERNAME/$IMAGE:latest .
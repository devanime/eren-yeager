#!/usr/bin/env bash

# SET THE FOLLOWING VARIABLES
# docker hub username
USERNAME=devanime
# image name
IMAGE=github-runner
# bump version
docker run --rm -v "$PWD":/app treeder/bump patch
version=`cat VERSION`
echo "version: $version"

# run build
./build.sh

# tag it
docker tag $USERNAME/$IMAGE:latest $USERNAME/$IMAGE:$version
docker tag $USERNAME/$IMAGE:latest $USERNAME/$IMAGE:stable

# push it
docker push $USERNAME/$IMAGE:latest
docker push $USERNAME/$IMAGE:stable
docker push $USERNAME/$IMAGE:$version
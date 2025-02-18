#!/usr/bin/env bash

# SET THE FOLLOWING VARIABLES
# docker hub username
USERNAME=situation
# image name
IMAGE=ubuntu-build
# bump version
docker run --rm -v "$PWD":/app treeder/bump patch
version=`cat VERSION`
echo "version: $version"

# run build
./build.sh

# tag it
docker tag $USERNAME/$IMAGE:latest $USERNAME/$IMAGE:$version

# push it
docker push $USERNAME/$IMAGE:latest
docker push $USERNAME/$IMAGE:$version
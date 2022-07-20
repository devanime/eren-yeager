#!/usr/bin/env bash

set -e

rootDir="$PWD"
themes=${rootDir}/wp-content/themes

# Run unit tests if present
if [ -f phpunit.xml ]; then
    composer install
    sudo service mysql start
    mysql -u root -e "CREATE DATABASE wp_tests"
    ${rootDir}/wp-content/vendor/bin/phpunit
fi

# Install composer
if [ -f composer.lock ]; then
    composer install -o --no-dev
fi

# Set Node Version

if [ -z "$NODE_VERSION" ]; then
    NODE_VERSION=10
fi

echo "Node Version: $NODE_VERSION"

. /home/github/.nvm/nvm.sh
nvm use $NODE_VERSION

if [ -f webpack.config.js ]; then
    yarn install --no-progress --network-timeout 1000000 && yarn production
# Build theme dependencies
elif [ -d "${themes}" ]; then
    cd "${themes}"
    for d in */ ; do
        currentTheme="${themes}/${d}"
        cd "${currentTheme}"
        if [ -f package.json ]; then
            yarn install --no-progress --network-timeout 1000000
        fi
        if [ -f bower.json ]; then
            bower install
        fi
        if [ -f gulpfile.js ]; then
            gulp --production
        fi
        if [ -f Gruntfile.js ]; then
            grunt
        fi
        if [ -f webpack.config.js ]; then
            yarn production
        fi
    done
    cd "${rootDir}"
fi

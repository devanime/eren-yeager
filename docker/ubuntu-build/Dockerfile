FROM situation/ubuntu-base
MAINTAINER DevAnime <devanimecards@gmail.com>

# Install composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer creates=/usr/local/bin/composer && \
    composer --global config process-timeout 5000

# Add Yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

RUN apt-get remove yarn && apt-get update

# Install node/yarn
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash && \
    export NVM_DIR="$HOME/.nvm" && \
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && \
    nvm install 10 && \
    nvm install 12 && \
    npm set progress=false && \
    npm config set strict-ssl false && \
    npm cache verify && \
    apt-get -y install --no-install-recommends yarn && \
    yarn config set no-progress && \
    yarn config set network-timeout 180000 && \
    yarn global add bower gulp grunt karma karma-cli webpack webpack-cli replace

RUN echo '{ "allow_root": true }' > /root/.bowerrc

# Misc
RUN mkdir -p ~/.ssh && \
    touch ~/.ssh/id_rsa && \
    chmod 600 ~/.ssh/id_rsa

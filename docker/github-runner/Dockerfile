FROM situation/ubuntu-base
MAINTAINER DevAnime <devanimecards@gmail.com>

# Install composer
RUN curl -sS https://getcomposer.org/installer | php -- --version=2.1.1 --install-dir=/usr/local/bin --filename=composer creates=/usr/local/bin/composer && \
    composer --global config process-timeout 5000

RUN apt-get update && apt-get install -y sudo && \
    groupadd -g 1005 github && \
    useradd -m --shell /bin/bash -u 10117 -g 1005 -G sudo github && \
    echo "github ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

USER github
WORKDIR /home/github
COPY --chown=github:github scripts /scripts
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.37.2/install.sh | bash && \
    export NVM_DIR="$HOME/.nvm" && \
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && \
    # Node 10.x
    nvm install 10 && \
    npm set progress=false && \
    npm config delete prefix && \
    npm config set strict-ssl false && \
    npm cache verify && \
    npm install -g yarn bower gulp grunt karma karma-cli webpack webpack-cli replace && \
    yarn config set no-progress && \
    yarn config set network-timeout 180000 && \
    # Node 12.x
    nvm install 12 && \
    npm set progress=false && \
    npm config delete prefix && \
    npm config set strict-ssl false && \
    npm cache verify && \
    npm install -g yarn bower gulp webpack webpack-cli replace && \
    yarn config set no-progress && \
    yarn config set network-timeout 180000 && \
    sudo cp -s /scripts/* /usr/local/bin/

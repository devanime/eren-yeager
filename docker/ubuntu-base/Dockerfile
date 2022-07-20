FROM ubuntu
MAINTAINER DevAnime <devanimecards@gmail.com>
WORKDIR /root

# Preset mysql interactive setup

RUN echo "mysql-apt-config mysql-apt-config/unsupported-platform select abort" | /usr/bin/debconf-set-selections && \
    echo "mysql-apt-config mysql-apt-config/repo-codename   select trusty" | /usr/bin/debconf-set-selections && \
    echo "mysql-apt-config mysql-apt-config/select-tools select" | /usr/bin/debconf-set-selections && \
    echo "mysql-apt-config mysql-apt-config/repo-distro select ubuntu" | /usr/bin/debconf-set-selections

ENV DEBIAN_FRONTEND noninteractive

# Remove sh
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Setup mysql repo
RUN apt-get update && apt-get install -y wget lsb-release gnupg apt-utils && \
    wget https://dev.mysql.com/get/mysql-apt-config_0.8.15-1_all.deb && \
    dpkg --install mysql-apt-config_0.8.15-1_all.deb

RUN apt-get update && apt-get install -y curl \
        git \
        zip \
        unzip \
        rsync \
        libxml2-dev \
        build-essential \
        libssl-dev \
        openssh-client \
        libreadline-gplv2-dev \
        libncursesw5-dev \
        libsqlite3-dev \
        tk-dev \
        libgdbm-dev \
        libc6-dev \
        libbz2-dev \
        software-properties-common \
        language-pack-en-base \
        ansible \
        apt-transport-https \
        sshpass \
        php-cli \
        php-curl \
        php-mbstring \
        php-xml \
        php-zip \
        php-gd \
        php-redis \
        php-bcmath \
        php-mysqli \
        mariadb-server-10.3 \
        awscli

# Clean apt
RUN apt-get clean

# Setup mysql root access
RUN service mysql start && \
    mysql -u root -e 'USE mysql; UPDATE `user` SET `Host`="%", `plugin`="mysql_native_password" WHERE `User`="root" AND `Host`="localhost"; DELETE FROM `user` WHERE `Host` != "%" AND `User`="root"; FLUSH PRIVILEGES;'

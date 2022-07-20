FROM situation/ubuntu-build
MAINTAINER DevAnime <devanimecards@gmail.com>

COPY scripts /scripts
COPY ssh-config/config ./.ssh/
RUN echo "export PATH=\"/scripts:\$PATH\"" >> ~/.bashrc

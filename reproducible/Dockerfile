# The image every build of the site runs in, so anyone gets the same bytes: Node 24.22.1 on Debian bookworm (with the Python 3 that
# build.py needs), pinned by digest. Always built and run as linux/amd64. See reproducible/README.md.
FROM --platform=linux/amd64 node:24.22.1-bookworm@sha256:d862bb5d082c5ae0210ac07e8c0344cb8cf7bef6d78e9b8c50c179da923108ea
COPY build-inside.sh /usr/local/bin/build-inside.sh
WORKDIR /build
ENTRYPOINT ["build-inside.sh"]

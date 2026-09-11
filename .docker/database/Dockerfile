# syntax=docker/dockerfile:1
ARG MYSQL_VERSION=8.4
FROM mysql:${MYSQL_VERSION}
# Keep the MySQL server from the selected image. Patch only Oracle Linux packages;
# mysqlsh and its embedded Python are not used by this application's SQL workflow.
RUN microdnf --disablerepo=mysql8.4-server-minimal --disablerepo=mysql-tools-community remove -y mysql-shell \
    && microdnf --disablerepo=mysql8.4-server-minimal --disablerepo=mysql-tools-community upgrade -y \
    && microdnf clean all

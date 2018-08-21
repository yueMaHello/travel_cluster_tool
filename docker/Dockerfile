#
# Flow_Cluster_Tool/docker/Dockerfile ---
#

# We would prefer 18.04; but the host is 16.04
# and the bundled numpy isnt compatable.
# FROM ubuntu:18.04
FROM ubuntu:16.04

#
SHELL ["bash", "-c"]

#
RUN DEBIAN_FRONTEND=noninteractive apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y make sudo

#
WORKDIR /opt/flow-cluster-tool

# a minimal set so we can use the cache.
COPY ./fct-setup.env ./Makefile ./package.json /opt/flow-cluster-tool/
RUN export DEBIAN_FRONTEND=noninteractive && source ./fct-setup.env && make _apt_get_install _build_all

# get the rest of the files.
COPY . /opt/flow-cluster-tool

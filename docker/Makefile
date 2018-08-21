#
# Flow_Cluster_Tool/docker/Makefile ---
#

ifeq (${FCT_DIR},)
  $(error source ./fct-setup.env)
endif

#####

SHELL:=bash
.SUFFIXES:

_default:

#####

FCT_DOCKER_TAG:=flow_cluster_tool:latest

_docker_build:
	docker build \
	  -f ./Dockerfile \
	  --tag ${FCT_DOCKER_TAG} \
	  ${FCT_DIR}/.

# build up our cmd, with comments.
run_cmd:=docker run
# For a real server:
run_cmd+=--detach
run_cmd+=--restart on-failure:10
# for debugging:
# run_cmd+= --rm
# run_cmd+= --interactive
# run_cmd+= --tty
run_cmd+= --name fct_server
run_cmd+=--user $$(id -u fct-prd):$$(id -g fct-prd)
#
run_cmd+= -p ${FCT_HTTP_PORT}:${FCT_HTTP_PORT}
#
run_cmd+= --env FCT_HTTP_PORT
#
run_cmd+= --mount type=bind,src=${FCT_DATA_COMPRESSED_DIR},dst=/opt/flow-cluster-tool/public/data/compressed
run_cmd+= --mount type=bind,src=${FCT_DATA_UNCOMPRESSED_DIR},dst=/opt/flow-cluster-tool/public/data/uncompressed
#
run_cmd+= ${FCT_DOCKER_TAG}
#
_docker_bash:
	${run_cmd}

_docker_server_stop:
# stop and remove the server.
	-docker kill fct_server
	sleep 3
	-docker rm fct_server

_docker_server_start:
#
	mkdir -p ${FCT_DIR}/public/data/{un,}compressed
#
	${run_cmd} bash -c "source ./fct-setup.env && exec ./bin/fct-run-server"

_docker_server_logs:
	docker logs --tail 50 fct_server

_docker_server_restart: _docker_server_stop _docker_server_start

#####

# Get a shell for poking around.
_ubuntu_bash:
	docker run \
	  --rm \
	  --interactive \
	  --tty \
	  ubuntu:16.04

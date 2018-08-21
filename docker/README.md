Flow_Cluster_Tool/docker/README
==================================================

Builds an docker image of ``Flow_Cluster_Tool``.

```
# Create the image
make _docker_build

# runs the server in the image.
make _docker_run_server

# If you want to look around
make _docker_run_bash
```


NOTES:

- Use an http proxy for docker builds.

```
export http_proxy="..."
```

- ``df -h`` under docker produces incorrect output.
  Use ``mount`` to show mounts.
  https://github.com/ansible/ansible/issues/10635

- ``RuntimeWarning: numpy.dtype size changed``
  https://github.com/ContinuumIO/anaconda-issues/issues/6678

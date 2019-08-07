#!/bin/bash

cd ~/workspace/brython-server
mkdir -p brythonserver/static/brython
pushd brythonserver/static/brython
python3 -m brython --update
popd
rm dist/*
python3 setup.py sdist
python3 -m pip wheel --no-index --no-deps --wheel-dir dist dist/*.tar.gz


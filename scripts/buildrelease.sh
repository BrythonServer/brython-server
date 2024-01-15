#!/bin/bash
# Note: you must pip install brython in accordance with requirements.txt
# Note: execute from brython-server

source env/bin/activate
pip install -r requirements.txt
mkdir -p brythonserver/static/brython
pushd brythonserver/static/brython
brython-cli install
popd
rm dist/*
python3 setup.py sdist
python3 -m pip wheel --no-index --no-build-isolation --no-deps --wheel-dir dist dist/*.tar.gz


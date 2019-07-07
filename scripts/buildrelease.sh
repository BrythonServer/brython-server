#!/bin/bash

python3 setup.py sdist
python3 -m pip wheel --no-index --no-deps --wheel-dir dist dist/*.tar.gz


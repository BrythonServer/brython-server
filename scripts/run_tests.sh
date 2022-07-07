#!/bin/bash
python3 -m black --check brythonserver || { echo 'black failed (use black first)' ; exit 1; }
python3 -m pylint -r n brythonserver || { echo 'pylint failed' ; exit 1; }
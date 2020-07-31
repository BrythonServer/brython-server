#!/bin/bash
black --check brythonserver || { echo 'black failed (use black first)' ; exit 1; }
python3 -m pylint -r n brythonserver || { echo 'pylint failed' ; exit 1; }
standard brythonserver/static/bs.js || { echo 'javascript lint failed (standard)' ; exit 1;}

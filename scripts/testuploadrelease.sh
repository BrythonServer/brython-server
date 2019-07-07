#!/bin/bash

# test with: pip install --index-url https://test.pypi.org/simple/ brython-server
python3 -m twine upload --repository-url https://test.pypi.org/legacy/ dist/*
#!/bin/bash

# >>>!!!>>> test with: pip install --extra-index-url https://test.pypi.org/simple/ brython-server
python3.11 -m twine upload --repository-url https://test.pypi.org/legacy/ dist/*
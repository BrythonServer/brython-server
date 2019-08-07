"""
Brython Server package setup for pypi
"""

import setuptools
from brythonserver.__version__ import VERSION

with open("README.md", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name="brython-server",
    include_package_data=True,
    version=VERSION,
    author="Eric Dennison",
    author_email="ericd@netdenizen.com",
    description="Simple web based Python 3 IDE with Brython and Github integration",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/tiggerntatie/brython-server",
    packages=setuptools.find_packages(),
    install_requires=[
        'gunicorn==19.9.0',
        'redis>=3.2.1',
        'Flask-Session>=0.3.1',
        'Flask-Caching>=1.7.2',
        'Flask>=0.12.3',
        'ggame==1.0.11',
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)

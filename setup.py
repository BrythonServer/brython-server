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
    python_requires='>=3.11',
    install_requires=[
        'gunicorn==19.9.0',
        'Flask==2.1.2',
        'werkzeug==2.1.2',
        'pillow==10.2.0',
        'ggame==1.1.3',
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)

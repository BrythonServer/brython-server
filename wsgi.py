"""
Brython-Server debugging server
Author: E Dennison

Execute with proper environment variables set.
Not for production use (instead, e.g.: gunicorn -b 127.0.0.1:8003 -w 4 brythonserver.main:app)
"""


if __name__ == "__main__":
    import os
    from random import randint
    import brythonserver.__version__ 
    brythonserver.__version__.VERSION = str(randint(0, 100000))
    import brythonserver.main
    brythonserver.main.APP.run(host=os.getenv("IP", "0.0.0.0"), port=int(os.getenv("PORT", "8080")))

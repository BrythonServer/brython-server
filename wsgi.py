"""
Brython-Server debugging server
Author: E Dennison

Execute with proper environment variables set.
Not for production use (instead, e.g.: gunicorn -b 127.0.0.1:8003 -w 4 brythonserver.main:app)
"""

from brythonserver.main import APP

if __name__ == "__main__":
    global GGAME_USER
    global VERSION
    import os
    from random import randint
    from brythonserver.definitions import GGAME_USER, GGAME_DEV_USER
    from brythonserver.__version__ import VERSION
    GGAME_USER = GGAME_DEV_USER
    VERSION = str(randint(0, 100000))
    APP.run(host=os.getenv("IP", "0.0.0.0"), port=int(os.getenv("PORT", "8080")))

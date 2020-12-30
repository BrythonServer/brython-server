"""
Brython-Server turtle import wrapper
Author: E Dennison
"""
from browser import document
from turtle import *
from turtle import set_defaults, FormattedTuple

set_defaults(turtle_canvas_wrapper=document["graphics-column"])

# Redefine done
_done = done


def done():
    _done()
    Screen().reset()
    Turtle._pen = None


# Redefine FormattedTuple to support abs()
_FormattedTuple = FormattedTuple


class FormattedTuple(_FormattedTuple):
    def __abs__(self):
        return (self[0] ** 2 + self[1] ** 2) ** 0.5

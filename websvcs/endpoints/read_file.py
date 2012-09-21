#!/usr/bin/env python

import cgi;
import urllib;

BASE_PATH = "/local/qed/data"

print "Content-Type: text/plain\n"

form = cgi.FieldStorage()
filepath = urllib.unquote(form.getvalue("filepath"))

rfile = open(BASE_PATH + filepath)
for idx, line in enumerate(rfile):
        print line.rstrip()

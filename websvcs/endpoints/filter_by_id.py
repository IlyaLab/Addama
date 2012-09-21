#!/usr/bin/env python

import cgi;
import urllib;



print "Content-Type: text/plain\n"

form = cgi.FieldStorage()
filepath = urllib.unquote(form.getvalue("filepath"))
formvalue = form.getvalue("IDs")

ids = []
if formvalue is not None: ids = formvalue.split(",")

rfile = open(qedconf.BASE_PATH + filepath)
for idx, line in enumerate(rfile):
    if idx == 0:
        print line.rstrip()
    else:
        for id in ids:
            if id in line:
                print line.rstrip()
                break

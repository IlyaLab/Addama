#!/usr/bin/env python

import cgi;
import os
import urllib
import qedconf


print "Content-Type: application/json\n"

form = cgi.FieldStorage()
filepath = urllib.unquote(form.getvalue("filepath") or '/')

dirs=[]
files=[]
for f in os.listdir(qedconf.BASE_PATH + filepath):
    if not f.startswith("."):
        label = os.path.basename(f)
        item = '{"label":"%s", "uri":"%s"}' % (label, os.path.join(filepath,f))

        if os.path.isdir(qedconf.BASE_PATH + filepath + f):
            dirs.append(item)
        else:
            files.append(item)

print '{ "directories": [' + ",".join(dirs) + '], "files": [' + ",".join(files) + '] }'

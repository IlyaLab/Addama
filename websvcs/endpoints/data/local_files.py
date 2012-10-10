from tornado.options import options
import tornado.web
import os
import sys
from auth_decorator import authenticated

class LocalFileHandler(tornado.web.RequestHandler):
    @authenticated
    def get(self,filepath):
        self.content_type = "text/plain"
        try:
            rows=self.get_arguments("rows")
            if len(rows) > 0:
                rows = rows[0].split(",")
            cols=self.get_arguments("cols")
            if len(cols) > 0:
                cols = frozenset(cols[0].split(","))

            goodcols=[0]

            if len(rows) > 0 or len(cols)>0:


                rfile = open(options.data_path + filepath)
                for idx, line in enumerate(rfile):
                    if idx == 0:
                        colhead = line.rstrip("\n\r").split()
                        if len(cols) > 0:
                            for i,h in enumerate(colhead):
                                if h in cols:
                                    goodcols.append(i)
                        goodcols=frozenset(goodcols)
                        _writeFilteredRow(self,line,goodcols)


                    elif len(rows)==0:
                        _writeFilteredRow(self,line,goodcols)
                    else:
                        rheaader = line[:line.rfind("\t")]
                        for id in rows:
                            if id in rheaader:
                                _writeFilteredRow(self, line, goodcols)
                                break
            elif os.path.isdir(options.data_path + filepath):
                dirs=[]
                files=[]
                for f in os.listdir(options.data_path + filepath):
                    if not f.startswith("."):
                        label = os.path.basename(f)
                        item = '{"label":"%s", "uri":"%s"}' % (label, os.path.join(filepath,f))

                        if os.path.isdir(options.data_path + filepath + f):
                            dirs.append(item)
                        else:
                            files.append(item)

                self.write('{ "directories": [' + ",".join(dirs) + '], "files": [' + ",".join(files) + '] }')
            else:
                rfile = open(options.data_path + filepath)
                self.write(rfile.read())
                rfile.close()

        except:
            raise tornado.web.HTTPError(500, str(sys.exc_info()[1]))

def _writeFilteredRow(self,line,cols):
    if len(cols)==1:
        self.write(line)
    else:
        vs=line.rstrip("\n\r").split("\t")

        self.write("\t".join([vs[i] for i in cols]))
        self.write("\n")

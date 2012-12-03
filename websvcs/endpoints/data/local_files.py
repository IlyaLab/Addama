from tornado.options import options, logging
import tornado.web
import os
import sys
import json
import csv
from auth_decorator import authenticated

class LocalFileHandler(tornado.web.RequestHandler):
    @authenticated
    def get(self,filepath):
        try:
            rows=self.get_arguments("rows")
            cols=self.get_arguments("cols")
            if len(rows) > 0: rows = rows[0].split(",")
            if len(cols) > 0: cols = frozenset(cols[0].split(","))

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
                        rheader = line[:line.rfind("\t")]
                        for id in rows:
                            if id in rheader:
                                _writeFilteredRow(self, line, goodcols)
                                break

            elif os.path.isdir(options.data_path + filepath):
                dirs=[]
                files=[]

                for f in os.listdir(options.data_path + filepath):
                    if not f.startswith("."):
                        item = { "label": os.path.basename(f), "uri": os.path.join(self.request.uri, f) }
                        if os.path.isdir(os.path.join(options.data_path + filepath, f)):
                            dirs.append(item)
                        else:
                            files.append(item)

                self.write({ "directories": dirs, "files": files })
            else:
                rfile = open(options.data_path + filepath)
                outputArg = self.get_argument("output", "json")
                if outputArg == "tsv" and filepath.endswith(".json"):
                    json_items = json.loads(rfile.read())
                    WriteTsv(self, json_items["items"])
                    self.set_status(200)
                    return

                while True:
                    thisline = rfile.readline()
                    if thisline.startswith("##"):
                        continue
                    else:
                        self.write(thisline)
                    self.write(rfile.read())
                    break
                rfile.close()

        except:
            raise tornado.web.HTTPError(404, str(sys.exc_info()[1]))

def _writeFilteredRow(self,line,cols):
    if len(cols)==1:
        self.write(line)
    else:
        vs=line.rstrip("\n\r").split("\t")

        self.write("\t".join([vs[i] for i in cols]))
        self.write("\n")

def WriteTsv(handler, items):
    handler.set_header("Content-Type", "text/tab-separated-values")
    handler.set_header("Content-Disposition", "attachment; filename='data_export.tsv'")

    tsvwriter = csv.writer(handler, delimiter='\t')
    excludedheaders = ["uri","id"]
    if len(items) > 0:
        colheaders = [a for a in items[0].keys() if a not in excludedheaders]
        tsvwriter.writerow(colheaders)
        for item in items:
            vals = []
            for colheader in colheaders:
                val = item[colheader]
                if isinstance(val, (list, tuple)):
                    vals.append(len(val))
                else:
                    vals.append(val)
            tsvwriter.writerow(vals)


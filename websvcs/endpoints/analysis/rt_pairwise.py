from tornado.options import options, logging, define
from tornado.escape import url_unescape
import tornado.web
import os

define("data_path", default=".", help="Path to pre-processed files")
define("executable", default=".", help="Path to executable")
define("port", default=8321, help="run on the given port", type=int)
define("verbose", default=False, help="Prints debugging statements")

from subprocess import Popen, PIPE, STDOUT
import json
import urllib

server_settings = {
    "xheaders" : True,
    "address" : "0.0.0.0"
}

settings = {
    "debug": True
}

class RealtimePairwise(tornado.web.RequestHandler):
    def get(self):
        if options.verbose:
            logging.info("[%s] [%s]" % (self.request.uri, self.request.arguments))
            logging.info("query=[%s]" % (self.request.query))

        cleanquery = urllib.unquote(self.request.query)
        if options.verbose:
            logging.info("cleanquery=%s" % cleanquery)

        query = {}
        for qarg in cleanquery.split("&"):
            argsplit = qarg.split("=")
            key = argsplit[0]
            val = argsplit[1]
            if not key in query:
                query[key] = []
            query[key].append(val)

        cancer = query["cancer"]
        feature1 = query["feature1"]
        feature2 = query["feature2"]

        if options.verbose:  logging.info("query=%s" % str(query))

        c = cancer[0]
        f = os.path.join(options.data_path, c.upper())

        p = Popen([options.executable, f], stdout=PIPE, stdin=PIPE, stderr=STDOUT)
        for f1 in feature1:
            for f2 in feature2:
                pairstr = "%s\t%s\n" % (self.decode_argument(f1),self.decode_argument(f2))
                if options.verbose:  logging.info(pairstr)
                p.stdin.write(pairstr)

        rtpw_result = p.communicate()[0]
        if options.verbose: logging.info("results=%s" % rtpw_result)

        if "error" in rtpw_result:
            self.write(rtpw_result)
            self.set_status(500)
            return

        edges = []
        for line in rtpw_result.split("\n"):
            if options.verbose: logging.info("line=%s" % line)
            if len(line) > 0:
                parts = line.split("\t")
                edge = {
                    "node1": {
                        "id": parts[0]
                    },
                    "node2": {
                        "id": parts[1]
                    },
                    "analysisType": parts[2],
                    "count": parts[3],
                    "pvalue": parts[4],
                    "rho": parts[5]
                }
                edges.append(edge)

        self.write({ "edges": edges, "cancer": c })
        self.set_status(200)

def main():
    tornado.options.parse_command_line()

    logging.info("Starting Tornado web server on http://localhost:%s" % options.port)
    logging.info("--data_path=%s" % options.data_path)
    logging.info("--executable=%s" % options.executable)
    logging.info("--verbose=%s" % options.verbose)

    application = tornado.web.Application([
        (r"/", RealtimePairwise),
        (r"/svc/rt_pairwise", RealtimePairwise),
    ], **settings)
    application.listen(options.port, **server_settings)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
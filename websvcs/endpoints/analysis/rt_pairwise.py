from tornado.options import options, logging, define
import tornado.web

define("data_path", default=".", help="Path to pre-processed files")
define("executable", default=".", help="Path to executable")
define("port", default=8321, help="run on the given port", type=int)

from subprocess import Popen, PIPE, STDOUT
import json

server_settings = {
    "xheaders" : True,
    "address" : "0.0.0.0"
}

settings = {
    "debug": True
}

class RealtimePairwise(tornado.web.RequestHandler):
    def get(self):
        logging.info("[%s] [%s]" % (self.request.uri, self.request.arguments))

        args = self.request.arguments

        cancer = args["cancer"]

        jsonin = self.request.arguments
        print "json=%s" % str(jsonin)
        print "cancer=%s" % cancer
        print "jsonin=%s" % str(jsonin)

        p = Popen([options.executable, options.data_path], stdout=PIPE, stdin=PIPE, stderr=STDOUT)

        feature_ids = self.request.arguments["feature_ids"]
        print feature_ids
        fids = json.load(feature_ids)
        print fids['pairs']

        for pair in pairs:
            p.stdin.write('%s\t%s\n' % (pair.node1, pair.node2))
        rtpw_result = p.communicate()[0]
        print(rtpw_result)

        edges = []
        for line in rtpw_result.split("\n"):
            print "line=%s" % line
            if len(line) > 0:
                parts = line.split("\t")
                edge = {
                    "node1": parts[0],
                    "node2": parts[1],
                    "analysisType": parts[2],
                    "count": parts[3],
                    "pvalue": parts[4],
                    "rho": parts[5]
                }
                edges.append(edge)

        self.write({ "edges": edges, "cancer": cancer })
        self.set_status(200)

def main():
    tornado.options.parse_command_line()

    logging.info("Starting Tornado web server on http://localhost:%s" % options.port)
    logging.info("--data_path=%s" % options.data_path)
    logging.info("--executable=%s" % options.executable)

    application = tornado.web.Application([
        (r"/", RealtimePairwise),
    ], **settings)
    application.listen(options.port, **server_settings)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
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
        feature1 = args["feature1"]
        feature2 = args["feature2"]

        print "feature1=%s" % str(feature1)
        print "feature2=%s" % str(feature2)
        print "cancer=%s" % cancer

        p = Popen([options.executable, options.data_path], stdout=PIPE, stdin=PIPE, stderr=STDOUT)
        for f1 in feature1:
            for f2 in feature2:
                p.stdin.write("%s\t%s\n" % (f1,f2))

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
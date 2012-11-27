import json
import tornado.web
from tornado import httpclient
from tornado.httpclient import HTTPRequest, HTTPClient
from tornado.httputil import url_concat
from tornado.options import options, logging

class RegulomeExplorerDbQueryHandler(tornado.web.RequestHandler):
    def get(self, identity):
        logging.info("uri=%s [%s] [%s]" % (self.request.uri, identity, self.request.arguments))

        args = self.request.arguments

        cancer_mappings= {
            "brca": "brca_pw_manuscript"
        }

        gene = args["gene"][0]
        source = args["source"][0]
        dataset = cancer_mappings[args["cancer"][0]]
        logging.info("query=[%s][%s][%s]" % (gene, source, dataset))

        cli = HTTPClient()
        response = cli.fetch("http://explorer.cancerregulome.org/data/distributed_select/?q=%2Bf1source%3A%22" + source + "%22%2Bf1label%3A(%22" + gene + "%22)%20%2Blogged_pvalue%3A%5B6%20TO%20*%5D&sort=logged_pvalue%20desc&rows=200&fl=alias1%2Calias2%2Cf1qtinfo%2Cf2qtinfo%2Clink_distance%2Clogged_pvalue%2Ccorrelation%2Cnum_nonna&wt=json&fq=%2Bdataset%3A" + dataset)
        cli.close()
        self.write(response.body)
        self.set_status(200)

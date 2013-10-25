from tornado.options import options, logging

import tornado.web
import pymongo
import csv

class MongoDbQueryHandler(tornado.web.RequestHandler):
    def initialize(self):
        self._datastore_map = {}
        for datastore_id, uri in options.mongo_datastores:
            self._datastore_map[datastore_id] = uri
    
    def get(self, url_parameters):

        logging.info("uri=%s [%s] [%s]" % (self.request.uri, url_parameters, self.request.arguments))
        
        # Remove trailing slashes
        url_parameters =  url_parameters.rstrip('/')
        
        split_url = url_parameters.strip().split('/')
        if len(split_url) != 3:
            logging.info("invalid URI \'%s\'" % (url_parameters))
            raise tornado.web.HTTPError(404)
        
        datastore_name, db_name, collection_name = split_url
        datastore_uri = None

        try:
            datastore_uri = self._datastore_map[datastore_name]
        except KeyError:
            logging.info("unknown datastore \'%s\'" % (datastore_name))
            raise tornado.web.HTTPError(404)
        
        collection = None
        try:
            collection = self.open_collection(datastore_uri, db_name, collection_name)
        except pymongo.errors.ConnectionFailure as cfe:
            raise tornado.web.HTTPError(500, str(cfe))

        # TODO : Improve this logic to correctly parse arguments and convert to a proper mongo DB query
        args = self.request.arguments
        query = {}

        case_sensitive_lookups = frozenset(options.case_sensitive_lookups)
        normalize_fn = lambda x: x.lower()
        if db_name in case_sensitive_lookups:
            normalize_fn = lambda x: x

        for key in args.keys():
            if key != "output":
                iargs = args[key]
                if len(iargs) == 1:
                    query[key] = normalize_fn(args[key][0])
                else:
                    query[key] = {"$in": map(normalize_fn, args[key])}
        
        query_limit = options.mongo_rows_limit
        json_items = []
        for idx, item in enumerate(collection.find(query)):
            if idx > query_limit:
                break

            json_item = self.jsonable_item(item)
            #json_item["uri"] = self.request.uri + "/" + json_item["id"]
            json_items.append(json_item)

        if self.get_argument("output", "json") == "tsv":
            WriteTsv(self, json_items)
            self.set_status(200)
            return

        self.write({"items": json_items})
        self.set_status(200)
        return

    def open_collection(self, mongo_uri, db_name, collection_name):
        if options.verbose: logging.info("open_collection(%s)" % collection_name)

        connection = pymongo.Connection(mongo_uri)
        database = connection[db_name]
        return database[collection_name]

    def jsonable_item(self, item):
        json_item = {}
        for k in item.iterkeys():
            if k == "_id":
                json_item["id"] = str(item["_id"])
            elif "[]" in k:
                json_item[k.replace("[]", "")] = item[k]
            else:
                json_item[k] = item[k]
        return json_item

def WriteTsv(handler, items):
    handler.set_header("Content-Type", "text/tab-separated-values")
    handler.set_header("Content-Disposition", "attachment; filename='data_export.tsv'")

    tsvwriter = csv.writer(handler, delimiter='\t')
    excludedheaders = ["uri","id","p_ns_s"]
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


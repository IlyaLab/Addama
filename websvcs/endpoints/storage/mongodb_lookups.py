from tornado.options import options, logging

from itertools import product
import json
import tornado.web
import pymongo
import csv

class MongoDbLookupHandler(tornado.web.RequestHandler):

    def get(self, identity):
        logging.info("uri=%s [%s] [%s]" % (self.request.uri, identity, self.request.arguments))

        ids = identity.split("/")
        db_name = ids[1]
        collection = self.open_collection(db_name, ids[2])

        # TODO : Improve this logic to correctly parse arguments and convert to a proper mongo DB query
        args = self.request.arguments
        query = {}

        case_sensitive_lookups = frozenset(options.case_sensitive_lookups)
        normalize_fn = None
        if db_name in case_sensitive_lookups:
            normalize_fn = lambda x: x
        else:
            normalize_fn = lambda x: x.lower()

        for key in args.keys():
            iargs = args[key]
            if len(iargs) == 1:
                query[key] = normalize_fn(args[key][0])
            else:
                query[key] = {"$in": map(normalize_fn, args[key])}

        query_limit = options.mongo_lookup_query_limit
        json_items = []
        for idx, item in enumerate(collection.find(query)):
            if idx > query_limit:
                break

            json_item = self.jsonable_item(item)
            json_item["uri"] = self.request.uri + "/" + json_item["id"]
            json_items.append(json_item)

        if self.get_argument("output", "json") == "tsv":
            WriteTsv(self, json_items)
            self.set_status(200)
            return

        self.write({"items": json_items})
        self.set_status(200)
        return

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

    def open_collection(self, db_name, collection_name):
        #if options.verbose:
        logging.info("open_collection(%s)" % collection_name)

        connection = pymongo.Connection(options.mongo_lookup_uri)
        database = connection[db_name]
        return database[collection_name]


class MongoDbPairwiseLookupHandler(tornado.web.RequestHandler):
    def get(self, identity):
        logging.info("uri=%s [%s] [%s]" % (self.request.uri, identity, self.request.arguments))

        args = self.request.arguments

        ids = identity.split("/")

        feature_matrix_name = ids[1]
        gene_label_1 = args['gene1'][0]
        gene_label_2 = args['gene2'][0]
        cancer_label = args['cancer'][0].lower()

        # Get feature IDs
        fmx_collection = self.open_feature_matrix_collection("qed_lookups", "fmx_" + feature_matrix_name)
        pairwise_collection = self.open_pairwise_collection("qed_lookups", "pw_" + feature_matrix_name + "_" + cancer_label)

        features_1 = filter(self.feature_filter_fn, fmx_collection.find({"cancer": cancer_label, "gene": gene_label_1}))
        features_2 = filter(self.feature_filter_fn, fmx_collection.find({"cancer": cancer_label, "gene": gene_label_2}))
        feature_ids_1 = map(lambda f: f['id'], features_1)
        feature_ids_2 = map(lambda f: f['id'], features_2)

        # Get pairwise values
        pairwise_results = []
        for id1, id2 in product(feature_ids_1, feature_ids_2):
            pw = self.get_pairwise_result(pairwise_collection, id1, id2)
            if pw is not None:
                pairwise_results.append(pw)

        result = {
            "features": {
                gene_label_1: map(self.jsonable_item, features_1),
                gene_label_2: map(self.jsonable_item, features_2)
            },
            "pairwise_results": map(self.jsonable_item, pairwise_results)
        }

        log_msg = "Features found: "
        log_msg += gene_label_1 + ": " + str(len(feature_ids_1))
        log_msg += "\t" + gene_label_2 + ": " + str(len(feature_ids_2))
        log_msg += "\tPairwise results: " + str(len(pairwise_results))

        logging.info(log_msg)

        self.write(json.dumps(result))
        self.set_status(200)

    def feature_filter_fn(self, feature):
        fields = feature['id'].split(':')
        source = fields[1]

        if source == 'METH' or source == 'CNVR' or source == 'GEXP':
            return True
        elif source == 'GNAB' and fields[-1] == 'y_n_somatic':
            return True
        else:
            return False

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

    def get_pairwise_result(self, collection, id1, id2):
        res1 = collection.find_one({"target": id1, "predictor": id2})
        res2 = collection.find_one({"target": id2, "predictor": id1})
        if res1 is not None:
            return res1
        elif res2 is not None:
            return res2
        else:
            return None

    def open_feature_matrix_collection(self, db_name, collection_name):
        logging.info("open_collection(%s)" % collection_name)
        return self.open_collection(options.mongo_lookup_uri, db_name, collection_name)

    def open_pairwise_collection(self, db_name, collection_name):
        logging.info("open_collection(%s)" % collection_name)
        return self.open_collection(options.mongo_pairwise_lookup_uri, db_name, collection_name)

    def open_collection(self, mongo_uri, db_name, collection_name):
        logging.info("open_collection(%s)" % collection_name)

        connection = pymongo.Connection(mongo_uri)
        database = connection[db_name]
        return database[collection_name]


class MongoDbMutSigHandler(tornado.web.RequestHandler):
    def get(self, identity):
        logging.info("uri=%s [%s] [%s]" % (self.request.uri, identity, self.request.arguments))

        args = self.request.arguments

        query = {}
        for key in args.keys():
            if key != "cancer":
                continue
            iargs = args[key]
            if len(iargs) == 1:
                query[key] = args[key][0].lower()
            else:
                query[key] = {"$in": map(lambda x: x.lower(), args[key])}

        if "max_rank" not in args:
            query["rank"] = {"$lt": 21}
        else:
            query["rank"] = {"$lt": int(args["max_rank"][0]) + 1}

        collection = self.open_collection("qed_lookups", "mutsig_rankings")
        items = []

        if "cancer" in query:
            items = collection.find(query)

        result = {
            "items": map(self.jsonable_item, items)
        }

        if self.get_argument("output", "json") == "tsv":
            WriteTsv(self, json_items)
            self.set_status(200)
            return

        self.write(json.dumps(result))
        self.set_status(200)

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

    def open_collection(self, db_name, collection_name):
        logging.info("open_collection(%s)" % collection_name)

        connection = pymongo.Connection(options.mongo_lookup_uri)
        database = connection[db_name]
        return database[collection_name]


class MongoDbFeaturesByLocationHandler(tornado.web.RequestHandler):
    def get(self, identity):
        logging.info("uri=%s [%s] [%s]" % (self.request.uri, identity, self.request.arguments))

        args = self.request.arguments
        ids = identity.split("/")

        query = {
            "chr": str(args["chr"][0]),
            "start": {"$gt": int(args["start"][0])},
            "end": {"$lt": int(args["end"][0])},
            "cancer": {"$in": map(lambda x: x.lower(), args["cancer"])},
            "source": {"$in": map(lambda x: x.lower(), args["source"])}
        }

        logging.info("query=%s" % str(query))

        query_limit = options.mongo_lookup_query_limit
        collection = self.open_collection(ids[1], ids[2])

        items = []
        for idx, item in enumerate(collection.find(query, {'values':0})):
            if idx > query_limit: break
            items.append(item)

        self.write(json.dumps({ "items": map(self.jsonable_item, items) }))
        self.set_status(200)

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

    def open_collection(self, db_name, collection_name):
        logging.info("open_collection(%s)" % collection_name)

        connection = pymongo.Connection(options.mongo_lookup_uri)
        database = connection[db_name]
        return database[collection_name]

def WriteTsv(handler, items):
    handler.set_header("Content-Type", "text/tab-separated-values")
    handler.set_header("Content-Disposition", "attachment; filename='data_export.tsv'")

    tsvwriter = csv.writer(handler, delimiter='\t')
    if len(items) > 0:
        colheaders = items[0].keys()
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


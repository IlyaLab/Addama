from tornado.options import options
import tornado.web
from auth_decorator import authenticated
import pymongo
from bson import objectid

class MongoDbStorageHandler(tornado.web.RequestHandler):
    @authenticated
    def get(self, identity):
        whoami = self.get_secure_cookie("whoami")

        ids = identity.split("/")
        if len(ids) == 1:
            collection = self.mongodb_collection(ids[0])

            json_items = []
            for item in collection.find({ 'owner': whoami }):
                json_item = self.jsonable_item(item)
                json_item["uri"] = self.request.uri + "/" + json_item["id"]
                json_items.append(json_item)

            self.write({ "items": json_items })
            self.set_status(200)
            return

        elif len(ids) == 2:
            collection = self.mongodb_collection(ids[0])
            item = collection.find_one({"_id": objectid.ObjectId(ids[1]), "owner": whoami })
            if not item is None:
                json_item = self.jsonable_item(item)
                json_item["uri"] = self.request.uri
                self.write(json_item)
                self.set_status(200)
                return
            else:
                self.set_status(404)
                return

        self.set_status(404)

    @authenticated
    def post(self, identity):
        whoami = self.get_secure_cookie("whoami")

        ids = identity.split("/")
        if len(ids) <= 0: raise tornado.web.HTTPError(401)

        stored_item = self.request.arguments
        stored_item["owner"] = whoami

        # Figure out issue where label is getting set as an array
        labels = stored_item["label"]
        if not labels is None and type(labels) is list: stored_item["label"] = labels[0]

        collection = self.mongodb_collection(ids[0])
        insert_id = str(collection.insert(stored_item))

        self.write({ "id": insert_id, "uri": self.request.uri + "/" + insert_id })
        self.set_status(200)

    def jsonable_item(self, item):
        json_item = {}
        for k in item.iterkeys():
            if k == "_id":
                json_item["id"] = str(item[k])
            else:
                json_item[k] = item[k]
        return json_item

    def mongodb_collection(self, collection_name):
        connection = pymongo.Connection(options.mongo_uri)
        qed_db = connection["qed_store"]
        return qed_db[collection_name]

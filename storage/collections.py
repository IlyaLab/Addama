import logging
from tornado.options import options
import tornado.web
import pymongo
import json
from bson import objectid
from oauth.decorator import CheckAuthorized
from oauth.basehandler import AuthenticatedRequestHandler

RESERVED_COLLECTIONS = ["google_oauth_tokens", "private_userinfo", "admin", "local"]

class MongoDbListCollectionsHandler(AuthenticatedRequestHandler):
    @CheckAuthorized
    def get(self):
        conn = pymongo.Connection(options.mongo_storage_uri)
        db = conn[options.mongo_storage_db]
        collections = db.collection_names(include_system_collections=False)

        items = []
        for c_id in collections:
            if not c_id in RESERVED_COLLECTIONS:
                items.append({ "id": c_id, "uri": "/" + self.request.path.strip("/") + "/" + c_id })
        self.write({"items": items})
        self.set_status(200)

class MongoDbCollectionsHandler(AuthenticatedRequestHandler):
    @CheckAuthorized
    def get(self, identity):
        ids = self.check_identity(identity)
        if len(ids) == 1:
            collection = open_collection(ids[0])

            json_items = []
            for item in collection.find({ "owner": self.opt_current_user() }):
                json_item = jsonable_item(item)
                json_item["uri"] = "/" + self.request.path.strip("/") + "/" + json_item["id"]
                json_items.append(json_item)

            self.write(json_items)
            self.set_status(200)
            return

        elif len(ids) == 2:
            collection = open_collection(ids[0])
            item = collection.find_one({"_id": objectid.ObjectId(ids[1]), "owner": self.opt_current_user() })
            if not item is None:
                json_item = jsonable_item(item)
                json_item["uri"] = "/" + self.request.path.strip("/")
                self.write(json_item)
                self.set_status(200)
                return
            else:
                self.set_status(404)
                return

        self.set_status(404)

    @CheckAuthorized
    def post(self, identity):
        # create
        ids = self.check_identity(identity)

        logging.info("collections.post:" + str(ids))

        stored_item = json.loads(self.request.body)
        stored_item["owner"] = self.opt_current_user()

        # Figure out issue where label is getting set as an array
        labels = stored_item["label"]
        if not labels is None and type(labels) is list: stored_item["label"] = labels[0]

        insert_id = open_collection(ids[0]).insert(stored_item)

        self.write({ "id": str(insert_id) })
        self.set_status(200)

    @CheckAuthorized
    def put(self, identity):
        # update
        ids = self.check_identity(identity)

        logging.info("collections.put:" + str(ids))

        stored_item = json.loads(self.request.body)
        stored_item["owner"] = self.opt_current_user()

        # Figure out issue where label is getting set as an array
        labels = stored_item["label"]
        if not labels is None and type(labels) is list: stored_item["label"] = labels[0]

        if "id" in stored_item: del stored_item["id"]
        logging.info("stored_item.id=" + str(stored_item));

        update_id = ids[1]
        open_collection(ids[0]).update({ "_id": objectid.ObjectId(update_id) }, stored_item )

        self.write(stored_item)
        self.set_status(200)

    @CheckAuthorized
    def delete(self, identity):
        # delete
        ids = self.check_identity(identity)

        logging.info("collections.delete:" + str(ids))

        item_id = objectid.ObjectId(ids[1])
        if item_id is not None:
            open_collection(ids[0]).remove({ "_id": item_id })
            self.write({ "id": str(item_id) })
            self.set_status(200)
        else:
            self.set_status(404)

    def check_identity(self, identity):
        ids = identity.split("/")
        if len(ids) <= 0:
            logging.error("unknown identity [%s]:" % identity)
            raise tornado.web.HTTPError(401)

        if ids[0] in RESERVED_COLLECTIONS:
            current_user = self.opt_current_user()
            logging.error("trying to accessing reserved information [%s,%s]:" % (current_user, identity))
            raise tornado.web.HTTPError(403, "you are not allowed to view this data")

        return ids

def jsonable_item(item):
    json_item = {}
    for k in item.iterkeys():
        if k == "_id":
            json_item["id"] = str(item["_id"])
        elif "[]" in k:
            json_item[k.replace("[]", "")] = item[k]
        elif k != "owner":
            json_item[k] = item[k]
    return json_item

def open_collection(collection_name):
    if collection_name in RESERVED_COLLECTIONS: raise tornado.web.HTTPError(403)

    conn = pymongo.Connection(options.mongo_storage_uri)
    db = conn[options.mongo_storage_db]
    return db[collection_name]

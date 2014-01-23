import logging
from tornado.options import options
import tornado.web
import pymongo
import json
from bson import objectid
from oauth.decorator import OAuthenticated

class MongoDbCollectionsHandler(tornado.web.RequestHandler):
    @OAuthenticated
    def get(self, identity):
        ids = self.check_identity(identity)
        if len(ids) == 1:
            collection = open_collection(ids[0])

            json_items = []
            for item in collection.find({ "owner": self.get_secure_cookie("whoami") }):
                json_items.append(jsonable_item(item))

            self.write(json.dumps(json_items))
            self.set_status(200)
            return

        elif len(ids) == 2:
            collection = open_collection(ids[0])
            item = collection.find_one({"_id": objectid.ObjectId(ids[1]), "owner": self.get_secure_cookie("whoami") })
            if not item is None:
                json_item = jsonable_item(item)
                self.write(json_item)
                self.set_status(200)
                return
            else:
                self.set_status(404)
                return

        self.set_status(404)

    @OAuthenticated
    def post(self, identity):
        # create
        ids = self.check_identity(identity)

        logging.info("collections.post:" + str(ids))

        stored_item = json.loads(self.request.body)
        stored_item["owner"] = self.get_secure_cookie("whoami")

        # Figure out issue where label is getting set as an array
        labels = stored_item["label"]
        if not labels is None and type(labels) is list: stored_item["label"] = labels[0]

        insert_id = open_collection(ids[0]).insert(stored_item)

        self.write({ "id": str(insert_id) })
        self.set_status(200)

    @OAuthenticated
    def put(self, identity):
        # update
        ids = self.check_identity(identity)

        logging.info("collections.put:" + str(ids))

        stored_item = json.loads(self.request.body)
        stored_item["owner"] = self.get_secure_cookie("whoami")

        # Figure out issue where label is getting set as an array
        labels = stored_item["label"]
        if not labels is None and type(labels) is list: stored_item["label"] = labels[0]

        if "id" in stored_item: del stored_item["id"]
        logging.info("stored_item.id=" + str(stored_item));

        update_id = ids[1]
        open_collection(ids[0]).update({ "_id": objectid.ObjectId(update_id) }, stored_item )

        self.write(stored_item)
        self.set_status(200)

    @OAuthenticated
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

        if ids[0] == "private_userinfo":
            whoami = self.get_secure_cookie("whoami")
            logging.error("accessing private_userinfo [%s,%s]:" % (whoami, identity))
            raise tornado.web.HTTPError(401, "you are not allowed to view this data")

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
    connection = pymongo.Connection(options.mongo_storage_uri)
    qed_db = connection[options.mongo_storage_db]
    return qed_db[collection_name]

def GetUserinfo(whoami):
    logging.info("GetUserinfo(%s)" % whoami)

    collection = open_collection("private_userinfo")
    return collection.find_one({ "whoami": whoami })

def SaveUserinfo(whoami, userinfo):
    logging.info("SaveUserinfo(%s)" % whoami)

    existing_user = GetUserinfo(whoami)
    userinfo["whoami"] = whoami

    collection = open_collection("private_userinfo")
    if existing_user is None:
        collection.insert(userinfo)
    else:
        collection.update(existing_user, userinfo)

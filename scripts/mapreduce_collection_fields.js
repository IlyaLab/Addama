/*
 - Reads all collections in the database, and extract all fields, preparing a lookup collection
 - Writes to "collection_fields" collection

 - Documents in collection will look like this:
    { "_id" : <field_A>, "value" : <collection_name> }

 Usage:

 mongo --host=$HOST $DB_NAME mapreduce_collection_fields.js

 // TODO : Organize output better
 */

var mapFn = function () {
    for (var field in this) {
        if (field === "_id") continue;
        emit(field, null);
    }
};

var reduceFn = function (field) {
    return field;
};

var finalizeFn = function() {
    return target_collection;
};

db.collection_fields.drop();

db.getCollectionNames().forEach(function (collection_name) {
    if (collection_name === "system.indexes") return;
    if (collection_name === "collection_fields") return;

    print("mapReducing: db." + collection_name);
    db[collection_name].mapReduce(mapFn, reduceFn, {
        "out": {
            "merge": "collection_fields"
        },
        "scope": {
            "target_collection": collection_name
        },
        "finalize": finalizeFn
    });
});

print("captured " + db.collection_fields.count() + " unique fields in db.collection_fields");

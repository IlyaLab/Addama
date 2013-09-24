import os

class DataFile(object):
    def __init__(self, path):
        self.set_path(path)    
    
    @classmethod
    def fromdict(cls, filedict):
        return cls(filedict["path"])

    def get_path(self):
        return self._path
    
    def set_path(self, path):
        if not os.path.isfile(path):
            raise ValueError("Data file does not exist: " + path)
        self._path = os.path.abspath(path)
    
    path = property(get_path, set_path)


class ImportConfig(object):
    def __init__(self, host, port, database, collection, files):
        self.set_host(host)
        self.set_port(port)
        self.set_database(database)
        self.set_collection(collection)
        self.set_files(files)
    
    @classmethod
    def fromargs(cls, args, file_list_field="FILES"):
        host = args.host
        port = args.port
        database = args.db
        collection = args.collection        
        files = map(DataFile, args.__getattribute__(file_list_field))
        
        return cls(host, port, database, collection, files)
    
    @classmethod
    def fromdict(cls, config_dict):
        required_fields = frozenset(['host', 'port', 'database', 'collection', 'files'])
        
        for field in required_fields:
            if field not in config_dict:
                raise Exception("Required field '" + field + "' is missing")

        host = config_dict['host']
        port = config_dict['port']
        database = config_dict['database']
        collection = config_dict['collection']
        files = map(DataFile.fromdict, config_dict['files'])
        
        return cls(host, port, database, collection, files)

    def get_host(self):
        return self._host
    
    def set_host(self, host):
        self._host = host

    def get_port(self):
        return self._port
    
    def set_port(self, port):
        self._port = port

    def get_database(self):
        return self._database
    
    def set_database(self, database):
        self._database = database

    def get_collection(self):
        return self._collection
    
    def set_collection(self, collection):
        self._collection = collection

    def get_files(self):
        return self._files
    
    def set_files(self, files):
        self._files = files
    
    host = property(get_host, set_host)
    port = property(get_port, set_port)
    database = property(get_database, set_database)
    collection = property(get_collection, set_collection)
    files = property(get_files, set_files)



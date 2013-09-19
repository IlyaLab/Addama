import argparse
import csv
import json
import os
import pymongo
import sys


def iterate_tsv_rows(descriptor):
    file_path = descriptor['path']
    with open(file_path, 'rb') as csvfile:
        print('Processing ' + file_path)

        csvreader = csv.DictReader(csvfile, delimiter='\t')

        count = 0
        skipped = 0

        for row in csvreader:
            try:
                result = {}
                for k,v in row.iteritems():
                    if k is None:
                        raise Exception("No key for value " + str(v))
                    result[k] = v
                
                yield result
                count += 1
            
            except Exception as e:
                print("   Skipping row")
                print("      Error: " + str(e))
                print("      Content: " + str(row))
                skipped += 1
        
        print("Finished processing " + file_path)
        info = '{0:10} rows inserted,'.format(count)
        info += ' {0:10} row skipped'.format(skipped)
        print('   ' + info)


def validate_import_config(config):
    required_fields = frozenset(['host', 'port', 'database', 'collection', 'files'])
    
    for field in required_fields:
        if field not in config:
            raise Exception("Required field '" + field + "' is missing")

    for file_desc in config['files']:
        # The file has to exist
        file_path = file_desc['path']
        if not os.path.isfile(file_path):
            raise Exception("Data file does not exist: " + file_path)
        file_desc['path'] = os.path.abspath(file_path)


def load_config_json(file_path):
    json_file = open(file_path, 'rb')
    data = json.load(json_file)
    json_file.close()
    return data


def connect_database(hostname, port):
    connection = pymongo.Connection(hostname, port)
    return connection


def build_file_descriptor(filepath):
    return {
        "path": filepath
    }


def build_config(args):
    return {
        "host": args.host,
        "port": args.port,
        "database": args.db,
        "collection": args.collection,
        "files": [
            build_file_descriptor(args.TSV[0])
        ]
    }


def run_import(import_config):
    print("running")
    host = import_config['host']
    port = import_config['port']
    database = import_config['database']
    collection = import_config['collection']
    
    # Try open connection first, exit in case of failure
    conn = None
    try:
        conn = connect_database(host, port)
    except pymongo.errors.ConnectionFailure:
        print("Failed to connect to database at " + host + ":" + str(port))
        sys.exit(1)

    collection = conn[database][import_config['collection']]

    for file_info in import_config['files']:
        for row_obj in iterate_tsv_rows(file_info):
            collection.insert(row_obj)

    conn.close()


def run_from_command_line_args(args):
    import_config = None

    try:
        import_config = build_config(args)
        validate_import_config(import_config)
    
    except Exception as e:
        print('Error while processing command line arguments: ' + str(e))
        print('Quitting...')
        sys.exit(1)
        
    run_import(import_config)


def run_from_config_file(args):
    import_config = None

    try:
        import_config = load_config_json(args.FILE[0])
        validate_import_config(import_config)

    except Exception as e:
        print('Error while reading import configuration JSON: ' + str(e))
        print('Quitting...')
        sys.exit(1)
        
    run_import(import_config)


def main():
    mainparser = argparse.ArgumentParser(description="TSV to MongoDB import utility")
    
    subparsers = mainparser.add_subparsers()
    cmd_line_parser = subparsers.add_parser('import', help="Read all parameters from command line")
    
    cmd_line_parser.add_argument('--host', required=True, help='Hostname')
    cmd_line_parser.add_argument('--port', required=True, type=int, help='Port')
    cmd_line_parser.add_argument('--db', required=True, help='Database name')
    cmd_line_parser.add_argument('--collection', required=True, help='Collection name')
    cmd_line_parser.add_argument('TSV', nargs=1, help='Path to TSV-file')

    config_file_parser = subparsers.add_parser("from-json", help="Read data import configuration from a JSON-file")
    config_file_parser.add_argument('FILE', nargs=1, help='Path to configuration JSON-file')

    args = mainparser.parse_args()

    if 'TSV' in args:
        run_from_command_line_args(args)
    else:
        run_from_config_file(args)


if __name__ == "__main__":
    main()

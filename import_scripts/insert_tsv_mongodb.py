import argparse
import csv
import json
import pymongo
import sys

from importtools import ImportConfig


TOGGLE_QUIET = False
DRY_RUN = False

def info_print(msg):
    global TOGGLE_QUIET
    if TOGGLE_QUIET is False:
        print(msg)


def iterate_tsv_rows(data_file):
    file_path = data_file.path
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
                info_print("   Skipping row")
                info_print("      Error: " + str(e))
                info_print("      Content: " + str(row))
                skipped += 1
        
        print("Finished processing " + file_path)
        info = '{0:10} rows inserted,'.format(count)
        info += ' {0:10} row skipped'.format(skipped)
        print('   ' + info)


def load_config_json(file_path):
    json_file = open(file_path, 'rb')
    data = json.load(json_file)
    json_file.close()
    return data


def connect_database(hostname, port):
    connection = pymongo.Connection(hostname, port)
    return connection


def run_import(import_config):
    global DRY_RUN

    host = import_config.host
    port = import_config.port
    
    # Try open connection first, exit in case of failure
    conn = None
    try:
        conn = connect_database(host, port)
    except pymongo.errors.ConnectionFailure:
        print("Failed to connect to database at " + host + ":" + str(port))
        sys.exit(1)

    collection = conn[import_config.database][import_config.collection]

    for file_info in import_config.files:
        for row_obj in iterate_tsv_rows(file_info):
            if not DRY_RUN:
                collection.insert(row_obj)

    conn.close()


def run_from_command_line_args(args):
    run_config = None

    try:
        run_config = ImportConfig.fromargs(args)
    
    except Exception as e:
        print('Error while processing command line arguments: ' + str(e))
        print('Quitting...')
        sys.exit(1)
        
    run_import(run_config)


def run_from_config_file(args):
    run_config = None

    try:
        import_config = load_config_json(args.FILE[0])
        run_config = ImportConfig.fromdict(import_config)

    except Exception as e:
        print('Error while reading import configuration JSON: ' + str(e))
        print('Quitting...')
        sys.exit(1)
        
    run_import(run_config)


def main():
    mainparser = argparse.ArgumentParser(description="TSV to MongoDB import utility")
    
    subparsers = mainparser.add_subparsers()
    cmd_line_parser = subparsers.add_parser('import', help="Read all parameters from command line")
    
    cmd_line_parser.add_argument('--host', required=True, help='Hostname')
    cmd_line_parser.add_argument('--port', required=True, type=int, help='Port')
    cmd_line_parser.add_argument('--db', required=True, help='Database name')
    cmd_line_parser.add_argument('--collection', required=True, help='Collection name')
    cmd_line_parser.add_argument('--quiet', required=False, action='store_true', help='If enabled, no printouts are done in case of parsing errors')
    cmd_line_parser.add_argument('--dry-run', required=False, action='store_true', help='If enabled, no transactions are done to the database')
    cmd_line_parser.add_argument('FILES', nargs=1, help='Path to TSV-file')

    config_file_parser = subparsers.add_parser("from-json", help="Read data import configuration from a JSON-file")
    config_file_parser.add_argument('--quiet', required=False, action='store_true', help='If enabled, no printouts are done in case of parsing errors')
    config_file_parser.add_argument('--dry-run', required=False, action='store_true', help='If enabled, no transactions are done to the database')
    config_file_parser.add_argument('FILE', nargs=1, help='Path to configuration JSON-file')

    args = mainparser.parse_args()

    if args.quiet is True:
        global TOGGLE_QUIET
        TOGGLE_QUIET = True

    if args.dry_run is True:
        global DRY_RUN
        DRY_RUN = True
    
    if 'FILES' in args:
        run_from_command_line_args(args)
    else:
        run_from_config_file(args)


if __name__ == "__main__":
    main()

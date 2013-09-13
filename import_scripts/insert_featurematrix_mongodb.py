import argparse
import csv
import json
import os
import pymongo
import sys


def feature_id_extract(feature):
    feature_parts = feature.split(":")
    source = feature_parts[1].lower()

    if "chr" in feature_parts[3]:
        start = feature_parts[4]
        end = feature_parts[5]
        if not start:
            start = -1
        if not end:
            end = -1

        return {
            "id": feature,
            "type": feature_parts[0],
            "source": source,
            "gene": feature_parts[2].lower(),
            "label": feature_parts[2],
            "chr": feature_parts[3][3:],
            "start": int(start),
            "end": int(end),
            "strand": feature_parts[6],
            "modifier": feature_parts[7]
        }

    return {
        "id": feature,
        "type": feature_parts[0],
        "source": source,
        "label": feature_parts[2],
        "modifier": feature_parts[7]
    }


def build_value_dict_categorical(ids, values):
    result = {}
    for i, v in zip(ids, values):
            result[i] = v

    return result


def build_value_dict_numerical(ids, values):
    result = {}
    for i, v in zip(ids, values):
        if v == 'NA':
            result[i] = v
        else:
            result[i] = float(v)

    return result


def add_annotations(target_dict, annotations):
    for key, value in annotations.items():
        if key not in target_dict:
            target_dict[key] = value


def iterate_features(descriptor):
    file_path = descriptor['path']
    with open(file_path, 'rb') as csvfile:
        csvreader = csv.reader(csvfile, delimiter='\t')

        ids = csvreader.next()[1:]

        print('Processing ' + file_path)

        count = 0
        skipped = 0

        for row in csvreader:
            feature_id = row[0]
            values = row[1:]

            if len(values) != len(ids):
                print('   Skipping feature (' + len(values) + '/' + len(ids) + ')' + feature_id)
                skipped += 1
                continue

            feature_object = feature_id_extract(feature_id)

            if "annotations" in descriptor:
                add_annotations(feature_object, descriptor["annotations"])

            if feature_object['type'] == 'N':
                feature_object['values'] = build_value_dict_numerical(ids, values)
            else:
                feature_object['values'] = build_value_dict_categorical(ids, values)

            count += 1

            yield feature_object

        info = '{0:10} IDs'.format(len(ids))
        info += ' {0:10} features'.format(count)
        info += ' {0:10} skipped'.format(skipped)
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


def load_config_json(file_path):
    print(file_path)
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
        for feature_object in iterate_features(file_info):
            collection.insert(feature_object)

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
    mainparser = argparse.ArgumentParser(description="Feature matrix to MongoDB import utility")
    
    subparsers = mainparser.add_subparsers()
    cmd_line_parser = subparsers.add_parser('import', help="Read all parameters from command line")
    
    cmd_line_parser.add_argument('--host', required=True, help='Hostname')
    cmd_line_parser.add_argument('--port', required=True, type=int, help='Port')
    cmd_line_parser.add_argument('--db', required=True, help='Database name')
    cmd_line_parser.add_argument('--collection', required=True, help='Collection name')
    cmd_line_parser.add_argument('TSV', nargs=1, help='Path to configuration feature matrix TSV-file')

    config_file_parser = subparsers.add_parser("from-json", help="Read data import configuration from a JSON-file")
    config_file_parser.add_argument('FILE', nargs=1, help='Path to configuration JSON-file')

    args = mainparser.parse_args()

    if 'TSV' in args:
        run_from_command_line_args(args)
    else:
        run_from_config_file(args)


if __name__ == "__main__":
    main()

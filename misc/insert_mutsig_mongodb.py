import argparse
import csv
import os
import pymongo
import sys


def iterate_genes(file_path, cancer):
    cancer = cancer.lower()

    with open(file_path, 'rb') as csvfile:
        print('Processing ' + file_path)

        csvreader = csv.DictReader(csvfile, delimiter='\t')
        count = 0

        for row in csvreader:
            # Convert integer fields
            for key in ['rank', 'N', 'n', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'nsite', 'nsil']:
                row[key] = int(row[key])

            row['cancer'] = cancer
            row['gene'] = row['gene'].lower()

            yield row
            count += 1

        info = '{0:10} rows processed'.format(count)
        print('   ' + info)


def connect_database(hostname, port):
    connection = pymongo.Connection(hostname, port)
    return connection


def main():
    parser = argparse.ArgumentParser(description="MutSig to MongoDB import utility")
    parser.add_argument('--mutsig-file', required=True, help='Path to MutSig output file')
    parser.add_argument('--cancer-type', required=True, help='Cancer type')
    parser.add_argument('--host', required=True, help='Hostname')
    parser.add_argument('--port', required=True, type=int, help='Port')
    parser.add_argument('--db', required=True, help='Database name')
    parser.add_argument('--collection', required=True, help='Collection name')

    args = parser.parse_args()

    # Try open connection first, exit in case of failure
    conn = None
    try:
        conn = connect_database(args.host, args.port)
    except pymongo.errors.ConnectionFailure:
        print("Failed to connect to database at " + args.host + ":" + str(args.port))
        sys.exit(1)

    collection = conn[args.db][args.collection]

    for mutsig_dict in iterate_genes(args.mutsig_file, args.cancer_type.lower()):
        collection.insert(mutsig_dict)

    conn.close()


if __name__ == "__main__":
    main()

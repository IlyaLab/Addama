import argparse
import csv
import pymongo
import sys


def iterate_mutations(file_path):
    fieldnames = ['cancer', 'gene', 'mutation_type', 'patient_id', 'uniprot_id', 'mutation_id', 'location', 'start_aa', 'end_aa']

    with open(file_path, 'rb') as csvfile:
        print('Processing ' + file_path)

        csvreader = csv.DictReader(csvfile, delimiter='\t', fieldnames=fieldnames)
        count = 0

        for row in csvreader:
            if row['uniprot_id'] == 'UNIPROT_FAIL':
                continue

            # Convert integer fields
            for key in ['location']:
                row[key] = int(row[key])

            row['cancer'] = row['cancer'].lower()
            row['gene'] = row['gene'].lower()

            yield row
            count += 1

        info = '{0:10} rows processed'.format(count)
        print('   ' + info)


def connect_database(hostname, port):
    connection = pymongo.Connection(hostname, port)
    return connection


def main():
    parser = argparse.ArgumentParser(description="Mutations to MongoDB import utility")
    parser.add_argument('--mutations-file', required=True, help='Path to mutation summary file')
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

    for mutation_dict in iterate_mutations(args.mutations_file):
        collection.insert(mutation_dict)

    conn.close()


if __name__ == "__main__":
    main()

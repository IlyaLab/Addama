import argparse
import csv
import pymongo
import sys

# File format is tab separated values without a header line.
def iterate_data(file_path):
    fieldnames = ['cancer', 'type', 'q_value', 'gene']

    with open(file_path, 'rb') as csvfile:
        print('Processing ' + file_path)

        csvreader = csv.DictReader(csvfile, delimiter='\t', fieldnames=fieldnames)
        count = 0

        for row in csvreader:
            # Convert float fields
            for key in ['q_value']:
                row[key] = float(row[key])

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
    parser = argparse.ArgumentParser(description="Copy number q-values to MongoDB import utility")
    parser.add_argument('--data-file', required=True, help='Path to data file')
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

    for result in iterate_data(args.data_file):
        collection.insert(result)

    conn.close()


if __name__ == "__main__":
    main()

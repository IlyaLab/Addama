import argparse
import csv
import os
import pymongo
import sys


def iterate_files(dir_path):
    for filename in os.listdir(dir_path):
        # Filenames are assumed to contain only the cancer label,
        # eg. 'GBM'
        fileparts = filename.strip().lower().split('.')
        if (len(fileparts) != 1):
            continue

        cancer = fileparts[0].lower()

        yield {
        'cancer': cancer,
        'name': filename,
        'path': os.path.join(dir_path, filename)
        }


# File format description.
#
# First line:
# Gene Symbol     Locus ID        Cytoband        [sample IDs ... ]
#
# Following lines:
# <gene>     <locus_id>        <cytoband>        [values ... ]
def iterate_data(descriptor):
    file_path = descriptor['path']

    with open(file_path, 'rb') as csvfile:
        csvreader = csv.reader(csvfile, delimiter='\t')

        # Read IDs from header line
        ids = csvreader.next()[3:]

        print('Processing ' + file_path)

        count = 0
        skipped = 0

        for row in csvreader:
            gene = row[0].lower()
            locus_id = row[1]
            cytoband = row[2].lower()
            values = row[3:]

            if len(values) != len(ids):
                print('   Skipping gene ' + gene + ' (' + len(values) + '/' + len(ids) + ')')
                skipped += 1
                continue

            value_dicts = []
            for v, sample_id in zip(values, ids):
                value_dicts.append({'id': sample_id, 'v': float(v)})

            result = {
            'cancer': descriptor['cancer'],
            'gene': gene,
            'locus_id': int(locus_id),
            'cytoband': cytoband,
            'values': value_dicts
            }

            count += 1

            yield result

        info = '{0:10} IDs'.format(len(ids))
        info += ' {0:10} genes'.format(count)
        info += ' {0:10} skipped'.format(skipped)
        print('   ' + info)


def connect_database(hostname, port):
    connection = pymongo.Connection(hostname, port)
    return connection


def main():
    parser = argparse.ArgumentParser(description="Gene focal data to MongoDB import utility")
    parser.add_argument('--data-dir', required=True, help='Path to directory containing data files')
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

    for file_descriptor in iterate_files(args.data_dir):
        for result in iterate_data(file_descriptor):
            collection.insert(result)

    conn.close()


if __name__ == "__main__":
    main()

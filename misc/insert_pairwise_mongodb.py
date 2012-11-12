import argparse
import csv
import os
import pymongo
import sys


def iterate_files(dir_path):
    for filename in os.listdir(dir_path):
        # Suppose that file name format is '<cancer>.<name>.<date>.TP.NCI.pwpv',
        # for example 'brca.newMerge.05nov.TP.NCI.pwpv'
        fileparts = filename.strip().lower().split('.')
        if (len(fileparts) != 6):
            continue

        subtype = fileparts[0]
        name = fileparts[1]
        filedate = fileparts[2]
        filetype = fileparts[5]

        if filetype == 'pwpv':
            yield {
            'subtype': subtype,
            'name': name,
            "date": filedate,
            'path': os.path.join(dir_path, filename)
            }


def iterate_pairwise_results(descriptor):
    file_path = descriptor['path']
    with open(file_path, 'rb') as csvfile:
        csvreader = csv.reader(csvfile, delimiter='\t')

        print('Processing ' + file_path)

        count = 0
        skipped = 0

        for row in csvreader:
            firstchar = row[0][0]
            if firstchar == '#' or firstchar == ' ':
                continue

            target_id = row[0]
            predictor_id = row[1]

            try:
                values = map(float, row[2:])
            except ValueError:
                print('   Skipping line \"' + '\t'.join(row) + '\"')
                skipped += 1
                continue

            count += 1

            yield {
            "target": target_id,
            "predictor": predictor_id,
            "values": values
            }

        info = '{0:10} pairwise results'.format(count)
        info += ' {0:10} skipped'.format(skipped)
        print('   ' + info)


def connect_database(hostname, port):
    connection = pymongo.Connection(hostname, port)
    return connection


def main():
    parser = argparse.ArgumentParser(description="TCGA pairwise to MongoDB import utility")
    parser.add_argument('--pw-dir', required=True, help='path to directory containing the pairwise output files')
    parser.add_argument('--host', required=True, help='hostname')
    parser.add_argument('--port', required=True, type=int, help='port')
    parser.add_argument('--db', required=True, help='database name')
    parser.add_argument('--collection', required=True, help='collection name prefix')
    parser.add_argument('--max-results-per-file', required=False, type=int, help='maximum number of results to be imported from a single pairwise output file')

    args = parser.parse_args()

    # Try open connection first, exit in case of failure
    conn = None
    try:
        conn = connect_database(args.host, args.port)
    except pymongo.errors.ConnectionFailure:
        print("Failed to connect to database at " + args.host + ":" + str(args.port))
        sys.exit(1)

    database = conn[args.db]

    for pw_descriptor in iterate_files(args.pw_dir):
        collection = database[args.collection + '_' + pw_descriptor['subtype']]

        for count, result in enumerate(iterate_pairwise_results(pw_descriptor)):
            if args.max_results_per_file is not None:
                if count == args.max_results_per_file:
                    break

            collection.insert(result)

    conn.close()


if __name__ == "__main__":
    main()

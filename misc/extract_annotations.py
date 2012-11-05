#!/usr/bin/env python
"""
Generates annotations file from an associations file, expects first two columns to be representative of features

Using Feature IDs of the form:

Extracts the following columns:

Usage:
    python extract_annotations.py RF_ACE_ASSOCIATIONS_FILE > json_output_file

"""

import sys
import json

from optparse import OptionParser

processed_features = []

def processFile(filename, options):
    if options.verbose: print "processFile(%s)" % filename

    f = open(filename)

    json_out = { "items" : [] }
    for line in f.readlines():
        if not line.startswith("##"):
            cols = line.split("\t")
            feature_a = feature_id_extract(cols[0])
            feature_b = feature_id_extract(cols[1])
            if not feature_a is None: json_out["items"].append(feature_a)
            if not feature_b is None: json_out["items"].append(feature_b)

    print json.dumps(json_out, indent=4)

def feature_id_extract(feature):
    if feature in processed_features:
        return None

    processed_features.append(feature)

    feature_parts = feature.split(":")

    if "chr" in feature:
        start = feature_parts[5]
        end = feature_parts[6]
        if not start: start = -1
        if not end: end = -1

        return {
            "feature_id": feature,
            "type": feature_parts[0],
            "source": feature_parts[1],
            "gene": feature_parts[2],
            "label": feature_parts[2],
            "modifier": feature_parts[3],
            "chr": feature_parts[4][3:],
            "start": int(start),
            "end": int(end),
            "strand": feature_parts[7]
        }

    return {
        "feature_id": feature,
        "type": feature_parts[0],
        "source": feature_parts[1],
        "label": feature_parts[2],
        "modifier": feature_parts[3]
    }

if __name__ == "__main__":
    parser = OptionParser(usage="%prog ASSOCIATIONS_FILE")
    parser.add_option("-v", "--verbose", action="store_true", dest="verbose", default=False, help="Prints debugging statements")

    (options, args) = parser.parse_args()

    filename = args[0]
    if not filename is None:
        processFile(filename, options)
        exit(0)

    parser.print_help()

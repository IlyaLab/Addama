import argparse
import csv
import os
import sys
import types

from collections import defaultdict, OrderedDict

class DataRectangleBuilder():
    def __init__(self, row_idx, sample_idx, value_idx, missing_value, input_delim, output_header):
        self.row_idx = row_idx
        self.sample_idx = sample_idx
        self.value_idx = value_idx
        self.missing_value = missing_value
        self.input_column_delimiter = input_delim
        self.enable_header_output = output_header

        # Sparse data goes here
        self.data = defaultdict(list)
        self.sample_ids = OrderedDict()
        self.current_sample_index = 0

        # Default compound row ID column names
        self.row_id_column_names = ['ID' + str(i) for i in range(len(self.row_idx))]

    @classmethod
    def fromArray(cls, input_array, row_idx, sample_idx, value_idx, missing_value, input_delim, output_header):
        instance = cls(row_idx, sample_idx, value_idx, missing_value, input_delim, output_header)
        instance.input_array = input_array

        def getInputIterator(self):
            for row_elem in self.input_array:
                yield row_elem

        # Add as a member function
        instance.getInputIterator = types.MethodType(getInputIterator, instance)
        return instance

    @classmethod
    def fromFileHandle(cls, input_file_handle, row_idx, sample_idx, value_idx, missing_value, input_delim, output_header):
        instance = cls(row_idx, sample_idx, value_idx, missing_value, input_delim, output_header)
        instance.input_file_handle = input_file_handle

        def getInputIterator(self):
            for input_row in csv.reader(self.input_file_handle, delimiter=self.input_column_delimiter):
                # Filter out empty lines
                if input_row:
                    yield input_row

        # Add as a member function
        instance.getInputIterator = types.MethodType(getInputIterator, instance)

        return instance

    def getIndexForSampleID(self, sample_id):
        if sample_id not in self.sample_ids:
            self.sample_ids[sample_id] = self.current_sample_index
            self.current_sample_index += 1

        return self.sample_ids[sample_id]

    def addOutputRowColumn(self, column_name, column_index):
        self.row_id_column_names.append((column_name, column_index))

    def addDataPoint(self, row_id, sample_id, value):
        self.data[row_id].append((self.getIndexForSampleID(sample_id), value))

    def setOutputColumnNames(self, names):
        if len(names) != len(self.row_idx):
            raise ValueError("Wrong number of column names - expected " + str((len(self.row_idx))) + ", got " + str(len(names)))
        self.row_id_column_names= [str(name) for name in names]

    def getRectangleGen(self):
        for row_id, row_samples in self.data.items():
            row_values = [self.missing_value] * len(self.sample_ids)

            for sample_index, value in row_samples:
                row_values[sample_index] = value

            row_content = list(row_id)
            row_content.extend(row_values)

            yield row_content

    def build_header_line(self):
        sample_ids = self.sample_ids.keys()
        header_row = self.row_id_column_names + sample_ids
        return header_row

    def _processInputData(self):
        for input_row in self.getInputIterator():
            row_id = tuple([input_row[i] for i in self.row_idx])
            sample_id, value = input_row[self.sample_idx], input_row[self.value_idx]
            self.addDataPoint(row_id, sample_id, value)

    def outputToFileHandle(self, output_file_handle, output_column_delimiter):
        tsvwriter = csv.writer(output_file_handle,delimiter=output_column_delimiter)

        self._processInputData()

        if (self.enable_header_output):
            tsvwriter.writerow(self.build_header_line())

        for row in self.getRectangleGen():
            tsvwriter.writerow(row)

    def getOutputArray(self):
        result = []
        self._processInputData()

        if (self.enable_header_output):
            result.append(self.build_header_line())

        for row in self.getRectangleGen():
            result.append(row)

        return result

def main():
    mainparser = argparse.ArgumentParser(description="Data rectangle utility")
    subparsers = mainparser.add_subparsers()
    cmd_line_parser = subparsers.add_parser('rect', help="Build data rectangle")
    cmd_line_parser.add_argument('--row-id-col', required=False, default=0, type=int,
                                 help='Feature identifier(s) column index')
    cmd_line_parser.add_argument('--sample-id-col', required=False, default=1, type=int,
                                 help='Sample identifier column index')
    cmd_line_parser.add_argument('--value-col', required=False, default=2, type=int,help='Value column index')
    cmd_line_parser.add_argument('--infile', required=False, type=str,
                                 help='Input file path. If not specified, input is read from stdin.')
    cmd_line_parser.add_argument('--outfile', required=False, type=str,
                                 help='Output file path. If not specified, output to stdout.')
    cmd_line_parser.add_argument('--in-delimiter', required=False, type=str, default="\t",
                                 help='Column delimiter for input')
    cmd_line_parser.add_argument('--out-delimiter', required=False, type=str, default="\t",
                                 help='Column delimiter for output')
    cmd_line_parser.add_argument('--na', required=False, type=str, default="NA",
                                 help='Missing value identifier')
    cmd_line_parser.add_argument('--header', action="store_true", default=False, help="Output header")
    cmd_line_parser.add_argument('--row-id-column-names', required=False, nargs='+', default=[], type=str, help="Compound row ID column names for output")

    args = mainparser.parse_args()

    # Setup input
    infile = None
    if args.infile is not None and os.path.isfile(args.infile):
        infile = open(args.infile)
    else:
        infile = sys.stdin

    # Setup output
    outfile = None
    if args.outfile is not None:
        outfile = open(args.outfile, 'w')
    else:
        outfile = sys.stdout

    rect = DataRectangleBuilder.fromFileHandle(infile, args.row_id_col, args.sample_id_col, args.value_col, args.na, args.in_delimiter, args.header)

    if len(args.row_id_column_names) > 0:
        rect.setOutputColumnNames(args.row_id_column_names)

    rect.outputToFileHandle(outfile, args.out_delimiter)

    infile.close()
    outfile.close()

if __name__ == "__main__":
    main()

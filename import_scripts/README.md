## Using the import scripts

All import scripts can be run either completely from the command line or using a configuration file.

When running from command line only, the following parameters are required:

* *--host* Hostname of the MongoDB server
* *--port* Port to connect to
* *--db* Name of database in the MongoDB server
* *--collection* Name of the collection in the database

The following optional parameters are supported while running from command line only or when using a configuration file:

* *--dry-run* If present, no transactions are done to the database. The input files are still parsed and possible error messages are printed.
* *--quiet* If present, no error messages are printed if errors occur while parsing the input files


When using a configuration file, all of the above parameters are passed in in the configuration. The format of the configuration files is [JSON](http://www.json.org/). A configuration file must have the following fields:

* *host* Hostname of the MongoDB server
* *port* Port to connect to
* *database* Name of database in the MongoDB server
* *collection* Name of the collection in the database
* *files* List of files to be imported

Example configuration files can be found in the [config_examples](https://github.com/cancerregulome/OAuthWebServices/tree/master/import_scripts/config_examples) directory.

## Importing feature matrices

### File format

File format for feature matrices is TSV. The first line of the file must contain the sample identifiers, starting from the second column. The content of the first column of the first line is ignored. The rest of the lines in the file must contain the feature identifier on in the first column and values in the rest of the columns.

### Annotations

The feature matrix import script supports optional annotations that are added to each document inserted to the database. To use the annotation feature, the import script has to be run using a configuration file. The annotations are specified in each object in the *files* section of the configuration.

An example configuration file for feature matrices with annotations can be found [here](https://github.com/cancerregulome/OAuthWebServices/blob/master/import_scripts/config_examples/feature_matrix_import_with_annotations.json).

```
{
    "host": "hostname",
    "port": 27017,
    "database": "featurematrix_database",
    "collection": "fmx_collection",
    "files": [
		{
		    "path": "/path/to/feature_matrix.tsv",
		    "annotations": {
				"cancer": "BLCA"
		    }
		}
    ]
}
```

Using above configuration file, each feature inserted from the feature matrix file **feature_matrix.tsv** will have an additional field 'cancer' with the value 'BLCA'.

### Running the import script from command line:

```
python2.7 insert_feature_matrix_mongodb.py import --host hostname --port 27017 --db database_name --collection collection_name feature_matrix_file.tsv
```

### Running the script using a configuration file:

```
python2.7 insert_featurematrix_mongodb.py from-json import_config.json
```

## Importing plain TSV files

### File format

The first line in the input file must contain the field names. The rest of the lines in the file are inserted into the database.

### Field data types

The import script supports defining data types for the columns of a TSV file. In the configuration section for each input file, the data types are defined in the optional *field_types* section. This section maps column names to data type identifiers. The supported data types are *integer number*, *floating point number* and *string*, the identifiers being respectively 'int', 'float' and 'str'.

An example configuration file with data type definitions can be found [here](https://github.com/cancerregulome/OAuthWebServices/blob/master/import_scripts/config_examples/tsv_import_with_data_types.json).

```
{
    "host": "hostname",
    "port": 27017,
    "database": "database_name",
    "collection": "collection_name",
    "files": [
	{
	    "path": "/path/to/tab_separated_value_file.tsv",
	    "field_types": {
		"year": "int",
		"distance": "float"
	    }
	}
    ]
}
```

Using the above configuration, column *year* will be interpreted as an integer number and column *distance* as a floating point number.

The default data type for all columns is *string*.

### Running the import script from command line:

```
python2.7 insert_tsv_mongodb.py import --host hostname --port 27017 --db database_name --collection collection_name tab_separated_file.tsv
```

### Running the script using a configuration file:

```
python2.7 insert_tsv_mongodb.py from-json import_config.json
```

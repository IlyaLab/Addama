
from celery import Celery
from celery import chain
import subprocess
import datarect
import json
import csv

import StringIO

from subprocess import Popen, PIPE, STDOUT

app = Celery('tasks', backend = 'amqp', broker='amqp://guest@localhost//')

task_options = {
	"impala_host": 'glados11.systemsbiology.net',
	"impala_port": 21050
}

@app.task()
def jsonToObj(query_json):
	return json.loads(query_json)

@app.task()
def queryFeatureMatrixImpalaTask(query_obj):

    feature_labels = ", ".join([ '"' + feature +'"' for feature in query_obj['features'] ])
    sample_ids = ", ".join([ '"' + sample +'"' for sample in query_obj['samples'] ])

    query = """
    SELECT ffm.feature_label, sfm.case_id, vfm.value
    FROM values_fm vfm
    JOIN feature_ffm ffm USING feature_id
    JOIN sample_fm sfm USING sample_id

    WHERE ffm.feature_label IN (%s)
      AND sfm.case_id IN %s
      AND sfm.tissue_type = 'Tumor'
    """ % (feature_labels, sample_ids)

    query1 = """

	SELECT * FROM acc WHERE feature_id IN (%s)

    """ % (feature_labels)

    from impala.dbapi import connect
    conn = connect(host=task_options["impala_host"], port=task_options["impala_port"])
    cursor = conn.cursor()
    cursor.execute(query1)
    result = cursor.fetchall()
    return result
    
@app.task()
def queryVariantsImpalaTask(query_obj):
    from impala.dbapi import connect
    conn = connect(host=task_options["impala_host"], port=task_options["impala_port"])
    cursor = conn.cursor()
    cursor.execute('SELECT chr, pos, sample_id, value FROM default.variants WHERE chr = ' + 
        query_obj['chr'] + ' AND pos = ' + 
        str(query_obj['pos']) + ' limit 10000')
    result = cursor.fetchall()
    return result

@app.task()
def rectangularizeFeatureMatrixTask(columnarData):
    dataRect = datarect.DataRectangleBuilder.fromArray(input_array=columnarData, row_idx=[0], sample_idx=1, value_idx=2, missing_value="NA", input_delim="\t", output_header=True)
    dataRect.setOutputColumnNames(['feature_label'])
    output = dataRect.getOutputArray()
    return output

@app.task()
def rectangleToJSON(dataRect):
    import json
    obj = { "headers" : dataRect[0], "data" : dataRect[1:] }
    return json.dumps(obj)

@app.task()
def pairwise(matrix):
    table = [ ['feature1','feature2','pvalue'] ]

    p = Popen(['./pairwise', '-f', 'tcga'], stdout=PIPE, stdin=PIPE, stderr=PIPE)

    matrixString = StringIO.StringIO()
    writer = csv.writer(matrixString, delimiter='\t')
    
    for row in matrix:
        writer.writerow(row)

    output = p.communicate(input=matrixString.getvalue())[0]

    print "Output: " +  output
    #print "Error: " + error

    matrixString.close()    

    pairwiseString = StringIO.StringIO(output)

    reader = csv.reader(pairwiseString, delimiter='\t')

    for row in reader:
        table.append(row)

    pairwiseString.close()

    return table

@app.task()
def printString(result):
   print "Result: " + result

@app.task()
def justInTimePairwise(queryObj):
    return ( queryFeatureMatrixImpalaTask.subtask(queryObj) | rectangularizeFeatureMatrixTask.subtask() | pairwise.subtask() | rectangleToJSON.subtask() | printString.subtask() )()


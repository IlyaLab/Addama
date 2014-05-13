
from celery import Celery
import subprocess
import datarect
import json

app = Celery('tasks', backend = 'amqp', broker='amqp://guest@localhost//')

@app.task()
def jsonToObj(query_json):
	return json.loads(query_json)

@app.task()
def queryFeatureMatrixImpalaTask(query_obj, config):

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

    from impala.dbapi import connect
    conn = connect(host=config['host'], port=config['port'])
    cursor = conn.cursor()
    cursor.execute(query)
    result = cursor.fetchall()
    return result
    
@app.task()
def queryVariantsImpalaTask(query_obj, config):
    from impala.dbapi import connect
    conn = connect(host=config['host'], port=config['port'])
    cursor = conn.cursor()
    cursor.execute('SELECT chr, pos, sample_id, value FROM default.variants WHERE chr = ' + 
        query_obj['chr'] + ' AND pos = ' + 
        str(query_obj['pos']) + ' limit 10000')
    result = cursor.fetchall()
    return result

@app.task()
def rectangularizeFeatureMatrixTask(columnarData):
    dataRect = datarect.DataRectangleBuilder.fromArray(columnarData, row_idx=[0], sample_idx=2, value_idx=3, missing_value="NA", output_header=True)
    dataRect.setOutputColumnNames('feature_label')
    return dataRect.getOutputArray()      

@app.task()
def rectangleToJSON(dataRect):
    import json
    obj = { "headers" : dataRect[0], "data" : dataRect[1:] }
    return json.dumps(obj)

@app.task()
def pairwise(matrix):
    return subprocess.check_output(["./pairwise", matrix])

@app.task()
def justInTimePairwise(queryObj, config):
    return queryFeatureMatrixImpalaTask.subtask(queryObj, config) | rectangularizeFeatureMatrixTask.subtask() | rectangleToJSON.subtask()


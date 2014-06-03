# Celery Task Handler

* Handle routes to Tornado-Celery task runner
* Includes Addama authentication
* Lists available tasks

Dependencies:
* rabbitmq/mongodb/redis  (one of the three, but rabbitmq is the best supported atm)
* celery
* tornado-celery
* all task dependencies (e.g. pyimpala, kramtools/pairwise, springbok/python/datarect.py, decorated celery tasks)

Install:

```bash
sudo apt-get install rabbitmq-server
sudo pip install celery tornado-celery
cp /path/to/pairwise.so tasks/
cp /path/to/tasks.py tasks/

```

We will assign the tornado-celery server the port 8888 and have logging turned way up.
To start the celery worker and the tornado-celery server locally:

```bash
cd tasks
celery worker -A tasks --loglevel=DEBUG --concurrency=10 -n worker1.%h &
python -m tcelery --port=8888 --app=tasks &
```

Example request for pairwise task.  Addama is running on port 8001.  Note that the POST body contains a JSON that includes one array labeled "args".  
```bash
curl -H "Content-Type: application/json" -X POST -d '{ "args" : [ ["N:SAMP:percent_lymphocyte_infiltration:::::", "B:SAMP:I(Tumor|TNtype):::::", "C:CNVR:17q23.1:chr17:57925176:57930720::BRCA-TP_Gistic_ROI_d_amp"], [], ["BRCA","BLCA"] ] }' http://localhost:8001/tasks/pairwise/

```
Response
'''json
{
    "task-id": "6098f501-d9bb-428a-bc72-48c7b915c84c", 
    "state": "PENDING"
}
```

The task-id is a pointer to the requested job.  To see the current status (and the results if the job status is SUCCESS)

```bash
 curl http://localhost:8001/tasks/result/6098f501-d9bb-428a-bc72-48c7b915c84c/

```

Response
```json
{
    "task-id": "6098f501-d9bb-428a-bc72-48c7b915c84c",
    "state": "SUCCESS",
    "result": {
        "headers": ["feature1", "feature2", "types", "", "sample_count", "unadjusted_pvalue", "", "unadjusted_log10_pvalue", "adjusted_pvalue", "adjusted_log10_pvalue", "extra_info"],
        "data": [
            ["B:SAMP:I(Tumor|TNtype):::::", "C:CNVR:17q23.1:chr17:57925176:57930720::BRCA-TP_Gistic_ROI_d_amp", "CC", "+nan", "414", "-0.000", "348", "300.000", "0", "300.000", "C0"],
            ["B:SAMP:I(Tumor|TNtype):::::", "N:SAMP:percent_lymphocyte_infiltration:::::", "CN", "+0.18", "1378", "10.541", "3", "300.000", "0", "300.000", "-"],
            ["C:CNVR:17q23.1:chr17:57925176:57930720::BRCA-TP_Gistic_ROI_d_amp", "N:SAMP:percent_lymphocyte_infiltration:::::", "CN", "NA", "1032", "0.761", "1", "300.000", "346", "1.401", "-"]
        ]
    }
}
```

The "result" object contains a model of a table of data.  The "headers" array should be the same width as each element in the "data" array.

TODO
* Support multiple endpoints (POST, GET, JSON, XML?, etc)
* Handle Errors returned by Tornado-Celery
* Duck-type the values or support configuration to cast task results to proper data types (Number, Boolean, etc)


import logging

import tornado.web
from tornado.web import asynchronous, RequestHandler
from tornado.options import options

from tornado.httpclient import AsyncHTTPClient, HTTPRequest

from oauth.decorator import CheckAuthorized

import tasks

import tcelery
tcelery.setup_nonblocking_producer()

class TaskHandler(RequestHandler):

    tasks_map = {
    "pairwise" : "tasks.justInTimePairwise",
    "createFM" : "tasks.createFeatureMatrix"
    }
  
    @asynchronous
    @CheckAuthorized
    def get(self, *uri_path):
        try:
            if options.verbose: logging.info("GET [uri=%s] body=%s]" % (self.request.uri, self.request.body))

            sub_path=self.request.path.replace("/tasks","")
            uri_parts = sub_path.split("/")
            if options.verbose: logging.info("GET [sub_path=%s] [len=%d]" % (sub_path, len(uri_parts)))

            if len(uri_parts) == 1:
                self.list_tasks()
                self.set_status(200)
                return

            if uri_parts[1] == 'results' or uri_parts[1] == 'result':
                if len(uri_parts) < 3:
                    raise tornado.web.HTTPError(500, ("Task id not detected: %s " % self.request.path))
                task_request = HTTPRequest(options.taskrunner_host +"/tasks/result/" + uri_parts[2] + "/", method='GET', headers=self.request.headers, body=None )
                http_client = AsyncHTTPClient()
                http_client.fetch(task_request, self.asyncResult)
                return

            raise tornado.web.HTTPError(404, ("%s was not found" % self.request.path))
        except Exception as e:
            if options.verbose: logging.info("Exception raised on /tasks %s" % e)
            raise tornado.web.HTTPError(500, "Error executing pairwise computation.")

    @asynchronous
    @CheckAuthorized
    def post(self, *uri_path):
        try:
            if options.verbose: logging.info("POST [uri=%s] body=%s]" % (self.request.uri, self.request.body))

            sub_path = self.request.path.replace("/tasks","")
            uri_parts = sub_path.split("/")
            if options.verbose: logging.info("POST [sub_path=%s] [len=%d]" % (sub_path, len(uri_parts)))

            if len(uri_parts) == 1:
                self.list_tasks()
                self.set_status(200)
                return

            task_id = uri_parts[1]
            if not task_id in self.tasks_map.keys():
                if options.verbose: logging.info("unknown task [%s]" % task_id)
                raise tornado.web.HTTPError(404, ("task %s not found" % task_id))

            try:
               task_request = HTTPRequest(options.taskrunner_host +"/apply-async/" + self.tasks_map[task_id] + "/", method='POST', headers=self.request.headers, body = self.request.body)
               http_client = AsyncHTTPClient()
               http_client.fetch(task_request, self.asyncResult)
               return
            except Exception as e:
                raise tornado.web.HTTPError(500, "Error executing pairwise computation: %s" % e)
            
            raise tornado.web.HTTPError(404, ("%s was not found" % self.request.path))
        except Exception as e:
            if options.verbose: logging.info("Exception raised on /tasks: %s" % e)
            raise tornado.web.HTTPError(500, "Error executing pairwise computation.")
    
    def asyncResult(self, response):
        if response.error:                                                   
            print("Error:", response.error)                                  
        else:   
            self.write(str(response.body))
        self.finish()

    def list_tasks(self):
        if options.verbose: logging.info("list_tasks [%s]" % self.request.uri)

        items = []
        for task_id in self.tasks_map.keys():
            items.append({ "id": task_id, "uri": self.request.path + "/" + task_id })
        self.write({"items": items, "data_type": "tasks" })

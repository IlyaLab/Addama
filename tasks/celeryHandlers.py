import logging

import tornado.web
from tornado.web import asynchronous, RequestHandler
from tornado import options

from oauth.decorator import CheckAuthorized

import celeryTasks

import tcelery
tcelery.setup_nonblocking_producer()

class TaskHandler(RequestHandler):

    tasks_map = {
    "pairwise" : celeryTasks.justInTimePairwise
    }
    
    @asynchronous
    @CheckAuthorized
    def get(self, *uri_path):
        if options.verbose: logging.info("GET [uri=%s] body=%s]" % (self.request.uri, self.request.body))

        sub_path = self.request.path.replace("/tasks", "")
        uri_parts = sub_path.split("/")
        if options.verbose: logging.info("GET [sub_path=%s] [len=%d]" % (sub_path, len(uri_parts)))

        if len(uri_parts) == 1:
            self.list_tasks()
            self.set_status(200)
            return

    def post(self, *uri_path):
        if options.verbose: logging.info("GET [uri=%s] body=%s]" % (self.request.uri, self.request.body))

        sub_path = self.request.path.replace("/tasks", "")
        uri_parts = sub_path.split("/")
        if options.verbose: logging.info("GET [sub_path=%s] [len=%d]" % (sub_path, len(uri_parts)))

        if len(uri_parts) == 1:
            self.list_tasks()
            self.set_status(200)
            return

        task_id = uri_parts[1]
        if not task_id in self._tasks_map.keys():
            if options.verbose: logging.info("unknown task [%s]" % task_id)
            raise tornado.web.HTTPError(404, ("task %s not found" % task_id))

        config = { "host" : options['tasks_host'], "port" : options['tasks_port'] }

        try:
           query = tornado.escape.json_decode(self.request.body)
           self._tasks_map[task_id].apply_async(args=[query, config], callback=self.on_result)
        except:
            raise tornado.web.HTTPError(500, "Error executing pairwise computation.")

    def on_result(self, response):
        self.write(str(response.result))
        self.finish()


    def list_tasks(self):
        if options.verbose: logging.info("list_tasks [%s]" % self.request.uri)

        items = []
        for task_id in self._tasks_map.keys():
            items.append({ "id": task_id, "uri": self.request.path + "/" + task_id })
        self.write({"items": items, "data_type": "tasks" })


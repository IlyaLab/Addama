import logging

import re
from datetime import timedelta
from functools import partial

from tornado.options import options
from tornado import ioloop
from tornado import web
from tornado.escape import json_decode

from celery.task.control import revoke
from celery.utils import uuid
from celery.result import AsyncResult

from oauth.decorator import CheckAuthorized
from pretty_json import PrettyJsonRequestHandler

import tasks

import tcelery
tcelery.setup_nonblocking_producer()

tasks_map = {
    "pairwise" : tasks.justInTimePairwise
    }

class MainTaskHandler(PrettyJsonRequestHandler):

    @CheckAuthorized
    def get(self):
        self.write("Tasks: ")
        self.write(', '.join(filter(lambda x: not x.startswith('celery'),
                             tasks_map.keys())))

class TaskHandler(web.RequestHandler):
    

    def get_task_args(self):
            "extracts task args from a request"
            try:
                task_options = json_decode(self.request.body)
            except (TypeError, ValueError):
                raise web.HTTPError(400)

            args = task_options.pop('args', [])
            kwargs = task_options.pop('kwargs', {})
            
            if not isinstance(args, (list, tuple)):
                raise web.HTTPError(400, 'task args must be a list or tuple')

            return args, kwargs, task_options
       
  
    @CheckAuthorized
    def get(self, taskname):
        try:
            if options.verbose: logging.info("GET [uri=%s] arguments=%s]" % (self.request.uri, self.request.arguments))

            sub_path = self.request.path.replace("/tasks", "")
            uri_parts = sub_path.split("/")
            if options.verbose: logging.info("GET [sub_path=%s] [len=%d]" % (sub_path, len(uri_parts)))

            if len(uri_parts) == 1:
                self.list_tasks()
                self.set_status(200)
                return
            
            task_id = uri_parts[1]
            
            if len(uri_parts) == 2 and task_id == "":
                self.list_tasks()
                self.set_status(200)
                return
            else:
                self.write("400: Bad Request<br/>Task \'" + task_id + "\' requires a POST method with a JSON body.")
                self.set_status(400)
                return
            raise web.HTTPError(404, ("%s was not found" % self.request.path))
        except:
            if options.verbose: logging.info("Exception raised on /tasks")
            raise web.HTTPError(500, "Error executing pairwise computation.")

    @web.asynchronous
    @CheckAuthorized
    def post(self, taskname):
        try:
            task = tasks_map[taskname]
        except KeyError:
            raise web.HTTPError(404, "Unknown task '%s'" % taskname)
          
        args, kwargs, task_options = self.get_task_args()

        timeout = task_options.pop('timeout', None)
        task_id = uuid()

        htimeout = None
        if timeout:
            htimeout = ioloop.IOLoop.instance().add_timeout(
                    timedelta(seconds=timeout),
                    partial(self.on_time, task_id))

        task.apply_async(args=[ [task_options] ], kwargs=kwargs, task_id=task_id,
                         callback=partial(self.on_complete, htimeout))

    def on_complete(self, htimeout, result):
        if self._finished:
            return
        if htimeout:
            ioloop.IOLoop.instance().remove_timeout(htimeout)
        response = {'task-id': result.task_id, 'state': result.state}
        if result.successful():
            print "Result: " + result.result.get()
            response['result'] = result.result
        else:
            response['traceback'] = result.traceback
            response['error'] = result.result
        self.write(response)
        self.finish()

    def on_time(self, task_id):
        revoke(task_id)
        result = AsyncResult(task_id)
        self.write({'task-id': task_id, 'state': result.state})
        self.finish()        


    def list_tasks(self):
        if options.verbose: logging.info("list_tasks [%s]" % self.request.uri)
        items = []
        clean_path = re.sub("^|/$", "", self.request.path)
        for task_id in tasks_map.keys():
            items.append({ "id": task_id, "uri": clean_path + "/" + task_id })
        self.write({"items": items, "data_type": "tasks" })


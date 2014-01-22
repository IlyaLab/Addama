import logging

from tornado.options import options

import tornado.web
import tornado.httpclient
import json
import os
import fnmatch
from subprocess import call

PERMITTED_IPS = [
    "127.0.0.1", "204.232.175.*", "192.30.252.*"
]

class GitWebHookHandler(tornado.web.RequestHandler):
    def get(self, *args, **kwargs):
        self.post(args, kwargs)
        
    def post(self, *args, **kwargs):
        logging.info("WebHook: post()")
        if not self.isPermittedIP():
            self.set_status(401)
            return

        http_client = tornado.httpclient.HTTPClient()

        response = http_client.fetch(options.github_repo_api_url)
        repository = json.loads(response.body)
        clone_url = repository["clone_url"].replace("https", "http")

        self.pull(clone_url, options.github_project_root, "master")

        branches_url = repository["branches_url"].replace("{/branch}", "")
        response = http_client.fetch(branches_url)
        branches = json.loads(response.body)

        write_branches = []
        for i, branch in enumerate(branches):
            branch_name = branch["name"]
            if not branch_name == "master":
                deploy_path = os.path.join(options.github_branches_root, branch_name)
                logging.info("WebHook: deploying branch [%s] to [%s]" % (branch_name, deploy_path))
                self.pull(clone_url, deploy_path, branch_name)

                write_branches.append({ "name": branch_name, "label": branch_name })

        if not options.github_branches_json_path is None:
            json.dump(write_branches, open(os.path.join(options.github_branches_json_path, "branches.json"), "w"))

    def isPermittedIP(self):        
        if self.isMatchingIP(self.request.remote_ip): return True

        if "X-Forwarded-For" in self.request.headers:
            if self.isMatchingIP(self.request.headers["X-Forwarded-For"]): return True

        return False

    def isMatchingIP(self, ip):
        for permitted in PERMITTED_IPS:
            match = fnmatch.filter([ip], permitted)
            if match:
                logging.info("WebHook: isMatchingIP() [%s, %s, %s]" % (ip, permitted, match))
                return True
        return False

    def pull(self, clone_url, repo_path, branch_name):
        logging.info("WebHook: pull(%s,%s)"%(repo_path, branch_name))

        start_path = os.path.abspath(os.path.curdir)
        GIT = options.github_git_cmd

        try:
            if not os.path.exists(repo_path):
                logging.info("WebHook: new repository=%s" % repo_path)
                logging.info("WebHook: %s clone %s %s" % (GIT, clone_url, repo_path))
                call([GIT, "clone", clone_url, repo_path])

            os.chdir(repo_path)

            logging.info("WebHook: %s checkout %s to %s" % (GIT, branch_name, os.path.abspath(os.path.curdir)))
            call([GIT, "checkout", branch_name])

            logging.info("WebHook: %s pull" % GIT)
            call([GIT, "pull"])

            logging.info("WebHook: %s submodule update --init" % GIT)
            call([GIT, "submodule", "update", "--init"])

            if not options.github_postproc_cmd is None:
                appendPath = "%s %s" % (options.github_postproc_cmd, repo_path)
                logging.info("WebHook: post processing: %s" % appendPath)
                call(appendPath.split(" "))
        finally:
            os.chdir(start_path)

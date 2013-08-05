from tornado.options import options, logging
import tornado.web
import tornado.httpclient
import json
import os
from subprocess import call

PERMITTED_IPS = [
    "127.0.0.1", "204.232.175.64", "192.30.252.0", "204.232.175.64/27", "192.30.252.0/22"
]

class GitWebHookHandler(tornado.web.RequestHandler):
    def get(self, *args, **kwargs):
        self.post(args, kwargs)
        
    # TODO: Create/update branches/index.html
    def post(self, *args, **kwargs):
        logging.info("WebHook: post() called by [%s]" % self.request.remote_ip)
        if self.request.remote_ip not in PERMITTED_IPS:
            self.set_status(401)
            return

        http_client = tornado.httpclient.HTTPClient()

        response = http_client.fetch(options.github_repo_api_url)
        repository = json.loads(response.body)
        clone_url = repository["clone_url"]

        self.pull(clone_url, options.github_project_root, "master")

        branches_url = repository["branches_url"].replace("{/branch}", "")
        response = http_client.fetch(branches_url)
        branches = json.loads(response.body)
        for i, branch in enumerate(branches):
            branch_name = branch["name"]
            if not branch_name == "master":
                deploy_path = os.path.join(options.github_branches_root, branch_name)
                logging.info("WebHook: deploying branch [%s] to [%s]" % (branch_name, deploy_path))
                self.pull(clone_url, deploy_path, branch_name)

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
            call([GIT, "pull"])

            if not options.github_postproc_cmd is None:
                appendPath = "%s %s" % (options.github_postproc_cmd, repo_path)
                logging.info("WebHook: post processing: %s" % appendPath)
                call(appendPath.split(" "))
        finally:
            os.chdir(start_path)
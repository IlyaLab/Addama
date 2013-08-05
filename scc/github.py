from tornado.options import options, logging
import tornado.web
import tornado.httpclient
import json
import os
from subprocess import call

class GitWebHookHandler(tornado.web.RequestHandler):
    def get(self, *args, **kwargs):
        self.post(args, kwargs)
        
    # TODO: Block requests not from thexse Public IP addresses: 204.232.175.64/27, 192.30.252.0/22
    # TODO: Create/update branches/index.html
    # TODO: Clone project on first checkout
    def post(self, *args, **kwargs):
        logging.info("WebHook: post() called by [%s]" % self.request.remote_ip)
        self.pull_build(options.github_project_root, "master")

        http_client = tornado.httpclient.HTTPClient()
        response = http_client.fetch(options.github_branches_api)
        branches = json.loads(response.body)

        for i, branch in enumerate(branches):
            branch_name = branch["name"]
            if not branch_name == "master":
                deploy_path = os.path.join(options.github_branches_root, branch_name)
                logging.info("WebHook: deploying branch [%s] to [%s]" % (branch_name, deploy_path))
                self.pull_build(deploy_path, branch_name)

    def pull_build(self, repo_path, branch_name):
        logging.info("WebHook: pull_build(%s,%s)"%(repo_path, branch_name))

        start_path = os.path.abspath(os.path.curdir)
        logging.info("WebHook: before: %s" % start_path)

        try:
            if not os.path.exists(repo_path):
                logging.info("WebHook: new repository=%s" % repo_path)
                logging.info("WebHook: git clone %s %s" % (options.github_repo_url, repo_path))
                call(["git", "clone", options.github_repo_url, repo_path])

            os.chdir(repo_path)
            logging.info("WebHook: git checkout %s to %s" % (branch_name, os.path.abspath(os.path.curdir)))
            call(["git", "checkout", branch_name])
            call(["git", "pull"])

            if not options.github_postproc_cmd is None:
                appendPath = "%s %s" % (options.github_postproc_cmd, repo_path)
                logging.info("WebHook: post processing: %s" % appendPath)
                call(appendPath.split(" "))
        finally:
            os.chdir(start_path)
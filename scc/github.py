from tornado.options import options
import tornado.web
import tornado.httpclient
import json
import os
import git

class GitWebHookHandler(tornado.web.RequestHandler):
    # TODO: Block requests not from thexse Public IP addresses: 204.232.175.64/27, 192.30.252.0/22
    # TODO: Create/update branches/index.html
    # TODO: Clone project on first checkout
    
    def post(self, *args, **kwargs):
        self.pull_build(options.github_project_root, "master")

        http_client = tornado.httpclient.HTTPClient()
        response = http_client.fetch(options.github_branches_api)
        branches = json.loads(response.body)

        for i, branch in enumerate(branches):
            self.pull_build(os.path.join(options.github_branches_root, branch.name), branch.name)

    def pull_build(self, repo_path, branch_name):
        _repo = git.repo.base.Repo(repo_path)
        _repo.heads[branch_name].checkout()
        os.system("grunt build", repo_path)
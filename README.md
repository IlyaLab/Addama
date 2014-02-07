OAuth Enabled Web Services
================

This module is meant to standardize the deployment of web services for web applications.  It allows our team to reduce development and maintainance time, and supports rapid prototyping.

> **Operating System Support**
> The example commands in this file are directed at Linux and Mac OS X users.  However, it should be expected (unless
> explicitly noted) that these technologies are supported by the Windows operating system.

# Database Dependencies #
* MongoDB - http://docs.mongodb.org/manual/installation/

```bash
// Using Homebrew for Mac OS
brew update
brew install mongodb
```

# Python Dependencies #
* Python 2.7 - http://www.python.org/download/releases/

* Git Python
```bash
[sudo] easy_install gitpython
```

* Tornado Web
  * http://www.tornadoweb.org/
  * https://github.com/downloads/facebook/tornado/tornado-2.4.1.tar.gz

```bash
tar xvzf tornado-2.4.1.tar.gz
cd tornado-2.4
python setup.py build
sudo python setup.py install
```

> It is also possible to add the tornado directory to your PYTHONPATH instead of building with setup.py,
> since the standard library includes epoll support.

```
[sudo] easy_install -U tornado
```

* Google OAUTH2 API - https://developers.google.com/api-client-library/python/start/installation

> Obtain information and API access keys from https://code.google.com/apis/console/

```
[sudo] easy_install --upgrade google-api-python-client
```

* PyMongo - http://api.mongodb.org/python/current/installation.html

```
[sudo] easy_install -U pymongo
```
# Configuration #
> Location specified at command-line

> Provides configuration information to services running within tornado

> Configuration files **SHOULD NOT** be checked-in to individual project repositories.

```bash
cd $WEBAPP_ROOT
python svc.py --config_file=/local/path/to/svc.config
```

> Specify field datatypes within optional JSON configuration file
```bash
cd $WEBAPP_ROOT
python svc.py --config_file=/local/path/to/svc.config --config_file_json=/local/path/to/svc.config.json
```

| Property | Description | Example |
| --- | --- | --- |
| data_path | Directory containing data files to be served (e.g. feature matrices, lookups) | /local/webapps/MyWebApp/data |
| client_id | **OAUTH2** application identifier | 1234567890.apps.googleusercontent.com |
| client_secret | **OAUTH2** secret key | blwleldIKudk3B7eBldPPsSc15b8 |
| client_host | **OAUTH2** redirect address | http://example.org:3333 |
| authorized_users | Simple mechanism to limit access to the application | ["user@example.com","example@gmail.com"]
| mongo_storage_uri | Connection string for mongo database used to store application data (e.g. sessions) | mongodb://localhost:3030 |
| mongo_datastores | A list mapping datasource identifiers to connection strings for MongoDB servers used to store domain data (e.g. Feature Matrices). The datasource identifiers become parts of the URIs for accessing the data in said MongoDB servers. Queries are case **insensitive** by default.  The **optional** third value in each tuple is an array of database names for which all queries will be **case sensitive** in that datasource. | [("fmx_ds", "mongodb://hostname:3030"),("assoc_ds", "mongodb://hostname:3040", ["case_sensitive_db"])] |
| mongo_rows_limit | Limits the number of rows to return per query | 1000 |

# Initial Dev Setup #
1. Clone this repository (or use git modules within your project)
2. Install Required Dependencies (see above, link)
3. Start tornado web services ```python svc.py --config_file=/local/path/to/svc.config```
4. Open browser at http://localhost:8000

----

# GitHub WebHook Setup #
To configure this service to automatically provide a WebHook to GitHub for automated deployment, add these properties to `svc.config`:

| Property | Description | Example |
| --- | --- | --- |
| github_repo_api_url | Repository API url | https://api.github.com/repos/cancerregulome/OAuthWebServices |
| github_project_root | Path to project location | /local/temp/github/MyApp/tip |
| github_branches_root | Path to branches location | /local/temp/github/MyApp/branches |
| github_postproc_cmd | Post-processing command on repository | grunt build |
| github_git_cmd | Path to git command (optional, program assumes `git` is in PATH) | /usr/bin/git |
| github_branches_json_path | Path to publish the list of branches | /local/webroot/MyApp/branches |

WebHook will be available at http://example.com/gitWebHook to receive POST requests exclusively GitHub.com Public IP addresses: 204.232.175.*, 192.30.252.*.
The service also accepts POST requests from localhost (127.0.0.1) for testing purposes.

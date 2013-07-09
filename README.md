OAuth Enabled Web Services
================

This Web Services module is meant to standardize the deployment of web services in the Cancer Regulome project.  It
allows our team to reduce development and maintainance time, and supports rapid prototyping.

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

```
[sudo] easy_install --upgrade google-api-python-client
```

* PyMongo - http://api.mongodb.org/python/current/installation.html

```
[sudo] easy_install -U pymongo
```
# Application Configuration #
> Configuration files **SHOULD NOT** be checked-in to individual project repositories.

This template specifies the following configuration files (see examples in **examples**):

## proxy.json ##
  * Location: **app_root/examples**
  * Provides information to npm dev server
  * Configures remote and local proxies to web services

## ningx.conf ##
  * Location: **nginx_root**
  * Provides information to NGINX web server
  * Configures remote and local proxies to web services

## tornado.config ##
  * Location: specified at command-line

```bash
cd $WEBAPP_ROOT
python websvcs/tornadoapp.py --config_file=/local/path/to/tornado.config
```
  * Provides information to tornado services running within tornado

| Property | Description | Example |
| --- | --- | --- |
| data_path | Directory containing data files to be served (e.g. feature matrices, lookups) | /local/webapps/MyWebApp/data |
| client_id | **OAUTH2** application identifier | 1234567890.apps.googleusercontent.com |
| client_secret | **OAUTH2** secret key | blwleldIKudk3B7eBldPPsSc15b8 |
| client_host | **OAUTH2** redirect address | http://example.org:3333 |
| authorized_users | Simple mechanism to limit access to the application | ["user@example.com","example@gmail.com"]
| mongo_storage_uri | Connection string for mongo database used to store application data (e.g. sessions) | mongodb://localhost:3030 |
| mongo_queries_uri | Connection string for mongo database used to store domain data (e.g. Feature Matrices) | mongodb://hostname:3030 |
| mongo_rows_limit | Limits the number of rows to return per query | 1000 |

> Google OAUTH2 APIs - obtain information and API access keys from https://code.google.com/apis/console/

# Initial Dev Setup #
1. Clone this repository (or use git modules)
2. Install Required Dependencies (see above, link)
3. Start tornado web services ```python svc.py --config_file=/local/path/to/svc.config'```
4. Open browser at http://localhost:8000
QED
===
quod erat demonstrandum

Operating System Support:
  - The example commands in this file are directed at Linux and Mac OS X users.  However, it should be expected (unless otherwise noted) that these dependencies would be supported in any operating system supporting Python 2.6~2.7.

Required Dependencies
=====================
* Google APIs
 - OAuth 2.0 :: https://developers.google.com/api-client-library/python/start/installation
    easy_install --upgrade google-api-python-client
    
* MongoDB
 - PyMongo :: http://api.mongodb.org/python/current/installation.html
    [sudo] easy_install -U pymongo
 - MongoDB :: http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/
    brew update ; brew install mongodb    

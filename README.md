QED
===
quod erat demonstrandum

Operating System Support:
  - The example commands in this file are directed at Linux and Mac OS X users.  However, it should be expected (unless otherwise noted) that these dependencies would be supported in any operating system supporting Python 2.6~2.7.

Required Dependencies
=====================
* Tornado Web
  - https://github.com/downloads/facebook/tornado/tornado-2.4.tar.gz
      tar xvzf tornado-2.4.tar.gz
      cd tornado-2.4
      python setup.py build
      sudo python setup.py install
    On Python 2.6 and 2.7, it is also possible to simply add the tornado directory to your PYTHONPATH instead of building with setup.py, since the standard library includes epoll support.
    [sudo] easy_install -U tornado

* Google APIs
 - OAuth 2.0 :: https://developers.google.com/api-client-library/python/start/installation
    [sudo] easy_install --upgrade google-api-python-client
    
* MongoDB
 - PyMongo :: http://api.mongodb.org/python/current/installation.html
    [sudo] easy_install -U pymongo
 - MongoDB :: http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/
    brew update ; brew install mongodb    

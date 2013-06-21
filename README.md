http://GeneSpot.org
====
*Development Branches* :: http://genespot.org/branches

This software tool for systems biology provides a way to view TCGA data from a gene-centric point-of-view. It includes a number of interactive visualizations, and allows the user to save their current exploration. This application also enables the user to select specific cancers and genes of interest, and load data that is generated from a variety of TCGA analysis.

All software is presented AS IS to the general community.  Our priority is to continuously improve the software to serve research in systems biology and computational biology. 


Acknowledgements
=====
This project hosts software developed to support the TCGA Genomic Data Analysis Center (GDAC) at 
the [Institute for Systems Biology](http://www.systemsbiology.org) (ISB) and 
[MD Anderson Cancer Center](http://mdanderson.org).  Visit our project website at http://cancerregulome.org.

For more information, please contact codefor@systemsbiology.org or info@csacr.org.


Developer Instructions
=====
> **Operating System Support**
> The example commands in this file are directed at Linux and Mac OS X users.  However, it should be expected (unless
> explicitly noted) that these technologies are supported by the Windows operating system.

> **Browser Support**
> This web applications adopts the HTML5 standard.  Backwards compatibility with some older generation browsers 
> is resolved through use of Google Chrome Frame (http://www.google.com/chromeframe).  We will work to ensure that 
> this software supports mobile devices and tablets using HTML5 web browsers.  But we will focus our testing efforts
> on the most commonly-used platforms: iOS and Android.  Please submit an issue if there are malfunctions in the 
system on a particular device.

# Build Dependencies #
* NodeJS Package Manager (npm) - https://npmjs.org

* Brunch - http://brunch.io/

```bash
npm install -g brunch
```

# Web Server Dependencies #
* NGINX - http://wiki.nginx.org/Install

> **npm** is the recommended web development server


```bash
cd $WEBAPP_ROOT
npm install // creates node_modules includes all web server dependencies
npm start // starts dev web server at http://localhost:3333
```

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

# JavaScript Dependencies #
This build packages third-party JavaScript libraries into a single **vendor.js** file.  Developers should download 
additional libraries into the **app_root/vendor** directory, and the build system will automatically integrate them 
(see **app_root/_public**).

> These third-party JavaScript libraries, as well as the build directories (**vendor**, **node_modules**, **_public**)
> **SHOULD NOT** be checked-in to individual project repositories.

### Required JavaScript Libraries ###
  * Backbone.js -> Data model
  * Underscore.js -> Data structure utilities
  * d3.js -> Visualizations
  * jQuery -> UI, DOM manipulation, effects
  * Bootstrap.js -> UI style and structure

# Application Configuration #
> Configuration files **SHOULD NOT** be checked-in to individual project repositories.

This web application specifies the following configuration files (see examples in **app_root/examples**):

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
| web_configs | Directory containing **display.json** and **datamodel.json** (see below) | /local/webapps/MyWebApp/configurations |
| data_path | Directory containing data files to be served (e.g. feature matrices, lookups) | /local/webapps/MyWebApp/data |
| client_id | **OAUTH2** application identifier | 1234567890.apps.googleusercontent.com |
| client_secret | **OAUTH2** secret key | blwleldIKudk3B7eBldPPsSc15b8 |
| client_host | **OAUTH2** redirect address | http://example.org:3333 |
| authorized_users | Simple mechanism to limit access to the application | ["user@example.com","example@gmail.com"]
| mongo_uri | Connection string for mongo database used to store sessions | mongodb://localhost:3030 |
| mongo_lookup_uri | Connectionstring database used to store data (e.g. Feature Matrices) | mongodb://hostname:3030 |

> Google OAUTH2 APIs - obtain information and API access keys from https://code.google.com/apis/console/

## display.json ##
 * Location:  specified in **tornado.config** (see above) 
 * Specifies identifying UI elements (e.g. titles, links in the About menu)
 * Specifies links to Hangout URL

### Example configuration ###
```json
{
    "title":"TCGA Cancer Regulome :: Example",
    "hangoutUrl":"https://plus.google.com/hangouts/_?gid={app-gid}",
    "aboutLinks":[
        { 
            "label":"TCGA Home",
            "url":"http://cancergenome.nih.gov"
        }
    ]
}
```

## datamodel.json ##
 * Location:  specified in **tornado.config** (see above) 
 * Specifies data source elements such as files, directories, and data services available to the application
 * Includes information such as labels and data types

> This file allows the application to dynamically associate data sources to UI views

### Example configuration ###
```json
{
    "data_sets":{
        "label":"Data Sets",
        "mutations":{
            "label":"Mutations",
            "catalog":{
                "Protein_Mutations_Per_Cancer_Type":{
                    "id":"Protein_Mutations_Per_Cancer_Type",
                    "label":"Protein Mutations Per Cancer Type",
                    "service":"lookups/mutations",
                    "description":"This dataset was prepared from TCGA MAF files produced by Firehose",
                    "provenance":"provenance_v7_23nov_2012.txt",
                    "model":"Mutations"
                },
                "mutsig_rankings":{
                    "id":"mutsig_rankings",
                    "label":"MutSig Rankings",
                    "service":"lookups/mutsig_rankings",
                    "description":"This dataset was prepared from TCGA MutSig 2.0 data produced by Firehose"
                },
                "mutsig_top20":{
                    "id":"mutsig_top20",
                    "label":"MutSig Top20",
                    "service":"mutsig_rankings"
                },
                "mutsig_provenance":{
                    "id":"mutsig_provenance",
                    "label":"MutSig Provenance",
                    "service":"data/provenance/mutsig_provenance.json"
                }
            }
        }
    }
}
```

# Initial Dev Setup #
1. Clone this repository
2. Install Required Dependencies (see above)
3. Download Third-Party JavaScript libraries and extract into root directory
4. Execute ```npm install```
5. Execute ```npm start```
6. Start tornado web services ```python websvcs/tornadoapp.py --config_file=/local/path/to/tornado.config'```
6. Open browser at [http://localhost:3333][]

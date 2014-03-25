# Table Of Contents
 - [APIs](#apis)
    - [Main](#apis-main)
    - [Authentication](#auth)
        - [Google+ OAUTH2](#google-oauth2)
    - [Data Management](#data-mgmt)
        - [Data Files](#data-files)
        - [Data Stores (aka Databases)](#data-stores)
        - [Object Storage (using NOSQL key={})](#data-nosql)
    - [Github Web Hook](#git-webhook)
 - [Responses](#apis-responses)

----

<a name="apis"/>
# APIs

<a name="apis-main"/>
## Main
| API | Methods | Usage | Parameters | Description |
|-----|:-------------:|-----|-----|:-----:|-----|
| / | GET | ... | ... | ... |

<a name="auth"/>
## Authentication

### Providers
| API | Methods | Usage | Parameters | Description |
|-----|:-------------:|-----|-----|:-----:|-----|
| /auth/providers | GET | ... | ... | ... |
| /auth/providers/google_apis | GET, POST, PUT | ... | ... | Proxies to *https://www.googleapis.com*, signing headers with OAUTH access_token |
| /auth/providers/google_spreadsheets | GET, POST, PUT | ... | ... | Proxies to *https://spreadsheets.google.com*, signing headers with OAUTH access_token |

<a name="google-oauth2"/>
### Google+ OAUTH2
| API | Methods | Usage | Parameters | Description |
|-----|:-------------:|-----|-----|:-----:|-----|
| /auth/signin/google | POST | ... | ... | ... |
| /auth/signout/google | POST | ... | ... | ... |
| /auth/signin/google/oauth2_callback | POST | ... | ... | ... |
| /auth/signin/google/refresh | POST | ... | ... | ... |

<a name="data-mgmt"/>
## Data Management

<a name="data-files"/>
### Data Files
| API | Methods | Usage | Parameters | Description |
|-----|:-------------:|-----|-----|:-----:|-----|
| /data | GET | ... | ... | ... |

<a name="data-stores"/>
### Data Stores
| API | Methods | Usage | Parameters | Description |
|-----|:-------------:|-----|-----|:-----:|-----|
| /datastores | GET | ... | ... | ... |
| /datastores/${datastore-id} | GET | ... | ... | ... |
| /datastores/${datastore-id}/${database-id} | GET | ... | ... | ... |
| /datastores/${datastore-id}/${database-id}/${collection-id} | GET | ... | "output", "output_filename", "sort_by", "sort_direction"  | ... |

<a name="db-query-params"/>
### Database Query Parameters
| Parameter | Required | Usage | Description |
|-----|:-------------:|---------|-----|-----|
| output | false | ```?output=tsv``` | Provides tab-delimited file output for query result | 
| output_filename | false | ```?output_filename=example.tsv``` | Changes the default download filename |
| sort_by | false | ```?sort_by=field_name``` | Appends sort operation to standard query |
| sort_direction | false | ```?sort_direction=1``` or ```?sort_direction=-1``` | Indicates direction of sort. Positive value equals ASCENDING, Negative value equals DESCENDING |

<a name="data-nosql"/>
### User Specific Object Storage (must have auth cookies)
| API | Methods | Usage | Parameters | Description |
|-----|:-------------:|-----|-----|:-----:|-----|
| /storage | GET | ... | ... | ... |
| /storage/${storage-type} | GET | ... | ... | ... |
| /storage/${storage-type}/${arbitrary-uri} | GET | ... | ... | ... |
| /storage/${storage-type}/${arbitrary-uri} | POST | ... | ... | ... |
| /storage/${storage-type}/${arbitrary-uri}/${db-assigned-id} | GET | ... | ... | ... |
| /storage/${storage-type}/${arbitrary-uri}/${db-assigned-id} | PUT | ... | ... | ... |

<a name="git-webhook"/>
## Github Web Hook
| API | Methods | Usage | Parameters | Description |
|-----|:-------------:|-----|-----|:-----:|-----|
| /gitWebHook | POST | ... | ... | ... |

<a name="apis-responses"/>
## HTTP Response Codes

| Code | Status | Description |
|:-------------:|:-----:|-----|
| 200 | OK | Everything completed as expected, even if queries return zero results |
| 301 | REDIRECT | Go here instead |
| 400 | BAD REQUEST | User or developer did something wrong, the server expresses its disappointment in _users_ |
| 404 | NOT FOUND | Requested resource does not exist in databases or files, check address |
| 401 | UNAUTHORIZED | User is not authenticated, must sign in to access requested resource |
| 401 | FORBIDDEN | User is authenticated, but unauthorized to access requested resource (domain access may be limited) |
| 500 | SERVER ERROR | Bad things happened, try again, email somebody, check logs |

## Under construction
| API | Methods | Usage | Parameters | Description |
|-----|:-------------:|-----|-----|:-----:|-----|
| /storage/storage-type/query | GET | ... | ... | ... |
| /datastores/datastore-id/database-id/mapreduce?specification={} | POST | ... | ... | ... |
| /datastores/datastore-id/database-id/mapreduce/job-id | GET | ... | ... | ... |
| /websockets | GET | ... | ... | ... |
| /websockets/${topic-type}/<topic-id> | GET | ... | ... | ... |

# Table Of Contents
 - [APIs](#apis)
    - [Main](#apis-main)
    - [Authentication](#auth)
        - [Who Am I?](#auth-whoami)
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

<a name="auth-whoami"/>
### Who Am I?
| API | Methods | Usage | Parameters | Description |
|-----|:-------------:|-----|-----|:-----:|-----|
| /auth/whoami | GET | ... | ... | ... |

### Providers
| API | Methods | Usage | Parameters | Description |
|-----|:-------------:|-----|-----|:-----:|-----|
| /auth/providers | GET | ... | ... | ... |

<a name="google-oauth2"/>
### Google+ OAUTH2
| API | Methods | Usage | Parameters | Description |
|-----|:-------------:|-----|-----|:-----:|-----|
| /auth/signin/google | POST | ... | ... | ... |
| /auth/signout/google | POST | ... | ... | ... |
| /auth/signin/google/oauth2_callback | POST | ... | ... | ... |

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
## Responses

| Response Codes | Reasons | Headers | Description |
|:-------------:|-----|:-----:|-----|
| 200 | ... | ... | ... |
| 404 | ... | ... | ... |
| 409 | ... | ... | ... |

## Under construction
| API | Methods | Usage | Parameters | Description |
|-----|:-------------:|-----|-----|:-----:|-----|
| /storage/storage-type/query | GET | ... | ... | ... |
| /datastores/datastore-id/database-id/mapreduce?specification={} | POST | ... | ... | ... |
| /datastores/datastore-id/database-id/mapreduce/job-id | GET | ... | ... | ... |
| /websockets | GET | ... | ... | ... |
| /websockets/${topic-type}/<topic-id> | GET | ... | ... | ... |

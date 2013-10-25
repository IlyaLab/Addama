# Main
/

# Authentication Providers
/auth/providers

/auth/whoami

## OAUTH2 Google+
/auth/signin/google

/auth/signout/google

/auth/signin/google/oauth2_callback

# Datastores
        (r"/datastores/(.*)/(.*)/(.*)/?", MongoDbQueryHandler),

# Data File Server
        (r"/data?(.*)", LocalFileHandler),

# App Configuration Files
        (r"/configurations?(.*)", ConfigurationsFileHandler),

# Storage

# Automated Code Deployment Web Hook
/gitWebHook

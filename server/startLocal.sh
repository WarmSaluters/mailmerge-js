#/bin/bash

# set the path to the credentials.json
path=../credentials.json

# set the redirect url to http://localhost:7278/oauth2callback 
redirectUrl="http://localhost:7278/oauth2callback"

# Parse client id, client secret out of the credentials.json
clientId=$(jq -r '.installed.client_id' $path)
clientSecret=$(jq -r '.installed.client_secret' $path)

# start docker with the env vars and the path to the credentials.json
docker build -t warmsaluters/mailmerge-js-auth .
docker run -t -p 3000:3000 -e CLIENT_ID="$clientId" -e CLIENT_SECRET="$clientSecret" -e REDIRECT_URI="$redirectUrl" warmsaluters/mailmerge-js-auth
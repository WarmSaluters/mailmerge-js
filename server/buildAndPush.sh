#/bin/bash
# Use buildx to build
docker buildx build --platform linux/amd64 --tag warmsaluters/mailmerge-js-auth . --push

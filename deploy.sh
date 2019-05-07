#!/usr/bin/env bash

set -eu

while IFS= read -r FILE; do
    if [[ ! -e "$FILE" ]]; then
        echo "[!] Missing: $FILE"
        exit 1
    fi
done < "deploy.lst"

rsync -v --recursive --executability --delete --files-from=deploy.lst . radarskill:~/acimages/
ssh -t radarskill "pm2 restart acimages"

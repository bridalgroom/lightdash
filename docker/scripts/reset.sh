#!/bin/bash
set -e

if [ -z "$PGPASSWORD" ]; then 
   echo "Can't find ENV variables (PGPASSWORD), have you loaded them with 'source docker/.env' ?"
    exit 1
fi

# delete public schema on db
PGPASSWORD=$PGPASSWORD psql -p $PGPORT -h $PGHOST -d $PGDATABASE -U $PGUSER -c 'drop schema public cascade; create schema public;'

# migrate 
yarn workspace backend migrate
# seed 
yarn workspace backend seed

echo "All done"
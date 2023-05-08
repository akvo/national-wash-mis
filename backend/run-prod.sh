#!/usr/bin/env bash
# shellcheck disable=SC2155

set -eu

python manage.py migrate
python manage.py generate_config > /dev/null &
python manage.py generate_views

function log {
   echo "$(date +"%T") - START INFO - $*"
}

_term() {
  echo "Caught SIGTERM signal!"
  kill -TERM "$child" 2>/dev/null
}

trap _term SIGTERM

log Starting gunicorn in background
gunicorn nwmis.wsgi --workers 6 --timeout 300 \
	--bind 0.0.0.0:8000 \
	--access-logfile ./access.log --error-logfile ./error.log &

child=$!
wait "$child"

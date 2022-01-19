#!/usr/bin/env bash
set -exuo pipefail

PODS="backend frontend"

auth () {
    gcloud auth activate-service-account --key-file=/home/semaphore/.secrets/gcp.json
    gcloud config set project akvo-lumen
    gcloud config set container/cluster europe-west1-d
    gcloud config set compute/zone europe-west1-d
    gcloud config set container/use_client_certificate False
    gcloud auth configure-docker "eu.gcr.io"
}

auth

for POD in ${PODS}
do
    docker push "eu.gcr.io/akvo-lumen/rtmis/$POD:latest"
    echo "$POD image pushed"
done


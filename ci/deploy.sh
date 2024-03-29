#!/usr/bin/env bash
set -exuo pipefail

INSTANCES="nwmis-burkina-faso"

[[ "${CI_BRANCH}" !=  "main" && ! "${CI_TAG:=}" =~ promote.* ]] && { echo "Branch different than main and not a tag. Skip deploy"; exit 0; }
[[ "${CI_PULL_REQUEST}" ==  "true" ]] && { echo "Pull request. Skip deploy"; exit 0; }

auth () {
    gcloud auth activate-service-account --key-file=/home/semaphore/.secrets/gcp.json
    gcloud config set project akvo-lumen
    gcloud config set container/cluster europe-west1-d
    gcloud config set compute/zone europe-west1-d
    gcloud config set container/use_client_certificate False
    gcloud auth configure-docker "eu.gcr.io"
}

push_image () {
    prefix="eu.gcr.io/akvo-lumen/national-wash-mis"
    docker push "${prefix}/${1}:${CI_COMMIT}"
}

prepare_deployment () {
    cluster="test"

    if [[ "${CI_TAG:=}" =~ promote.* ]]; then
        cluster="production"
    fi

    gcloud container clusters get-credentials "${cluster}"

    sed -e "s/\${CI_COMMIT}/${CI_COMMIT}/g;" \
        ci/k8s/deployment.template.yml > ci/k8s/template.yml
    for INSTANCE in ${INSTANCES}
    do
        sed -e "s/\${INSTANCE_NAME}/${INSTANCE}/g;" \
            ci/k8s/template.yml > ci/k8s/deployment-${INSTANCE}.yml
        sed -e "s/\${INSTANCE_NAME}/${INSTANCE}/g;" \
            ci/k8s/service.template.yml > ci/k8s/service-${INSTANCE}.yml
        sed -e "s/\${INSTANCE_NAME}/${INSTANCE}/g;" \
            ci/k8s/volume-claim.template.yml > ci/k8s/volume-claim-${INSTANCE}.yml
    done
}

apply_deployment () {
    for INSTANCE in ${INSTANCES}
    do
        echo "DEPLOYING ${INSTANCE}"
        kubectl apply -f ci/k8s/volume-claim-${INSTANCE}.yml
        kubectl apply -f ci/k8s/deployment-${INSTANCE}.yml
        kubectl apply -f ci/k8s/service-${INSTANCE}.yml
    done
}

auth

if [[ -z "${CI_TAG:=}" ]]; then
    push_image backend
    push_image worker
    push_image frontend
fi

prepare_deployment
apply_deployment


for INSTANCE in ${INSTANCES}
do
    ci/k8s/wait-for-k8s-deployment-to-be-ready.sh ${INSTANCE}
done

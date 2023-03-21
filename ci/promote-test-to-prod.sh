#!/usr/bin/env bash
#shellcheck disable=SC2039

set -euo pipefail

deployment_name="national-wash-mis"
deployment_version_label="national-wash-mis-version"
github_project="national-wash-mis"
notification="slack"
slack_channel="#proj-wcaro-mis-dev-notification"

docker run \
       --rm \
       --volume "${HOME}/.config:/home/akvo/.config" \
       --volume "$(pwd):/app" \
       --env ZULIP_CLI_TOKEN \
       --interactive \
       --tty \
       akvo/akvo-devops:20201203.085214.79bec73 \
       promote-test-to-prod.sh "${deployment_name}" "${deployment_version_label}" "${github_project}" "${notification}" "${slack_channel}"

#!/usr/bin/env bash
#shellcheck disable=SC2039

set -euo pipefail

deployment_name="nwmis"
deployment_version_label="nwmis-version"
github_project="nwmis"
notification="zulip"
zulip_stream="RTMIS"

docker run \
       --rm \
       --volume "${HOME}/.config:/home/akvo/.config" \
       --volume "$(pwd):/app" \
       --env ZULIP_CLI_TOKEN \
       --interactive \
       --tty \
       akvo/akvo-devops:20201203.085214.79bec73 \
       promote-test-to-prod.sh "${deployment_name}" "${deployment_version_label}" "${github_project}" "${notification}" "${zulip_stream}"

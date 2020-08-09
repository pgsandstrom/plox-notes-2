#!/bin/bash
set -e
set -u

cd "$(dirname "$0")"

./prep_repo_for_deploy.sh
# TODO a super cool thing would be if the script could detect that the git update changed this script, and then abort. Or even reload itself.

# TODO maybe move typescript stuff to dependency and then run this instead?
# npm install --only=prod
npm install

npm run build

mkdir -p /apps/test.codeandstuff.se

# currently we copy the whole project into the prod folder
# TODO find out exactly which parts are required, and copy in these
rsync -a . /apps/test.codeandstuff.se

# find a neat solution to not only restart pm2, but to add if it is not already there
pm2 restart plox-notes-2

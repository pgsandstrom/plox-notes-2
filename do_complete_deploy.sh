#!/bin/bash
set -e
set -u

cd "$(dirname "$0")"

./prep_repo_for_deploy.sh

npm install --only=prod

npm run build

mv dist release
mv .next release
cp -r pm2.json ./release
cp -r ./node_modules ./release/

# is next-env.d.ts needed, what does it do?

mkdir -p /apps/test.codeandstuff.se

mv relese/* /apps/test.codeandstuff.se

# find a neat solution to not only restart pm2, but to add if it is not already there
pm2 restart plox-notes-2

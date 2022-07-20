#!/usr/bin/env bash

set -e

if [ -z "$LOCALROOT" ]; then
    LOCALROOT="$PWD"
else
    LOCALROOT="$PWD/$LOCALROOT"
fi
LOCALROOT=${LOCALROOT%/}

if [ ! -d "$LOCALROOT" ]; then
    echo "Directory $LOCALROOT does not exist"
    exit 1
fi

remoteWebRoot=${WEBROOT%/}

start=`date +%s`

echo "#######"
echo "####### Running yarn and Cypress"
echo "#######"
sshpass -p "${PASS}" ssh -T "${USER}@${HOST}" << EOF
if [ ! -z ${CLEANREMOTE} ]; then
    rm -rf ${remoteWebRoot}/node_modules
fi

cd ${remoteWebRoot}
yarn
yarn test:cypress
exit \$?

EOF
status=$?
endRemote=`date +%s`
echo "#######"
echo "####### Tests completed in `expr $endRemote - $start` seconds"
echo "#######"
exit $status

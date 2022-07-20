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

if [ -z "$RSYNC_OPTIONS" ]; then
    RSYNC_OPTIONS="--no-o --no-g --no-p --no-t"
fi

if [ -z "$RSYNC_OPTIONS_REMOTE" ]; then
    RSYNC_OPTIONS_REMOTE="$RSYNC_OPTIONS"
fi

if [ -z "$RSYNC_OPTIONS_LOCAL" ]; then
    RSYNC_OPTIONS_LOCAL="$RSYNC_OPTIONS"
fi

remoteTarget=${REMOTEPATH%/}
remoteWebRoot=${WEBROOT%/}

uploadCombinedExclude=${LOCALROOT%/}/.upload-exclude--combined
webCombinedExclude=${LOCALROOT%/}/.web-exclude--combined
webCombinedExcludeRemote=${remoteTarget}/.web-exclude--combined

cp -r /scripts/.rsync-exclude $uploadCombinedExclude
cp -r /scripts/.default-exclude $webCombinedExclude

rsyncBranchExclude="/scripts/.rsync-${BRANCH}-exclude"
uploadBranchExclude="${LOCALROOT%/}/.upload-${BRANCH}-exclude"
uploadExclude="${LOCALROOT%/}/.upload-exclude"
webBranchExclude="${LOCALROOT%/}/.web-${BRANCH}-exclude"
webExclude="${LOCALROOT%/}/.web-exclude"

if [[ -f ${rsyncBranchExclude} ]] ; then
    echo "" | cat - $rsyncBranchExclude >> $uploadCombinedExclude
fi
if [[ -f ${uploadBranchExclude} ]] ; then
    echo "" | cat - $uploadBranchExclude >> $uploadCombinedExclude
fi
if [[ -f ${uploadExclude} ]] ; then
    echo "" | cat - $uploadExclude >> $uploadCombinedExclude
fi
if [[ -f ${webBranchExclude} ]] ; then
    echo "" | cat - $webBranchExclude >> $webCombinedExclude
fi
if [[ -f ${webExclude} ]] ; then
    echo "" | cat - $webExclude >> $webCombinedExclude
fi

start=`date +%s`

echo "#######"
echo "####### Deploying to remote server"
echo "#######"

sshpass -p "${PASS}" ssh -T "${USER}@${HOST}" << EOF
mkdir -p ${remoteTarget}
    
EOF

sshpass -p "${PASS}" rsync -a ${RSYNC_OPTIONS_REMOTE} --delete --exclude-from ${uploadCombinedExclude} --delete-excluded ${LOCALROOT}/ -e ssh "${USER}@${HOST}":${remoteTarget}

endDeploy=`date +%s`

echo "#######"
echo "####### Deployed to remote in `expr $endDeploy - $start` seconds"
echo "#######"
echo "#######"
echo "####### Copying files to webroot"
echo "#######"
sshpass -p "${PASS}" ssh -T "${USER}@${HOST}" << EOF
rm -rf ${remoteWebRoot}/wp-content/cache 
if [ ! -z ${CLEANREMOTE} ]; then
    rm -rf ${remoteWebRoot}/wp/
    rm -rf ${remoteWebRoot}/wp-content/vendor
    rm -rf ${remoteWebRoot}/wp-content/plugins
    rm -rf ${remoteWebRoot}/wp-content/mu-plugins
    rm -rf ${remoteWebRoot}/wp-content/themes
fi

rsync -avi ${RSYNC_OPTIONS_LOCAL} --delete --exclude-from ${webCombinedExcludeRemote} ${remoteTarget}/ ${remoteWebRoot}  | grep -v ">f..T......"

if [ -f ~/deploy/scripts/post_deploy.sh ]; then
    sh ~/deploy/scripts/post_deploy.sh || true
else 
    if [ -d ${remoteWebRoot}/wp-content/uploads ]; then
        touch ${remoteWebRoot}/wp-content/uploads/.clear-cache
    fi
fi

if [ -f ${remoteWebRoot}/post-deploy.sh ]; then
    sh ${remoteWebRoot}/post-deploy.sh || true
    rm -f ${remoteWebRoot}/post-deploy.sh
fi

EOF
endRemote=`date +%s`
echo "#######"
echo "####### Copied to webroot in `expr $endRemote - $endDeploy` seconds"
echo "#######"

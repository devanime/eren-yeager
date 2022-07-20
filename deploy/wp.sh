#!/usr/bin/env bash
set -e

start_time=`date +%s`

if [ -f /scripts/build.sh ]; then
    sh /scripts/build.sh
fi
if [ -f /scripts/rsync.sh ]; then
    sh /scripts/rsync.sh
fi

end_time=`date +%s`
echo Total execution time was `expr $end_time - $start_time` s.
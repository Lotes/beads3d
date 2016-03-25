#!/bin/bash
cygcheck tools/bin/voxelify | awk '{$1=$1};1' | sed 's/C:/\/cygdrive\/c/g'| sed 's/\\/\//g' | grep cygwin64 | xargs -I % echo cp % tools/bin | bash
cygcheck tools/bin/zip2obj | awk '{$1=$1};1' | sed 's/C:/\/cygdrive\/c/g'| sed 's/\\/\//g' | grep cygwin64 | xargs -I % echo cp % tools/bin | bash
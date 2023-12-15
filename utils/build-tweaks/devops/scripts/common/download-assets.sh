#!/bin/bash

# TODO:  Implement build token

build_id=$1
fetch_token=$2
build_manager_api="http://localhost:3003/api"

react_native_project_root=$(pwd)
temp_directory="$react_native_project_root/temp"

# TODO: Handle Download failures
downloadUrl="${build_manager_api}/builds/${build_id}?token=$fetch_token"
cmd='curl -L ${downloadUrl} --output ${temp_directory}/build-assets.zip'

echo -e "Downloading from "$downloadUrl"...\n"
eval $cmd

extractCmd='unzip -o ${temp_directory}/build-assets.zip -d ${temp_directory}/'
echo -e "Extracting from ${temp_directory}/build-assets.zip to ${temp_directory}/\n"
eval $extractCmd

echo -e "Removing ${temp_directory}/build-assets.zip\n"
rm -rf ${temp_directory}/build-assets.zip
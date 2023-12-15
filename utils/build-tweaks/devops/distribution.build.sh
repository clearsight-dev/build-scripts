#!/bin/bash
cd "$(dirname $0)/../"
project_path=$PWD
build_path="$PWD/build"

HOMEBREW_NO_AUTO_UPDATE=1 brew list jq &>/dev/null || brew install jq
HOMEBREW_NO_AUTO_UPDATE=1 brew list xmlstarlet &>/dev/null || brew install xmlstarlet

export env='prod'
build_android=$(jq -r '.build_android' "$project_path/devops/distribution.config.json")
build_ios=$(jq -r '.build_ios' "$project_path/devops/distribution.config.json")
currentFrameworkVersion=$(jq -r '.version' "$project_path/package.json")



echo -e "\n\n🧹 Cleaning build directory...\n"

rm -rf $build_path/


echo -e "\n\nFetching app info...\n"

apptile_api_endpoint=$(jq -r '.apptile_api_endpoint' "$project_path/devops/distribution.config.json")
app_id=$(jq -r '.app_id' "$project_path/devops/distribution.config.json")
curl -f -s --compressed --location "$apptile_api_endpoint/api/app/$app_id/published?currentFrameworkVersion=$currentFrameworkVersion" -o $project_path/appConfig.json
if [[ $? != 0 ]]
then
  echo "Error fetching app info. Exiting..."
  rm -f $project_path/appConfig.json
  exit 1
fi


echo -e "\n\nChecking if app uses camera...\n"

grep -q CameraWidget $project_path/appConfig.json
if [[ $? == 0 ]]
then
  usingCamera="true"
else
  usingCamera="false"
fi
export usingCamera



if [[ $build_android == "true" ]]
then
    mv $project_path/android/app/src/main/assets/appConfig.json $project_path/appConfig.json.backup
    cp $project_path/appConfig.json $project_path/android/app/src/main/assets/appConfig.json
    $project_path/devops/scripts/android/distribution.build.sh $project_path
    mv $project_path/appConfig.json.backup $project_path/android/app/src/main/assets/appConfig.json
else
    echo "Skipping android build..."
fi


if [[ $build_ios == "true" ]]
then
    mv $project_path/ios/appConfig.json $project_path/appConfig.json.backup
    cp $project_path/appConfig.json $project_path/ios/appConfig.json
    $project_path/devops/scripts/ios/distribution.build.sh $project_path
    mv $project_path/appConfig.json.backup $project_path/ios/appConfig.json
else
    echo "Skipping ios build..."
fi


rm -f $project_path/appConfig.json

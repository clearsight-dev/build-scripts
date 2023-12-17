#!/bin/bash -e

HOMEBREW_NO_AUTO_UPDATE=1 arch -arm64 brew list jq &>/dev/null || arch -arm64 brew install jq
HOMEBREW_NO_AUTO_UPDATE=1 arch -arm64 brew list gnu-sed &>/dev/null || arch -arm64 brew install gnu-sed

project_path=$1
temp_dir="$project_path/temp"
build_path="$project_path/build"


app_name=$(jq -r '.app_name' "$project_path/devops/preview.config.json")
bundle_id=$(jq -r '.android.bundle_id' "$project_path/devops/preview.config.json")
version_code=$(jq -r '.version_number' "$project_path/devops/preview.config.json")
version_name=$(jq -r '.version_semver' "$project_path/devops/preview.config.json")
url_scheme=$(jq -r '.url_scheme' "$project_path/devops/preview.config.json")
icon_path=$(jq -r '.icon_path' "$project_path/devops/preview.config.json")
splash_path=$(jq -r '.android.splash_path' "$project_path/devops/preview.config.json")
service_file_path=$(jq -r '.android.service_file_path' "$project_path/devops/preview.config.json")
apptile_base_framework_version=$(jq -r '.version' "$project_path/package.json")


echo -e "\n\033[0;36m----------------------Android Preview App Build Script (running in $PWD)----------------------\033[0m\n"



echo -e "\n\n🧹 Cleaning temp directory...\n"

rm -rf $temp_dir/


mkdir -p $temp_dir/
cd $temp_dir/
echo -e "\n\n📑 Copying original files in \033[0;35m$temp_dir\033[0m \n"

cp $project_path/{babel.config.js,metro.config.js,package.json,package-lock.json,tsconfig.json} .
cp -R $project_path/{android,node_modules} .
cp ./android/app/src/main/java/org/io/apptile/ApptilePreviewDemo/MainActivity.java ./android/app/src/main/java/org/io/apptile/ApptilePreviewDemo/PreviewActivity.java
npx --yes replace-in-file "/MainActivity/g" "PreviewActivity" ./android/app/src/main/java/org/io/apptile/ApptilePreviewDemo/PreviewActivity.java --isRegex


echo -e "\n\n📑 Copying preview app files in \033[0;35m$temp_dir\033[0m \n"

cp -R $project_path/devops/files/preview-app/js/* .
cp -R $project_path/devops/files/preview-app/android/MainActivity.java ./android/app/src/main/java/org/io/apptile/ApptilePreviewDemo/
cp $service_file_path ./android/app/google-services.json


echo -e "\n\n♻️ Replacing content in original files...\n"

gsed -i '/\/\/ PreviewAppRequiresItToRemove/d' ./android/app/src/main/java/org/io/apptile/ApptilePreviewDemo/PreviewActivity.java
gsed -i '/\/\/ PreviewAppRequiresItToRemove/d' ./android/app/build.gradle
npx --yes replace-in-file "//\* PreviewAppRequirement \(Don't remove\)/g" "" ./android/app/src/main/java/org/io/apptile/ApptilePreviewDemo/PreviewActivity.java --isRegex
npx --yes replace-in-file "/PreviewAppRequirementEnd \*//g" "" ./android/app/src/main/java/org/io/apptile/ApptilePreviewDemo/PreviewActivity.java --isRegex
npx --yes replace-in-file "/// PreviewAppRequirement \(Don't remove\) /g" "" ./android/app/build.gradle --isRegex
npx --yes replace-in-file "/ PreviewAppRequirementEnd -->/g" "" ./android/app/src/main/AndroidManifest.xml --isRegex
npx --yes replace-in-file "/<!-- PreviewAppRequirement \(Don't remove\) /g" "" ./android/app/src/main/AndroidManifest.xml --isRegex
npx --yes replace-in-file "/android:scheme=\"demoapptileprvw\"/g" "android:scheme=\"$url_scheme\"" ./android/app/src/main/AndroidManifest.xml --isRegex
npx --yes replace-in-file "/APPTILE_BASE_FRAMEWORK_VERSION\">.{0,64}/g" "APPTILE_BASE_FRAMEWORK_VERSION\">$apptile_base_framework_version</string>" ./android/app/src/main/res/values/strings.xml --isRegex


echo -e "\n\n⏳ Installing node_modules required for preview app\n"

npm i $(cat $project_path/devops/files/preview-app/packages.txt) --no-audit


echo -e "\n\n⏳ Updating app name to \033[0;35m$app_name\033[0m and bundle ID to \033[0;35m$bundle_id\033[0m \n"

npx --yes replace-in-file "/app_name\">.{9,32}/g" "app_name\">$app_name</string>" ./android/app/src/main/res/values/strings.xml --isRegex
npx --yes replace-in-file "/\"displayName\": \".{1,32}/g" "\"displayName\": \"$app_name\"" ./app.json --isRegex
npx --yes replace-in-file "/applicationId .{1,64}/g" "applicationId \"$bundle_id\"" ./android/app/build.gradle --isRegex


echo -e " \n\n⚙️ Generating Splash from image at path \033[0;35m$splash_path\033[0m \n"
 
$project_path/devops/scripts/android/splash-generator.sh $splash_path $project_path/temp/android/app/src/main


echo -e " \n\n⚙️ Generating app icon from image at path \033[0;35m$icon_path\033[0m \n"

$project_path/devops/scripts/android/iconset-generator.sh $icon_path $project_path/temp/android/app/src/main


echo -e "\n\n⏳ Updating app version code to \033[0;35m$version_code\033[0m and version name to \033[0;35m$version_name\033[0m \n"

npx --yes replace-in-file "/versionCode [1-9]{1,4}/g" "versionCode $version_code" ./android/app/build.gradle --isRegex
npx --yes replace-in-file "/versionName .{1,12}/g" "versionName \"$version_name\"" ./android/app/build.gradle --isRegex


echo -e "\n\n⏳ Building preview app bundle...\n"

watchman watch-del-all $PWD
mkdir -p ./android/app/src/main/assets/
npx --yes react-native bundle --dev false --entry-file index.js --bundle-output ./android/app/src/main/assets/preview.android.bundle --assets-dest ./android/app/src/main/res/ --platform android
cp $build_path/index.android.bundle ./android/app/src/main/assets/


echo -e "\n\n⏳ Building app...\n"

export SIGNING_STORE_FILE=$(jq -r '.android.store_file_path' "$project_path/devops/preview.config.json")
export SIGNING_KEY_ALIAS=$(jq -r '.android.key_alias' "$project_path/devops/preview.config.json")
export SIGNING_STORE_PASSWORD=$(jq -r '.android.store_password' "$project_path/devops/preview.config.json")
export SIGNING_KEY_PASSWORD=$(jq -r '.android.key_password' "$project_path/devops/preview.config.json")
expected_output=$(jq -r '.android.expected_output' "$project_path/devops/preview.config.json")

cd ./android/
if [[ $expected_output == 'apk&aab' ]] || [[ $expected_output == 'aab&apk' ]]
then
   ./gradlew clean assembleRelease bundleRelease
elif [[ $expected_output == 'apk' ]]
then
   ./gradlew clean assembleRelease
elif [[ $expected_output == 'aab' ]]
then
   ./gradlew clean bundleRelease
fi
cd $project_path/

mkdir -p $build_path/
cp -a $temp_dir/android/app/build/outputs/ $build_path/

echo -e "\n\033[0;32mSuccessfully built app 🎉 🎉 🎉, find in $build_path\033[0m"


cd $project_path && rm -rf $temp_dir/

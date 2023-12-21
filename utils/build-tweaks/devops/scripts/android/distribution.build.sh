#!/bin/bash -e

unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     machine=Linux;;
    Darwin*)    machine=Mac;;
    CYGWIN*)    machine=Cygwin;;
    MINGW*)     machine=MinGw;;
    MSYS_NT*)   machine=Git;;
    *)          machine="UNKNOWN:${unameOut}"
esac

if [[ $machine == "Mac" ]]
then
  HOMEBREW_NO_AUTO_UPDATE=1 arch -arm64 brew list jq &>/dev/null || arch -arm64 brew install jq
  HOMEBREW_NO_AUTO_UPDATE=1 arch -arm64 brew list gnu-sed &>/dev/null || arch -arm64 brew install gnu-sed
fi

project_path=$1
temp_dir="$project_path/temp"
build_path="$project_path/build"


apptile_api_endpoint=$(jq -r '.apptile_api_endpoint' "$project_path/devops/distribution.config.json")
analytics_api_endpoint=$(jq -r '.analytics_api_endpoint' "$project_path/devops/distribution.config.json")
app_id=$(jq -r '.app_id' "$project_path/devops/distribution.config.json")
app_name_og=$(jq -r '.app_name' "$project_path/devops/distribution.config.json")
# Handle character `&`, use equivalent unicode code
encoded_app_name=$(echo "$app_name_og" | perl -MHTML::Entities -pe 'encode_entities($_)')
app_name=$(echo "$encoded_app_name" | sed 's/\&/\\&/g')
echo $app_name
bundle_id=$(jq -r '.android.bundle_id' "$project_path/devops/distribution.config.json")
version_code=$(jq -r '.android.version_number' "$project_path/devops/distribution.config.json")
version_name=$(jq -r '.android.version_semver' "$project_path/devops/distribution.config.json")
url_scheme=$(jq -r '.url_scheme' "$project_path/devops/distribution.config.json")
app_host=$(jq -r '.app_host' "$project_path/devops/distribution.config.json")
icon_path=$(jq -r '.android.icon_path' "$project_path/devops/distribution.config.json")
splash_path=$(jq -r '.android.splash_path' "$project_path/devops/distribution.config.json")
image_placeholder_path=$(jq -r '.android.image_placeholder_path' "$project_path/devops/distribution.config.json")
service_file_path=$(jq -r '.android.service_file_path' "$project_path/devops/distribution.config.json")
enable_AD_ID=$(jq -r '.android.enable_AD_ID' "$project_path/devops/distribution.config.json")
fb_appId=$(jq -r '.fb_appId' "$project_path/devops/distribution.config.json")
fb_clientToken=$(jq -r '.fb_clientToken' "$project_path/devops/distribution.config.json")
moengage_appId=$(jq -r '.moengage_appId' "$project_path/devops/distribution.config.json")
moengage_datacenter=$(jq -r '.moengage_datacenter' "$project_path/devops/distribution.config.json")
appsflyer_devKey=$(jq -r '.appsflyer_devKey' "$project_path/devops/distribution.config.json")
appsflyer_appId=$(jq -r '.appsflyer_appId' "$project_path/devops/distribution.config.json")
apptile_base_framework_version=$(jq -r '.version' "$project_path/package.json")


echo -e "\n\033[0;36m----------------------Android Prod App Build Script (running in $PWD)----------------------\033[0m\n"



echo -e "\n\n🧹 Cleaning temp directory...\n"

rm -rf $temp_dir/


mkdir -p $temp_dir/
cd $temp_dir/
echo -e "\n\n📑 Copying original files in \033[0;35m$temp_dir\033[0m \n"

cp ../{app.json,babel.config.js,index.js,metro.config.js,package.json,package-lock.json,tsconfig.json} .
cp -R ../{android,app,node_modules,web} .
cp $service_file_path ./android/app/google-services.json
echo "{}" > .env.json


echo -e "\n\n♻️ Replacing content in original files...\n"

npx --yes replace-in-file "/android:usesCleartextTraffic=\"true\"/g" "" ./android/app/src/main/AndroidManifest.xml --isRegex
npx --yes replace-in-file "/android:scheme=\"demoapptileprvw\"/g" "android:scheme=\"$url_scheme\"" ./android/app/src/main/AndroidManifest.xml --isRegex
npx --yes replace-in-file "/android:host=\"deeplink-yjm2.onrender.com\"/g" "android:host=\"$app_host\"" ./android/app/src/main/AndroidManifest.xml --isRegex
npx --yes replace-in-file "/APPTILE_BASE_FRAMEWORK_VERSION\">.{0,64}/g" "APPTILE_BASE_FRAMEWORK_VERSION\">$apptile_base_framework_version</string>" ./android/app/src/main/res/values/strings.xml --isRegex
npx --yes replace-in-file "/APPTILE_API_ENDPOINT\">.{0,64}/g" "APPTILE_API_ENDPOINT\">$apptile_api_endpoint</string>" ./android/app/src/main/res/values/strings.xml --isRegex
npx --yes replace-in-file "/ANALYTICS_API_ENDPOINT\">.{0,128}/g" "ANALYTICS_API_ENDPOINT\">$analytics_api_endpoint</string>" ./android/app/src/main/res/values/strings.xml --isRegex
npx --yes replace-in-file "/APPTILE_APP_ID\">.{0,64}/g" "APPTILE_APP_ID\">$app_id</string>" ./android/app/src/main/res/values/strings.xml --isRegex
npx --yes replace-in-file "/APPTILE_IS_DISTRIBUTED_APP\">.{0,12}/g" "APPTILE_IS_DISTRIBUTED_APP\">1</string>" ./android/app/src/main/res/values/strings.xml --isRegex
npx --yes replace-in-file "/APPTILE_URL_SCHEME\">.{0,32}/g" "APPTILE_URL_SCHEME\">$url_scheme</string>" ./android/app/src/main/res/values/strings.xml --isRegex
npx --yes replace-in-file "/APPTILE_APP_HOST\">.{0,64}/g" "APPTILE_APP_HOST\">$app_host</string>" ./android/app/src/main/res/values/strings.xml --isRegex
xmlstarlet ed -P -L -s '/manifest/application/activity' -t elem -n 'intent-filter' -v '' \
    -i '/manifest/application/activity/intent-filter[last()]' -t attr -n 'android:autoVerify' -v 'true' \
    -s '/manifest/application/activity/intent-filter[last()]' -t elem -n 'action' -v '' \
    -i '/manifest/application/activity/intent-filter[last()]/action' -t attr -n 'android:name' -v 'android.intent.action.VIEW' \
    -s '/manifest/application/activity/intent-filter[last()]' -t elem -n 'category' -v '' \
    -i '/manifest/application/activity/intent-filter[last()]/category[last()]' -t attr -n 'android:name' -v 'android.intent.category.DEFAULT' \
    -s '/manifest/application/activity/intent-filter[last()]' -t elem -n 'category' -v '' \
    -i '/manifest/application/activity/intent-filter[last()]/category[last()]' -t attr -n 'android:name' -v 'android.intent.category.BROWSABLE' \
    -s '/manifest/application/activity/intent-filter[last()]' -t elem -n 'data' -v '' \
    -i '/manifest/application/activity/intent-filter[last()]/data' -t attr -n 'android:scheme' -v 'https' \
    -i '/manifest/application/activity/intent-filter[last()]/data' -t attr -n 'android:host' -v $app_host \
    -i '/manifest/application/activity/intent-filter[last()]/data' -t attr -n 'android:pathPrefix' -v '/.*' ./android/app/src/main/AndroidManifest.xml


echo -e "\n\n⏳ Updating app name to \033[0;35m$app_name\033[0m and bundle ID to \033[0;35m$bundle_id\033[0m \n"

npx --yes replace-in-file "/app_name\">.{9,32}/g" "app_name\">$app_name</string>" ./android/app/src/main/res/values/strings.xml --isRegex
npx --yes replace-in-file "/\"displayName\": \".{1,32}/g" "\"displayName\": \"$app_name\"" ./app.json --isRegex
npx --yes replace-in-file "/applicationId .{1,64}/g" "applicationId \"$bundle_id\"" ./android/app/build.gradle --isRegex


echo -e " \n\n⚙️ Generating Splash from image at path \033[0;35m$splash_path\033[0m \n"
 
file_type=$(file -b $splash_path)
if [[ $file_type == *"GIF"* ]]
then
  # convert $splash_path[0] $temp_dir/first_frame.png
  # $project_path/devops/scripts/android/splash-generator.sh $temp_dir/first_frame.png $temp_dir/android/app/src/main
  cp $splash_path $temp_dir/app/assets/splash.gif
  npx --yes replace-in-file "/\.png/g" ".gif" $temp_dir/app/components/common/JSSplashScreen.tsx --isRegex
  # rm $temp_dir/first_frame.png
  rm $temp_dir/app/assets/splash.png
  rm $temp_dir/android/app/src/main/res/drawable-mdpi/app_assets_splash.png
elif  [[ $file_type == *"PNG"* ]]
then
   # $project_path/devops/scripts/android/splash-generator.sh $splash_path $temp_dir/android/app/src/main
   cp $splash_path $temp_dir/app/assets/splash.png
fi


echo -e " \n\n⚙️ Generating app icon from image at path \033[0;35m$icon_path\033[0m \n"

$project_path/devops/scripts/android/iconset-generator.sh $icon_path $project_path/temp/android/app/src/main


if [[ -n "$image_placeholder_path" && "$image_placeholder_path" != "null" ]]
then
   echo -e " \n\n⚙️ Replaceing image placeholder from image at path \033[0;35m$image_placeholder_path\033[0m \n"
   cp -R $image_placeholder_path ./app/assets/image-placeholder.png
fi


echo -e "\n\n⏳ Updating app version code to \033[0;35m$version_code\033[0m and version name to \033[0;35m$version_name\033[0m \n"

npx --yes replace-in-file "/versionCode [1-9]{1,4}/g" "versionCode $version_code" ./android/app/build.gradle --isRegex
npx --yes replace-in-file "/versionName .{1,12}/g" "versionName \"$version_name\"" ./android/app/build.gradle --isRegex
npx --yes replace-in-file "/version: .{1,14}/g" "version: \"$version_name\"" ./package.json --isRegex


if [[ $usingCamera == "false" ]]
then
   echo -e "\n\n📦 Disabling Camera...\n"
   npm uninstall react-native-camera
   mv ./app/plugins/widgets/CameraWidget/RNCamera.replacement.tsx ./app/plugins/widgets/CameraWidget/RNCamera.tsx
   xmlstarlet ed -L -d '//uses-permission[@android:name="android.permission.CAMERA"]' ./android/app/src/main/AndroidManifest.xml
fi

if [[ ( -n "$fb_appId" && "$fb_appId" != "null" ) && ( -n "$fb_clientToken" && "$fb_clientToken" != "null" ) ]]
then
   echo -e "\n\n📦 Enabling FB SDK...\n"
   npx --yes replace-in-file "/facebook_app_id\">.{0,32}/g" "facebook_app_id\">$fb_appId</string>" ./android/app/src/main/res/values/strings.xml --isRegex
   npx --yes replace-in-file "/facebook_client_token\">.{0,64}/g" "facebook_client_token\">$fb_clientToken</string>" ./android/app/src/main/res/values/strings.xml --isRegex
   npx --yes replace-in-file "/<!-- ForFBIntegration \(Don't remove\) /g" "" ./android/app/src/main/AndroidManifest.xml --isRegex
   npx --yes replace-in-file "/ ForFBIntegrationEnd -->/g" "" ./android/app/src/main/AndroidManifest.xml --isRegex
   npm i --save-exact react-native-fbsdk-next@10.1.0
fi

if [[ ( -n "$moengage_appId" && "$moengage_appId" != "null" ) && ( -n "$moengage_datacenter" && "$moengage_datacenter" != "null" ) ]]
then
   echo -e "\n\n📦 Enabling MoEngage SDK...\n"
   npx --yes replace-in-file "/<MoEngageAppId>/g" $moengage_appId ./android/app/src/main/java/org/io/apptile/ApptilePreviewDemo/MainApplication.java --isRegex
   npx --yes replace-in-file "/<MoEngageDatacenter>/g" $moengage_datacenter ./android/app/src/main/java/org/io/apptile/ApptilePreviewDemo/MainApplication.java --isRegex
   npx --yes replace-in-file "/// MoengageDependency \(Don't remove\) /g" "" ./android/app/build.gradle --isRegex
   xmlstarlet ed --inplace -u '/manifest/application/service[@android:name=".MyFirebaseMessagingService"]/@android:name' -v 'com.moengage.firebase.MoEFireBaseMessagingService' ./android/app/src/main/AndroidManifest.xml
   npx --yes replace-in-file "//\* MoengageDependency \(Don't remove\) /g" "" ./android/app/src/main/java/org/io/apptile/ApptilePreviewDemo/MainApplication.java --isRegex
   npx --yes replace-in-file "/ MoengageDependencyEnd \*//g" "" ./android/app/src/main/java/org/io/apptile/ApptilePreviewDemo/MainApplication.java --isRegex
   mv ./app/common/ApptileAnalytics/moengageAnalytics/index.replacement.ts ./app/common/ApptileAnalytics/moengageAnalytics/index.ts
   mv ./app/common/ApptileAnalytics/moengageAnalytics/useMoEngage.replacement.ts ./app/common/ApptileAnalytics/moengageAnalytics/useMoEngage.ts
   npx --yes replace-in-file "/<MoEngageAppId>/g" $moengage_appId ./app/common/ApptileAnalytics/moengageAnalytics/useMoEngage.ts --isRegex
   npm i --save-exact react-native-moengage@8.5.3
fi

if [[ ( -n "$appsflyer_devKey" && "$appsflyer_devKey" != "null" ) && ( -n "$appsflyer_appId" && "$appsflyer_appId" != "null" ) ]]
then
   echo -e "\n\n📦 Enabling AppsFlyer SDK...\n"
   mv ./app/common/ApptileAnalytics/appsflyerAnalytics/index.replacement.ts ./app/common/ApptileAnalytics/appsflyerAnalytics/index.ts
   mv ./app/common/ApptileAnalytics/appsflyerAnalytics/initAppsFlyer.replacement.ts ./app/common/ApptileAnalytics/appsflyerAnalytics/initAppsFlyer.ts
   npx --yes replace-in-file "/<appsflyer_devKey>/g" $appsflyer_devKey ./app/common/ApptileAnalytics/appsflyerAnalytics/initAppsFlyer.ts --isRegex
   npx --yes replace-in-file "/<appsflyer_appId>/g" $appsflyer_appId ./app/common/ApptileAnalytics/appsflyerAnalytics/initAppsFlyer.ts --isRegex
   npm i --save-exact react-native-appsflyer@6.12.2
fi

if [[ (( -n "$appsflyer_devKey" && "$appsflyer_devKey" != "null" ) && ( -n "$appsflyer_appId" && "$appsflyer_appId" != "null" )) || ( "$enable_AD_ID" == "true" ) ]]
then
   xmlstarlet ed -L -d '//uses-permission[@android:name="com.google.android.gms.permission.AD_ID"]/@tools:node' ./android/app/src/main/AndroidManifest.xml
fi


echo -e "\n\n⏳ Building prod app bundle...\n"

npm i --no-audit
watchman watch-del-all $PWD
npx --yes react-native bundle --dev false --entry-file index.js --bundle-output ./android/app/src/main/assets/index.android.bundle --assets-dest ./android/app/src/main/res/ --platform android


echo -e "\n\n⏳ Building app...\n"

export SIGNING_STORE_FILE=$(jq -r '.android.store_file_path' "$project_path/devops/distribution.config.json")
export SIGNING_KEY_ALIAS=$(jq -r '.android.key_alias' "$project_path/devops/distribution.config.json")
export SIGNING_STORE_PASSWORD=$(jq -r '.android.store_password' "$project_path/devops/distribution.config.json")
export SIGNING_KEY_PASSWORD=$(jq -r '.android.key_password' "$project_path/devops/distribution.config.json")
expected_output=$(jq -r '.android.expected_output' "$project_path/devops/distribution.config.json")

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
cd ../

mkdir -p $build_path/
cp -a ./android/app/build/outputs/ $build_path/

echo -e "\n\033[0;32mSuccessfully built app 🎉 🎉 🎉, find in $build_path\033[0m"


cd $project_path && rm -rf $temp_dir/

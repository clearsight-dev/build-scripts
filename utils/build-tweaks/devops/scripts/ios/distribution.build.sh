#!/bin/bash -e


HOMEBREW_NO_AUTO_UPDATE=1 brew list jq &>/dev/null || brew install jq
HOMEBREW_NO_AUTO_UPDATE=1 brew list gnu-sed &>/dev/null || brew install gnu-sed 
HOMEBREW_NO_AUTO_UPDATE=1 brew list xcbeautify &>/dev/null || brew install xcbeautify 
HOMEBREW_NO_AUTO_UPDATE=1 brew list libplist &>/dev/null || brew install libplist

project_path=$1
temp_dir="$PWD/temp"
build_path="$PWD/build"


apptile_api_endpoint=$(jq -r '.apptile_api_endpoint' "$project_path/devops/distribution.config.json")
analytics_api_endpoint=$(jq -r '.analytics_api_endpoint' "$project_path/devops/distribution.config.json")
app_id=$(jq -r '.app_id' "$project_path/devops/distribution.config.json")
app_name=$(jq -r '.app_name' "$project_path/devops/distribution.config.json")
bundle_id=$(jq -r '.ios.bundle_id' "$project_path/devops/distribution.config.json")
current_project_version=$(jq -r '.ios.version_number' "$project_path/devops/distribution.config.json")
marketing_version=$(jq -r '.ios.version_semver' "$project_path/devops/distribution.config.json")
url_scheme=$(jq -r '.url_scheme' "$project_path/devops/distribution.config.json")
app_host=$(jq -r '.app_host' "$project_path/devops/distribution.config.json")
icon_path=$(jq -r '.ios.icon_path' "$project_path/devops/distribution.config.json")
splash_path=$(jq -r '.ios.splash_path' "$project_path/devops/distribution.config.json")
image_placeholder_path=$(jq -r '.ios.image_placeholder_path' "$project_path/devops/distribution.config.json")
service_file_path=$(jq -r '.ios.service_file_path' "$project_path/devops/distribution.config.json")
team_id=$(jq -r '.ios.team_id' "$project_path/devops/distribution.config.json")
enable_apple_pay=$(jq -r '.ios.enableApplePay' "$project_path/devops/distribution.config.json")
enableAppTrackingTransparency=$(jq -r '.ios.enableAppTrackingTransparency' "$project_path/devops/distribution.config.json")
fb_appId=$(jq -r '.fb_appId' "$project_path/devops/distribution.config.json")
fb_clientToken=$(jq -r '.fb_clientToken' "$project_path/devops/distribution.config.json")
moengage_appId=$(jq -r '.moengage_appId' "$project_path/devops/distribution.config.json")
moengage_datacenter=$(jq -r '.moengage_datacenter' "$project_path/devops/distribution.config.json")
appsflyer_devKey=$(jq -r '.appsflyer_devKey' "$project_path/devops/distribution.config.json")
appsflyer_appId=$(jq -r '.appsflyer_appId' "$project_path/devops/distribution.config.json")
apptile_base_framework_version=$(jq -r '.version' "$project_path/package.json")
uploadToTestflight=$(jq -r '.ios.uploadToTestflight' "$project_path/devops/distribution.config.json")


echo -e "\n\033[0;36m----------------------iOS Prod App Build Script (running in $PWD)----------------------\033[0m\n"



echo -e "\n\n🧹 Cleaning temp directory...\n"

rm -rf $temp_dir/


mkdir -p $temp_dir/
cd $temp_dir/
echo -e "\n\n📑 Copying original files in \033[0;35m$temp_dir\033[0m \n"

cp ../{app.json,babel.config.js,index.js,metro.config.js,package.json,package-lock.json,tsconfig.json} .
cp -R ../{app,ios,node_modules,web} .
cp $service_file_path ./ios/GoogleService-Info.plist
echo "{}" > .env.json


echo -e "\n\n♻️ Replacing content in original files...\n"

plutil -replace APPTILE_BASE_FRAMEWORK_VERSION -string $apptile_base_framework_version ./ios/ReactNativeTSProject/Info.plist
plutil -replace APPTILE_API_ENDPOINT -string $apptile_api_endpoint ./ios/ReactNativeTSProject/Info.plist
plutil -replace ANALYTICS_API_ENDPOINT -string $analytics_api_endpoint ./ios/ReactNativeTSProject/Info.plist
plutil -replace APPTILE_APP_ID -string $app_id ./ios/ReactNativeTSProject/Info.plist
plutil -replace APPTILE_IS_DISTRIBUTED_APP -string 1 ./ios/ReactNativeTSProject/Info.plist
plutil -replace APPTILE_URL_SCHEME -string $url_scheme ./ios/ReactNativeTSProject/Info.plist
plutil -replace APPTILE_APP_HOST -string $app_host ./ios/ReactNativeTSProject/Info.plist
npx --yes replace-in-file "/<string>com.apptile.apptilepreviewdemo</string>/g" "<string>$bundle_id</string>" ./ios/ReactNativeTSProject/Info.plist --isRegex
npx --yes replace-in-file "/<string>demoapptileprvw</string>/g" "<string>$url_scheme</string>" ./ios/ReactNativeTSProject/Info.plist --isRegex
plutil -replace NSAppTransportSecurity.NSExceptionDomains -dictionary ./ios/ReactNativeTSProject/Info.plist
plutil -insert "com\.apple\.developer\.associated-domains" -string "applinks:$app_host" -append ./ios/ReactNativeTSProject/ReactNativeTSProject.entitlements
plutil -insert "com\.apple\.developer\.associated-domains" -string "applinks:$app_host" -append ./ios/ReactNativeTSProject/ReactNativeTSProjectRelease.entitlements
npx --yes replace-in-file "/<string>group.com.apptile.apptilepreviewdemo.notification</string>/g" "<string>group.$bundle_id.notification</string>" ./ios/ReactNativeTSProject/ReactNativeTSProject.entitlements --isRegex
npx --yes replace-in-file "/<string>group.com.apptile.apptilepreviewdemo.notification</string>/g" "<string>group.$bundle_id.notification</string>" ./ios/ReactNativeTSProject/ReactNativeTSProjectRelease.entitlements --isRegex
npx --yes replace-in-file "/<string>group.com.apptile.apptilepreviewdemo.notification</string>/g" "<string>group.$bundle_id.notification</string>" ./ios/ImageNotification/ImageNotification.entitlements --isRegex
npx --yes replace-in-file "/<string>group.com.apptile.apptilepreviewdemo.notification</string>/g" "<string>group.$bundle_id.notification</string>" ./ios/NotificationContentExtension/NotificationContentExtension.entitlements --isRegex


echo -e "\n\n⏳ Updating ios project file...\n"

npm i xcode -D
node $project_path/devops/scripts/ios/update-project-file.js $PWD/ios/ReactNativeTSProject.xcodeproj/project.pbxproj 1
npx --yes replace-in-file "/DEVELOPMENT_TEAM = [A-Z0-9]{10}/g" "DEVELOPMENT_TEAM = $team_id" ./ios/ReactNativeTSProject.xcodeproj/project.pbxproj --isRegex


echo -e "\n\n⏳ Updating app name to \033[0;35m$app_name\033[0m and bundle ID to \033[0;35m$bundle_id\033[0m \n"

plutil -replace CFBundleDisplayName -string "$app_name" ./ios/ReactNativeTSProject/Info.plist
npx --yes replace-in-file "/\"displayName\": \".{1,32}/g" "\"displayName\": \"$app_name\"" ./app.json --isRegex
npx --yes replace-in-file "/com.apptile.apptilepreviewdemo/g" $bundle_id ./ios/ReactNativeTSProject.xcodeproj/project.pbxproj --isRegex


echo -e "\n\n⏳ Updating app version code to \033[0;35m$current_project_version\033[0m and version name to \033[0;35m$marketing_version\033[0m \n"

npx --yes replace-in-file "/CURRENT_PROJECT_VERSION = [1-9]{1,4}/g" "CURRENT_PROJECT_VERSION = $current_project_version" ./ios/ReactNativeTSProject.xcodeproj/project.pbxproj --isRegex
npx --yes replace-in-file "/MARKETING_VERSION = .{1,12}/g" "MARKETING_VERSION = $marketing_version;" ./ios/ReactNativeTSProject.xcodeproj/project.pbxproj --isRegex


echo -e " \n\n⚙️ Generating Splash from image at path \033[0;35m$splash_path\033[0m \n"

file_type=$(file -b $splash_path)
if [[ $file_type == *"GIF"* ]]
then
  # convert $splash_path[0] $temp_dir/first_frame.png
  # $project_path/devops/scripts/ios/imageset-generator.sh $temp_dir/first_frame.png $temp_dir/ios/ReactNativeTSProject
  cp $splash_path $temp_dir/app/assets/splash.gif
  npx --yes replace-in-file "/\.png/g" ".gif" $temp_dir/app/components/common/JSSplashScreen.tsx --isRegex
  # rm $temp_dir/first_frame.png
  rm $temp_dir/app/assets/splash.png
elif  [[ $file_type == *"PNG"* ]]
then
   # $project_path/devops/scripts/ios/imageset-generator.sh $splash_path $temp_dir/ios/ReactNativeTSProject
   cp $splash_path $temp_dir/app/assets/splash.png
fi


echo -e " \n\n⚙️ Generating app icon from image at path \033[0;35m$icon_path\033[0m \n"

cp $icon_path $temp_dir/ios/icon.png
$project_path/devops/scripts/ios/iconset-generator.sh $icon_path $temp_dir/ios/ReactNativeTSProject


if [[ -n "$image_placeholder_path" && "$image_placeholder_path" != "null" ]]
then
   echo -e " \n\n⚙️ Replaceing image placeholder from image at path \033[0;35m$image_placeholder_path\033[0m \n"
   cp -R $image_placeholder_path ./app/assets/image-placeholder.png
fi


# if [[ $enable_apple_pay == "false" ]]
# then
#   echo -e "\n\n📦 Disabling ApplePay...\n"
#   # plutil -remove "com\.apple\.developer\.in-app-payments" ./ios/ReactNativeTSProject/ReactNativeTSProjectRelease.entitlements
#   # plutil -remove "com\.apple\.developer\.in-app-payments" ./ios/ReactNativeTSProject/ReactNativeTSProject.entitlements
# fi

if [[ $usingCamera == "false" ]]
then
  echo -e "\n\n📦 Disabling Camera...\n"
  npm uninstall react-native-camera
  mv ./app/plugins/widgets/CameraWidget/RNCamera.replacement.tsx ./app/plugins/widgets/CameraWidget/RNCamera.tsx
  plutil -remove NSCameraUsageDescription ./ios/ReactNativeTSProject/Info.plist
  gsed -i '/Permission-Camera/s/^ ./  # /' ./ios/Podfile
fi

if [[ ( -n "$fb_appId" && "$fb_appId" != "null" ) && ( -n "$fb_clientToken" && "$fb_clientToken" != "null" ) ]]
then
  echo -e "\n\n📦 Enabling FB SDK...\n"
  npx --yes replace-in-file "//\* ForFBIntegration \(Don't remove\) /g" "" ./ios/ReactNativeTSProject/AppDelegate.m --isRegex
  npx --yes replace-in-file "/ ForFBIntegrationEnd \*//g" "" ./ios/ReactNativeTSProject/AppDelegate.m --isRegex
  plutil -insert "CFBundleURLTypes.0.CFBundleURLSchemes" -string "$fb_appId" -append ./ios/ReactNativeTSProject/info.plist
  plutil -insert "FacebookAppID" -string "$fb_appId" -append ./ios/ReactNativeTSProject/info.plist
  plutil -insert "FacebookClientToken" -string "$fb_clientToken" -append ./ios/ReactNativeTSProject/info.plist
  plutil -insert "FacebookDisplayName" -string "$app_name" -append ./ios/ReactNativeTSProject/info.plist
  plutil -insert "FacebookAutoLogAppEventsEnabled" -bool YES -append ./ios/ReactNativeTSProject/info.plist
  plutil -insert "FacebookAdvertiserIDCollectionEnabled" -bool NO -append ./ios/ReactNativeTSProject/info.plist
  npm i --save-exact react-native-fbsdk-next@10.1.0
fi

if [[ ( -n "$moengage_appId" && "$moengage_appId" != "null" ) && ( -n "$moengage_datacenter" && "$moengage_datacenter" != "null" ) ]]
then
  echo -e "\n\n📦 Enabling MoEngage SDK...\n"
  npx --yes replace-in-file "/# MoengageDependency \(Don't remove\) /g" "" ./ios/Podfile --isRegex
  npx --yes replace-in-file "//\* MoengageDependency \(Don't remove\) /g" "" ./ios/ImageNotification/NotificationService.m --isRegex
  npx --yes replace-in-file "/group.com.apptile.apptilepreviewdemo.notification/g" "group.$bundle_id.notification" ./ios/ImageNotification/NotificationService.m --isRegex
  npx --yes replace-in-file "/ MoengageDependencyEnd \*//g" "" ./ios/ImageNotification/NotificationService.m --isRegex
  npx --yes replace-in-file "/\[\[FIRMessaging extensionHelper\]/g" "// [[FIRMessaging extensionHelper]" ./ios/ImageNotification/NotificationService.m --isRegex
  npx --yes replace-in-file "/// MoengageDependency \(Don't remove\) /g" "" ./ios/NotificationContentExtension/NotificationViewController.swift --isRegex
  npx --yes replace-in-file "/group.com.apptile.apptilepreviewdemo.notification/g" "group.$bundle_id.notification" ./ios/NotificationContentExtension/NotificationViewController.swift --isRegex
  npx --yes replace-in-file "//\* MoengageDependency \(Don't remove\) /g" "" ./ios/ReactNativeTSProject/AppDelegate.m --isRegex
  npx --yes replace-in-file "/ MoengageDependencyEnd \*//g" "" ./ios/ReactNativeTSProject/AppDelegate.m --isRegex
  plutil -insert MoEngageAppDelegateProxyEnabled -bool false ./ios/ReactNativeTSProject/Info.plist
  plutil -insert MoEngage -xml "<dict><key>ENABLE_LOGS</key><false/><key>MoEngage_APP_ID</key><string>$moengage_appId</string><key>DATA_CENTER</key><string>DATA_CENTER_0$moengage_datacenter</string><key>APP_GROUP_ID</key><string>group.$bundle_id.notification</string></dict>" ./ios/ReactNativeTSProject/Info.plist
  plutil -replace NSExtension.NSExtensionAttributes.UNNotificationExtensionCategory -string "MOE_PUSH_TEMPLATE" ./ios/NotificationContentExtension/Info.plist
  plutil -replace NSExtension.NSExtensionAttributes.UNNotificationExtensionInitialContentSizeRatio -float 1.2 ./ios/NotificationContentExtension/Info.plist
  plutil -insert NSExtension.NSExtensionAttributes.UNNotificationExtensionUserInteractionEnabled -bool true ./ios/NotificationContentExtension/Info.plist
  plutil -insert NSExtension.NSExtensionAttributes.UNNotificationExtensionDefaultContentHidden -bool true ./ios/NotificationContentExtension/Info.plist
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

if [[ (( -n "$appsflyer_devKey" && "$appsflyer_devKey" != "null" ) && ( -n "$appsflyer_appId" && "$appsflyer_appId" != "null" )) || ( "$enableAppTrackingTransparency" == "true" ) ]]
then
  mv ./app/common/AppleATTPermission/index.replacement.ts ./app/common/AppleATTPermission/index.ts
  plutil -insert "NSUserTrackingUsageDescription" -string "Your privacy matters. We collect usage data to enhance your app experience. Rest assured, your information is handled securely and used solely for improvement." -append ./ios/ReactNativeTSProject/info.plist
  gsed -i '/Permission-AppTrackingTransparency/s/^ .#/ /' ./ios/Podfile
fi


echo -e "\n\n⏳ Building prod app bundle...\n"

npm i --no-audit
watchman watch-del-all $PWD
npx --yes react-native bundle --dev false --entry-file index.js --bundle-output ./ios/main.bundle --assets-dest ./ios --platform ios


echo -e "\n\n⏳ Installing pods...\n"

cd ios/
arch -x86_64 gem install ffi --verbose
arch -x86_64 pod install --repo-update
gsed -i 's/source="\$(readlink "\${source}")"/source="\$(readlink -f "\${source}")"/' ./Pods/Target\ Support\ Files/Pods-ReactNativeTSProject/Pods-ReactNativeTSProject-frameworks.sh
cd $temp_dir/


echo -e "\n\n💼 Archiving project...\n"

archive_logs=$(RCT_NO_LAUNCH_PACKAGER=1 SKIP_BUNDLING=1 xcodebuild clean archive -sdk iphoneos -workspace "$temp_dir/ios/ReactNativeTSProject.xcworkspace" -scheme ReactNativeTSProject -archivePath "$temp_dir/ios/ReactNativeTSProject.xcarchive" -allowProvisioningUpdates | xcbeautify 2>&1 | tee >(cat - >&2))

echo "$archive_logs" | grep -q "Archive Succeeded"


echo -e "\n\n⚙️ Generating .ipa file...\n"

cp $project_path/devops/files/preview-app/ios/ExportOptions.plist $temp_dir
if [[ $env == "prod" ]]
then
  plutil -replace method -string "ad-hoc" $temp_dir/ExportOptions.plist
fi
mkdir -p $build_path/
plutil -replace teamID -string $team_id $temp_dir/ExportOptions.plist
export_logs=$(xcodebuild -exportArchive -archivePath $temp_dir/ios/ReactNativeTSProject.xcarchive -exportPath $build_path -exportOptionsPlist $temp_dir/ExportOptions.plist -allowProvisioningUpdates | xcbeautify 2>&1 | tee >(cat - >&2))
echo "$export_logs" | grep -q "Export Succeeded"

echo -e "\n\033[0;32mSuccessfully built $build_path/ReactNativeTSProject.ipa! 🎉 🎉 🎉\033[0m"

if [ "$uploadToTestflight" = "true" ]; then

echo -e "Uploading to Testflight......"


  if [ -z "$apiKey" ]; then
    echo "Error: apiKey is not set. Please set the apiKey environment variable."
    exit 1
  fi

  if [ -z "$apiIssuerId" ]; then
    echo "Error: apiIssuerId is not set. Please set the apiIssuerId environment variable."
    exit 1
  fi

  # xcrun altool command to upload to test flight
  xcrun altool --upload-app -f $project_path/build/ReactNativeTSProject.ipa -t ios --apiKey $apiKey --apiIssuer $apiIssuerId --verbose


fi

cd $project_path && rm -rf $temp_dir/

#!/bin/bash -e

HOMEBREW_NO_AUTO_UPDATE=1 brew list jq &>/dev/null || brew install jq
HOMEBREW_NO_AUTO_UPDATE=1 brew list gnu-sed &>/dev/null || brew install gnu-sed 
HOMEBREW_NO_AUTO_UPDATE=1 brew list xcbeautify &>/dev/null || brew install xcbeautify 
HOMEBREW_NO_AUTO_UPDATE=1 brew list libplist &>/dev/null || brew install libplist

project_path=$1
temp_dir="$project_path/temp"
build_path="$project_path/build"


app_name=$(jq -r '.app_name' "$project_path/devops/preview.config.json")
bundle_id=$(jq -r '.ios.bundle_id' "$project_path/devops/preview.config.json")
current_project_version=$(jq -r '.version_number' "$project_path/devops/preview.config.json")
marketing_version=$(jq -r '.version_semver' "$project_path/devops/preview.config.json")
url_scheme=$(jq -r '.url_scheme' "$project_path/devops/preview.config.json")
icon_path=$(jq -r '.icon_path' "$project_path/devops/preview.config.json")
splash_path=$(jq -r '.ios.splash_path' "$project_path/devops/preview.config.json")
service_file_path=$(jq -r '.ios.service_file_path' "$project_path/devops/preview.config.json")
team_id=$(jq -r '.ios.team_id' "$project_path/devops/preview.config.json")
apptile_base_framework_version=$(jq -r '.version' "$project_path/package.json")


echo -e "\n\033[0;36m----------------------iOS Preview App Build Script (running in $PWD)----------------------\033[0m\n"



echo -e "\n\n🧹 Cleaning temp directory...\n"

rm -rf $temp_dir/


mkdir -p $temp_dir/
cd $temp_dir/
echo -e "\n\n📑 Copying original files in \033[0;35m$temp_dir\033[0m \n"

cp $project_path/{babel.config.js,metro.config.js,package.json,package-lock.json,tsconfig.json} .
cp -R $project_path/{ios,node_modules} .


echo -e "\n\n📑 Copying preview app files in \033[0;35m$temp_dir\033[0m \n"

cp -R $project_path/devops/files/preview-app/js/* .
cp -R $project_path/devops/files/preview-app/ios/{PreviewDelegate.h,PreviewDelegate.m} ./ios/ReactNativeTSProject/
cp $service_file_path ./ios/GoogleService-Info.plist


echo -e "\n\n♻️ Replacing content in original files...\n"

gsed -i '/ \/\/ PreviewAppRequiresItToRemove/d' ./ios/ReactNativeTSProject/AppDelegate.h
npx --yes replace-in-file "/// PreviewAppRequirement \(Don't remove\)/g" "" ./ios/ReactNativeTSProject/AppDelegate.h --isRegex
gsed -i '/ \/\/ PreviewAppRequiresItToRemove/d' ./ios/ReactNativeTSProject/AppDelegate.m
npx --yes replace-in-file "//\* PreviewAppRequirement \(Don't remove\)/g" "" ./ios/ReactNativeTSProject/AppDelegate.m --isRegex
npx --yes replace-in-file "/PreviewAppRequirementEnd \*//g" "" ./ios/ReactNativeTSProject/AppDelegate.m --isRegex
npx --yes replace-in-file "/# PreviewAppRequirement \(Don't remove\)/g" "" ./ios/Podfile --isRegex
plutil -replace APPTILE_BASE_FRAMEWORK_VERSION -string $apptile_base_framework_version ./ios/ReactNativeTSProject/Info.plist
npx --yes replace-in-file "/<string>com.apptile.apptilepreviewdemo</string>/g" "<string>$bundle_id</string>" ./ios/ReactNativeTSProject/Info.plist --isRegex
npx --yes replace-in-file "/<string>demoapptileprvw</string>/g" "<string>$url_scheme</string>" ./ios/ReactNativeTSProject/Info.plist --isRegex
plutil -replace NSAppTransportSecurity.NSExceptionDomains -dictionary ./ios/ReactNativeTSProject/Info.plist
npx --yes replace-in-file "/<string>group.com.apptile.apptilepreviewdemo.notification</string>/g" "<string>group.$bundle_id.notification</string>" ./ios/ReactNativeTSProject/ReactNativeTSProject.entitlements --isRegex
npx --yes replace-in-file "/<string>group.com.apptile.apptilepreviewdemo.notification</string>/g" "<string>group.$bundle_id.notification</string>" ./ios/ReactNativeTSProject/ReactNativeTSProjectRelease.entitlements --isRegex
npx --yes replace-in-file "/<string>group.com.apptile.apptilepreviewdemo.notification</string>/g" "<string>group.$bundle_id.notification</string>" ./ios/ImageNotification/ImageNotification.entitlements --isRegex
npx --yes replace-in-file "/<string>group.com.apptile.apptilepreviewdemo.notification</string>/g" "<string>group.$bundle_id.notification</string>" ./ios/NotificationContentExtension/NotificationContentExtension.entitlements --isRegex


echo -e "\n\n⏳ Installing node_modules required for preview app\n"

npm i $(cat $project_path/devops/files/preview-app/packages.txt) --no-audit


echo -e "\n\n⏳ Updating ios project file...\n"

node $project_path/devops/scripts/ios/update-project-file.js $PWD/ios/ReactNativeTSProject.xcodeproj/project.pbxproj


echo -e "\n\n⏳ Updating app name to \033[0;35m$app_name\033[0m and bundle ID to \033[0;35m$bundle_id\033[0m \n"

plutil -replace CFBundleDisplayName -string "$app_name" ./ios/ReactNativeTSProject/Info.plist
npx --yes replace-in-file "/com.apptile.apptilepreviewdemo/g" $bundle_id ./ios/ReactNativeTSProject.xcodeproj/project.pbxproj --isRegex


echo -e "\n\n⏳ Updating app version code to \033[0;35m$current_project_version\033[0m and version name to \033[0;35m$marketing_version\033[0m \n"

npx --yes replace-in-file "/CURRENT_PROJECT_VERSION = [1-9]{1,4}/g" "CURRENT_PROJECT_VERSION = $current_project_version" ./ios/ReactNativeTSProject.xcodeproj/project.pbxproj --isRegex
npx --yes replace-in-file "/MARKETING_VERSION = .{1,12}/g" "MARKETING_VERSION = $marketing_version;" ./ios/ReactNativeTSProject.xcodeproj/project.pbxproj --isRegex


echo -e " \n\n⚙️ Generating Splash from image at path \033[0;35m$splash_path\033[0m \n"

$project_path/devops/scripts/ios/imageset-generator.sh $splash_path $temp_dir/ios/ReactNativeTSProject


echo -e " \n\n⚙️ Generating app icon from image at path \033[0;35m$icon_path\033[0m \n"

cp $icon_path $temp_dir/ios/icon.png
$project_path/devops/scripts/ios/iconset-generator.sh $icon_path $temp_dir/ios/ReactNativeTSProject


echo -e "\n\n⏳ Installing pods...\n"

cd ios/
pod install --repo-update
gsed -i 's/source="\$(readlink "\${source}")"/source="\$(readlink -f "\${source}")"/' ./Pods/Target\ Support\ Files/Pods-ReactNativeTSProject/Pods-ReactNativeTSProject-frameworks.sh
cd $temp_dir/


echo -e "\n\n⏳ Building preview app bundle...\n"

watchman watch-del-all $PWD
npx --yes react-native bundle --dev false --entry-file index.js --bundle-output ./ios/preview.bundle --platform ios
cp $build_path/index.ios.bundle ./ios/main.bundle


echo -e "\n\n💼 Archiving project...\n"

archive_logs=$(RCT_NO_LAUNCH_PACKAGER=1 xcodebuild clean archive -sdk iphoneos -workspace $temp_dir/ios/ReactNativeTSProject.xcworkspace -scheme ReactNativeTSProject -archivePath $temp_dir/ios/ReactNativeTSProject.xcarchive | xcbeautify 2>&1 | tee >(cat - >&2))
echo "$archive_logs" | grep -q "Archive Succeeded"


echo -e "\n\n⚙️ Generating .ipa file...\n"

cp $project_path/devops/files/preview-app/ios/ExportOptions.plist $temp_dir
plutil -replace teamID -string $team_id $temp_dir/ExportOptions.plist
export_logs=$(xcodebuild -exportArchive -archivePath $temp_dir/ios/ReactNativeTSProject.xcarchive -exportPath $build_path -exportOptionsPlist $temp_dir/ExportOptions.plist -allowProvisioningUpdates | xcbeautify 2>&1 | tee >(cat - >&2))
echo "$export_logs" | grep -q "Export Succeeded"

echo -e "\n\033[0;32mSuccessfully built $build_path/ReactNativeTSProject.ipa! 🎉 🎉 🎉\033[0m"


cd $project_path && rm -rf $temp_dir/

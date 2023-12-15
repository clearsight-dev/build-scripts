project_path="$1"
build_tweaks=$pwd

add_comments() {
    cd "$4"
    sed -i '' -e "/$1/,/$2/ s/^/<!-- /" -e "/$1/,/$2/ s/$/ -->/" "$3"
}

echo "Running Build Script Tweaks..."

cp -R $build_tweaks/devops $project_path

echo "Removing Incompatible AppGroups and App-Payment in Entitlement Files"

# Add comments to specific lines in NotificationContentExtension.entitlements
add_comments '<key>com.apple.security.application-groups<\/key>' '<\/array>' NotificationContentExtension.entitlements $project_path/ios/NotificationContentExtension

# Add comments to specific lines in ImageNotification.entitlements
add_comments '<key>com.apple.security.application-groups<\/key>' '<\/array>' ImageNotification.entitlements $project_path/ios/ImageNotification

# Add comments to specific lines in ReactNativeTSProject.entitlements
add_comments '<key>com.apple.security.application-groups<\/key>' '<\/array>' ReactNativeTSProject.entitlements $project_path/ios/ReactNativeTSProject

# Add comments to specific lines in ReactNativeTSProject.entitlements
add_comments '<key>com.apple.developer.in-app-payments<\/key>' '<\/array>' ReactNativeTSProject.entitlements $project_path/ios/ReactNativeTSProject

# Add comments to specific lines in ReactNativeTSProjectRelease.entitlements
add_comments '<key>com.apple.security.application-groups<\/key>' '<\/array>' ReactNativeTSProjectRelease.entitlements $project_path/ios/ReactNativeTSProject

# Add comments to specific lines in ReactNativeTSProjectRelease.entitlements
add_comments '<key>com.apple.developer.in-app-payments<\/key>' '<\/array>' ReactNativeTSProjectRelease.entitlements $project_path/ios/ReactNativeTSProject
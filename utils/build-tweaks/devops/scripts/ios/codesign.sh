#!/bin/bash -e

# TODO: DELETE this file sometime later

react_native_project_root=$(pwd)
RUNNER_TEMP="$HOME/Downloads"
KEYCHAIN_PASSWORD="randompass"

CERTIFICATE_PATH=$RUNNER_TEMP/Certificates.p12
PP_PATH=$RUNNER_TEMP/apptilepreviewdemo.mobileprovision
KEYCHAIN_NAME=build.keychain
provisioning_profile="iPhone Distribution: Clearsight Technologies Private Limited"

# security delete-keychain $KEYCHAIN_PATH

# create temporary keychain
security create-keychain -p "" $KEYCHAIN_NAME
# security import $CERTIFICATE_PATH -t agg -k ~/Library/Keychains/$KEYCHAIN_NAME -P "" -A -T /usr/bin/codesign
security import $CERTIFICATE_PATH -P "" -A -t cert -f pkcs12 -k ~/Library/Keychains/$KEYCHAIN_NAME -T /usr/bin/codesign

# https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer
security add-trusted-cert -d -r unspecified -k ~/Library/Keychains/$KEYCHAIN_NAME $RUNNER_TEMP/AppleWWDRCAG3.cer


security list-keychains -s ~/Library/Keychains/$KEYCHAIN_NAME
security default-keychain -s ~/Library/Keychains/$KEYCHAIN_NAME
security unlock-keychain -p "" ~/Library/Keychains/$KEYCHAIN_NAME

security set-key-partition-list -S apple-tool:,apple: -s -k "" ~/Library/Keychains/$KEYCHAIN_NAME


echo "Available provisioning profiles"
security find-identity $KEYCHAIN_PATH -p codesigning -v

#verify that the requested provisioning profile can be found
(security find-certificate -a -c "$provisioning_profile" -Z | grep ^SHA-1)
echo  "~/Library/Keychains/$KEYCHAIN_NAME"

echo "Creating directory ~/Library/MobileDevice/Provisioning\ Profiles"
mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles

uuid=`security cms -D -i ${PP_PATH} | grep -aA1 UUID | grep -o "[-a-zA-Z0-9]\{36\}"`
echo "uuid is $uuid"

if [[ -z "$uuid" ]]
then
  echo "UUID could not be found in $PP_PATH"
  exit 1
fi

destination="$HOME/Library/MobileDevice/Provisioning Profiles/$uuid.mobileprovision"
cp $PP_PATH "$destination"
echo  "cp $PP_PATH $destination"
echo "Installed to $destination"


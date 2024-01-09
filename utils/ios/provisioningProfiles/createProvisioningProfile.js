import config from "../../../config/index.js";
import AuthHeader from "../auth.js";
import fs from "fs";
import path from "path";
import axios from "axios";

export default async function generateProvisioningProfile(
  appName,
  bundleId,
  profileName,
  certificateId,
  downloadPath
) {
  const profilePayload = createProvisionPayload(
    appName,
    bundleId,
    profileName,
    certificateId
  );

  console.log("This is the bundle Id", bundleId);

  const profileFilePath = path.join(
    downloadPath,
    `${appName}_${profileName}.mobileprovision`
  );

  try {
    const profileResponse = await axios.post(
      `${config.appstore.apiBaseUrl}/profiles`,
      profilePayload,
      AuthHeader
    );

    const profileContent = profileResponse.data.data.attributes.profileContent;

    const profileBuffer = Buffer.from(profileContent, "base64");
    fs.writeFileSync(profileFilePath, Buffer.from(profileBuffer, "base64"));

    console.log(
      `Provisioning profile '${profileName}' generated and stored at: ${profileFilePath}`
    );
    return profileFilePath;
  } catch (profileError) {
    console.log(profileError);
  }
}

function createProvisionPayload(appName, bundleId, profileName, certificateId) {
  return {
    data: {
      relationships: {
        certificates: {
          data: [
            {
              id: certificateId,
              type: "certificates",
            },
          ],
        },
        bundleId: {
          data: {
            id: bundleId,
            type: "bundleIds",
          },
        },
      },
      attributes: {
        profileType: "IOS_APP_STORE",
        name: `${appName}-${profileName}`,
      },
      type: "profiles",
    },
  };
}

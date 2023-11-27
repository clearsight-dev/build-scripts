import AuthHeader from "./generate-jwt.js";
import config from "../../config/index.js";
import chalk from "chalk";
import axios from "axios";

const APPSTORE_CONNECT_API = config.appstore.apiBaseUrl;
export async function createBundleIdentifier(appName, bundleName) {
  try {
    console.log(`Generating Bundle Identifier for ${bundleName}`);

    const bundleIdPayload = createBundleIdPayload(bundleName, `${appName} `);

    const bundleIdResponse = await axios.post(
      `${APPSTORE_CONNECT_API}/bundleIds`,
      bundleIdPayload,
      AuthHeader
    );

    console.log(
      `Created Bundle Identifier with ID ${bundleIdResponse.data.data.id} for ${bundleName}`
    );

    return bundleIdResponse.data.data.id;
  } catch (error) {
    if (error.response) {
      const { errors } = error.response.data;
      if (errors && errors.length > 0) {
        const [firstError] = errors;
        const { code, detail } = firstError;

        if (code === "ENTITY_ERROR.ATTRIBUTE.INVALID") {
          if (detail.includes(`'${bundleName}' is not a valid identifier`)) {
            console.error(
              chalk.red(`Invalid bundle identifier provided: ${detail}`)
            );
          } else if (
            detail.includes(`Identifier '${bundleName}' is not available`)
          ) {
            const existingBundleId = await getBundleIdByBundleName(bundleName);
            if (!existingBundleId) {
              throw new Error(`${bundleName} cannot be used as an Identifier`);
            }
            console.log(
              chalk.yellow(
                `Bundle ID already exists with ID ${existingBundleId}. Skipping creation.`
              )
            );
            // return existingBundleId;
          }
        }
      }
    } else {
      throw new Error(error);
    }
  }
}

async function getBundleIdByBundleName(bundleName) {
  try {
    const response = await axios.get(
      `${APPSTORE_CONNECT_API}/bundleIds`,
      AuthHeader
    );
    const bundleIds = response.data.data;
    const matchingBundle = bundleIds.find(
      (bundle) => bundle.attributes.identifier === bundleName
    );
    if (matchingBundle) {
      const bundleId = matchingBundle.id;
      return bundleId;
    } else {
      console.log(`No bundle found with name: ${bundleName}`);
    }
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
}

export function createBundleIdPayload(identifier, name) {
  return {
    data: {
      type: "bundleIds",
      attributes: {
        identifier: identifier,
        name: name,
        platform: "IOS",
      },
    },
  };
}

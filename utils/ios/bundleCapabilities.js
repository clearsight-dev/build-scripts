import config from "../../config/index.js";
import AuthHeader from "./auth.js";
import axios from "axios";
import chalk from "chalk";

const APPSTORE_CONNECT_API = config.appstore.apiBaseUrl;
const bundleCapabilities = config.appstore.bundleCapabilities;
export async function createBundleCapabilities(bundleId) {
  for (const bundleCapability of bundleCapabilities) {
    const capabilityPayload = createCapabilityPayload(
      bundleId,
      bundleCapability
    );
    try {
      await axios.post(
        `${APPSTORE_CONNECT_API}/bundleIdCapabilities`,
        capabilityPayload,
        AuthHeader
      );
      console.log(
        chalk.green(
          `Capability '${bundleCapability}' added for bundle ID '${bundleId}'.`
        )
      );
    } catch (capabilityError) {
      console.log(capabilityError.message);
    }
  }
}

export function createCapabilityPayload(bundleId, capabilityType) {
  return {
    data: {
      relationships: {
        bundleId: {
          data: {
            type: "bundleIds",
            id: bundleId,
          },
        },
      },
      attributes: {
        capabilityType: capabilityType,
      },
      type: "bundleIdCapabilities",
    },
  };
}

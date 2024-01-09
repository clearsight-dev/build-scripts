import axios from "axios";
import config from "../../config/index.js";
import { delay } from "../../utils/index.js";

export async function updateMinFrameWork(appId, minFrameworkVersion) {
  try {
    console.log("Updating Min FrameWork Version to App...");
    await axios.put(
      `${config.apiBaseUrl}/api/app/${appId}/minFrameWork?minFrameworkVersion=${minFrameworkVersion}`
    );
  } catch (error) {
    console.error("Error Updating MinFrameWork", error.message);
    throw error;
  }
}

export async function enablePublishFlow(appId) {
  try {
    console.log("Enabling Publish Flow for APP...");
    await axios.put(`${config.apiBaseUrl}/api/app/${appId}/published`);
    console.log(`Succesfully Enabled For App Id ${appId}`);
  } catch (error) {
    console.error("Error Enabling Publish Flow", error.message);
    throw error;
  }
}

import { execSync } from "child_process";
import { moveFile } from "../index.js";
import chalk from "chalk";
import { projectStage } from "../../firebase.js";
export const logError = (message) => {
  projectStage.success = false;
  projectStage.Error_Message = message;
  console.log(chalk.red(message));
};

export function execute(command, options = {}) {
  const Options = {
    encoding: "utf-8",
    stdio: "pipe",
    ...options,
  };
  return execSync(command, Options);
}

const executeCommand = (command, stage) => {
  console.log(stage);
  projectStage.stage = stage;
  execute(command);
};

export const createFirebaseProject = (projectId, projectName) => {
  const createProjectCommand = `firebase projects:create -n "${projectName}" -i "${projectId}" --debug`;
  executeCommand(createProjectCommand, "Creating A New Project");
};

export const useFirebaseProject = (projectId) => {
  const useProjectCommand = `firebase use ${projectId} --debug`;
  executeCommand(useProjectCommand, `Using Project ${projectId}`);
};

export const createFirebaseApp = (platform, appName, bundleID) => {
  try {
    const createAndroidApp = `firebase apps:create ANDROID "${appName}" -a ${bundleID} --debug`;

    const createIOSApp = `firebase apps:create IOS "${appName}" -b ${bundleID} -s "" --debug`;

    const createAppCommand =
      platform === "ANDROID" ? createAndroidApp : createIOSApp;

    executeCommand(createAppCommand, `Creating ${platform} App`);
  } catch (error) {
    const errorMessage =
      (error.stdout ?? "") + (error.stderr ?? "") + (error.message ?? "");

    if (errorMessage.includes("Requested entity already exists")) {
      if (projectStage.stage === "Creating ANDROID App")
        console.log(
          `An Android app already exists with the specified bundle identifier ${bundleID} ... `
        );
      if (projectStage.stage === "Creating IOS App")
        console.log(
          `An IOS app already exists with the specified bundle identifier ${bundleID} ... `
        );
    } else if (errorMessage.includes("Request contains an invalid argument")) {
      throw new Error(`Request contains an invalid argument ${errorMessage}`);
    }

    if (
      projectStage.stage === "Creating ANDROID App" ||
      projectStage.stage === "Creating IOS App"
    ) {
    } else {
      console.log(errorMessage, "here");
      throw new Error("Failed creating App\n" + errorMessage);
    }
  }
};

export const downloadFirebaseConfig = (platform) => {
  const downloadConfigCommand = `firebase apps:sdkconfig "${platform}" -o ./${
    platform === "ANDROID" ? "google-services.json" : "GoogleService-Info.plist"
  } --debug`;
  executeCommand(downloadConfigCommand, `Downloading ${platform} CONFIG FILE`);

  moveFile(
    platform === "ANDROID" ? "google-services.json" : "GoogleService-Info.plist"
  );
};

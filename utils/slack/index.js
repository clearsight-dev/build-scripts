import axios from "axios";
import config from "../../config/index.js";

export function generateBuildSuccessAlert(
  appname,
  platform,
  version,
  semver,
  artefactUrl
) {
  const data = JSON.stringify({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${appname.toUpperCase()}* ${semver}(${version}) Build For *${platform.toUpperCase()}* is Ready ✅ 💯`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `*${platform.toUpperCase()}* *Link 🔗 : *  ` +
            "`" +
            artefactUrl +
            "`",
        },
      },
    ],
  });
  return data;
}

export function generateBuildFailureAlert(
  appname,
  platform,
  version,
  semver,
  ErrorMessage
) {
  const failedData = JSON.stringify({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${appname.toUpperCase()}* ${semver}(${version}) Build For *${platform.toUpperCase()}* Failed 🔴`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Reason:*` + "```\n" + ErrorMessage + "\n```",
        },
      },
    ],
  });

  return failedData;
}

export function sendFirebaseSuccessAlert(
  appName,
  projectId,
  warnings,
  screenshotPath
) {
  const data = JSON.stringify({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Firebase* for *${appName.toUpperCase()}* Creation Success 🔥`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Link 🔗 :* ${"```\n"}https://console.firebase.google.com/project/${projectId}${"```\n"}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Warnings ⚠️* : ${"```\n"}${
            warnings.length > 0 ? warnings.join("\n") : "None"
          }${"```\n"} ${
            screenshotPath
              ? `\n *Puppeteer Crash ScreenShot* :${
                  "```\n" + screenshotPath + "```\n"
                }`
              : ""
          }\n`,
        },
      },
    ],
  });
  return data;
}

export function sendFirebaseFailureAlert(appName, errors) {
  const data = JSON.stringify({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Firebase* for *${appName.toUpperCase()}* Creation Failed 🔴`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Errors :* ${"```\n" + JSON.stringify(errors) + "```\n"}\n`,
        },
      },
    ],
  });
  return data;
}

export async function sendSlackAlerts(messageAlert) {
  const postConfig = {
    method: "post",
    url: config.slackWebHook,
    headers: {
      "Content-type": "application/json",
    },
    data: messageAlert,
  };

  await axios.post(postConfig.url, postConfig.data, {
    ...postConfig.headers,
  });
}

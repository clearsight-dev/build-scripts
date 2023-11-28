import axios from "axios";
import config from "../../config/index.js";

function generateSuccessAlert(appname, platform, version, semver, artefactUrl) {
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
            `*${platform.toUpperCase()}* *Link : *  ` + "`" + artefactUrl + "`",
        },
      },
    ],
  });
  return data;
}

function generateFailureAlert(
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
          text: `*${appname.toUpperCase()}* ${semver}(${version}) Build For *${platform.toUpperCase()}* Failed 🔴 🔴`,
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

export async function sendSlackAlerts(isBuildSuccess, ...restParams) {
  const postConfig = {
    method: "post",
    url: config.slackWebHook,
    headers: {
      "Content-type": "application/json",
    },
    data: isBuildSuccess
      ? generateSuccessAlert(...restParams)
      : generateFailureAlert(...restParams),
  };

  await axios.post(postConfig.url, postConfig.data, {
    ...postConfig.headers,
  });
}

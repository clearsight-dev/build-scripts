import axios from "axios";
import config from "../../config/index.js";
import AuthHeader from "./auth.js";

const APPSTORE_CONNECT_API = config.appstore.apiBaseUrl;

// Logic  for submitting a build for review for  external test-flight
// 1. Create External Test Flight
// 2.Update beta app review detail with app id (By Default details will be null so you need to create it)
// 3. Beta App Localization (fill in the app local information like locale, description etc)
// 4. Beta App Submission For Review
// 5. Add Beta Build to Test Group

export async function createInternalTestFlight(bundleIdentifier) {
  try {
    const { testers } = config.appstore;
    const appId = await getAppIdByBundleIdentifier(bundleIdentifier);

    if (!appId)
      throw new Error(
        `App with ${bundleIdentifier} has not been created on Appstore. Testflight Creation Failed`
      );

    const betaGroupId = await createBetaGroup(appId, "apptile-internals", true);

    await addPeopleToTestflight(betaGroupId, testers);
  } catch (err) {
    const errMessage =
      "Failed Adding testers to Internal test flight" +
      "\n" +
      err.message +
      "\n" +
      err.stack;
    console.error(errMessage);
  }
}

export async function createExternalTestFlight(bundleIdentifier) {
  try {
    const { testers } = config.appstore;
    const appId = await getAppIdByBundleIdentifier(bundleIdentifier);

    if (!appId)
      throw new Error(
        `App with ${bundleIdentifier} has not been created on Appstore. Testflight Creation Failed`
      );

    const betaGroupId = await createBetaGroup(
      appId,
      "apptile-externals",
      false
    );

    await addPeopleToTestflight(betaGroupId, testers);
  } catch (err) {
    const errMessage =
      "Failed Adding testers to test flight" +
      "\n" +
      err.message +
      "\n" +
      err.stack;
    console.error(errMessage);
  }
}

async function addPeopleToTestflight(testGroupId, betaTesterUUIDs) {
  console.log("Adding People To Testflight..");
  const payload = {
    data: betaTesterUUIDs.map((uuid) => ({
      id: uuid,
      type: "betaTesters",
    })),
  };

  const response = await axios.post(
    `${APPSTORE_CONNECT_API}/betaGroups/${testGroupId}/relationships/betaTesters`,
    payload,
    AuthHeader
  );
  console.log(response.data);
  console.log("Added people to testflight successfully..");
}

async function getAppIdByBundleIdentifier(bundleIdentifier) {
  const response = await axios.get(
    `${APPSTORE_CONNECT_API}/apps?filter[bundleId]=${bundleIdentifier}`,
    AuthHeader
  );

  const appId = response.data?.data[0].id;
  return appId;
}

async function createBetaGroup(appId, betaGroupName, isInternalGroup) {
  /* @param isInternalGroup:boolean

      true Creates Internal Testflight
      false Creates External Testflight

      */

  const payload = {
    data: {
      attributes: {
        name: betaGroupName,
        isInternalGroup,
        hasAccessToAllBuilds: true,
      },
      type: "betaGroups",
      relationships: {
        app: {
          data: {
            id: appId,
            type: "apps",
          },
        },
      },
    },
  };

  const response = await axios.post(
    `${APPSTORE_CONNECT_API}/betaGroups`,
    payload,
    AuthHeader
  );
  const betaGroupId = response.data.data.id;
  return betaGroupId;
}

export async function submitBuildForExternalTesting(
  bundleIdentifier,
  signInInfo
) {
  try {
    const appId = await getAppIdByBundleIdentifier(bundleIdentifier);

    if (!appId)
      throw new Error(
        `App with ${bundleIdentifier} has not been created on Appstore. Testflight Creation Failed`
      );

    const buildId = await getLatestBuild(appId);

    if (!buildId) {
      throw new Error(`No Builds are present to submit for external review`);
    }

    await updateAppReviewDetails(appId, signInInfo);

    await createBetaAppLocalization(
      appId,
      signInInfo.contactEmail,
      "Test Ecommerce Flow"
    );

    await submitBuildForReview(buildId);
  } catch (err) {
    console.error("Failed Submitting Build for external testflight review");
  }
}

//! Assumes api response first build is always the latest

async function getLatestBuild(appId) {
  const response = await axios.get(
    `${APPSTORE_CONNECT_API}/apps/${appId}/builds`,
    AuthHeader
  );

  const buildId = response.data.data[0].id;
  return buildId;
}
async function updateAppReviewDetails(appId, signInInfo) {
  const {
    contactEmail,
    contactFirstName,
    contactLastName,
    contactPhone,
    demoAccountName,
    demoAccountPassword,
  } = signInInfo;
  const payload = {
    data: {
      type: "betaAppReviewDetails",
      id: appId,
      attributes: {
        contactEmail,
        contactFirstName,
        contactLastName,
        contactPhone,
        demoAccountName,
        demoAccountPassword,
        demoAccountRequired: true,
      },
    },
  };

  const response = await axios.patch(
    `${APPSTORE_CONNECT_API}/betaAppReviewDetails/${appId}`,
    payload,
    AuthHeader
  );
}

async function createBetaAppLocalization(appId, feedbackEmail, description) {
  const payload = {
    data: {
      type: "betaAppLocalizations",
      attributes: {
        locale: "en-US",
        feedbackEmail,
        description,
      },
      relationships: {
        app: {
          data: {
            type: "apps",
            id: appId,
          },
        },
      },
    },
  };

  const response = await axios.post(
    `${APPSTORE_CONNECT_API}/betaAppLocalizations`,
    payload,
    AuthHeader
  );
}

async function submitBuildForReview(buildId) {
  const payload = {
    data: {
      type: "betaAppReviewSubmissions",
      relationships: {
        build: {
          data: {
            type: "builds",
            id: buildId,
          },
        },
      },
    },
  };

  await axios.post(
    `${APPSTORE_CONNECT_API}/betaAppReviewSubmissions`,
    payload,
    AuthHeader
  );
}

//!! Add build to external test flight

///
// https://api.appstoreconnect.apple.com/v1/builds/c842ea5b-2879-4b12-a35b-11a60423adda/relationships/betaGroups
// {
//   "data": [{
//     "id": "3a93458e-1089-409d-8f0f-ac32899cd7cc",
//     "type": "betaGroups"
//   }]
// }

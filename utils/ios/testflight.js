import axios from "axios";
import config from "../../config/index.js";
import AuthHeader from "./auth.js";

const APPSTORE_CONNECT_API = config.appstore.apiBaseUrl;

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

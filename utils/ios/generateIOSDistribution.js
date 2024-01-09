import AuthHeader from "./auth.js";
import config from "../../config/index.js";
import axios from "axios";
import path from "path";
import fs from "fs";

export async function createDistributionCertificate(csrPath, downloadPath) {
  try {
    const certificateContent = fs.readFileSync(csrPath).toString();

    const cerPath = path.join(downloadPath, "distribution.cer");

    const csrContentPayload = {
      data: {
        type: "certificates",
        attributes: {
          certificateType: "IOS_DISTRIBUTION",
          csrContent: certificateContent,
        },
      },
    };

    const certificateResponse = await axios.post(
      `${config.appstore.apiBaseUrl}/certificates`,
      csrContentPayload,
      AuthHeader
    );
    const certId = certificateResponse.data.data.id;
    const base64CER =
      certificateResponse.data.data.attributes.certificateContent;

    fs.writeFileSync(cerPath, Buffer.from(base64CER, "base64"));

    return { certId, cerPath };
  } catch (error) {
    if (error.response) {
      const statusCode = error.response.status;
      const responseData = error.response.data;
      console.log(responseData);
      if (
        statusCode === 409 &&
        responseData.errors &&
        responseData.errors.length > 0
      ) {
        const firstError = responseData.errors[0];
        const errorCode = firstError.code;
        const errorDetail = firstError.detail;

        if (
          errorCode === "ENTITY_ERROR" &&
          errorDetail.includes(
            "You already have a current iOS Distribution certificate or a pending certificate request."
          )
        ) {
          // Handle the case where a distribution certificate already exists or is pending
          console.log(
            "MAX CERTIFICATES EXCEEDED ON APPSTORE. DELETE ATLEAST ONE OR USE ONE OF THE EXISITNG CERTIFICATE ID TO GENERATE PROVISIONING PROFILES"
          );
          // Query the list of certificates to find the existing certificate by matching its attributes
        }
      }
      // Handle other errors using the existing handleApiError function
    }
  }
}

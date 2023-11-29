import fs from "fs";
import jwt from "jsonwebtoken";
import config from "../../config/index.js";

export function generateJWT() {
  console.log("Generating JWT....");

  // You get privateKey, apiKeyId and issuerId from your Apple App Store Connect account

  const { apiKeyId, issuerId, privateKeyPath } = config.appstore.credentials;

  const privateKey = fs.readFileSync(privateKeyPath);
  let now = Math.round(new Date().getTime() / 1000); // Notice the /1000
  let nowPlus20 = now + 1199; // 1200 === 20 minutes

  let payload = {
    iss: issuerId,
    exp: nowPlus20,
    aud: "appstoreconnect-v1",
  };

  let signOptions = {
    algorithm: "ES256", // you must use this algorythm, not jsonwebtoken's default
    header: {
      alg: "ES256",
      kid: apiKeyId,
      typ: "JWT",
    },
  };

  const token = jwt.sign(payload, privateKey, signOptions);
  return token;
}

const jwtToken = generateJWT();
// console.log(jwtToken);
const AuthHeader = {
  headers: {
    Authorization: `Bearer ${jwtToken}`,
  },
};

// generateJWT();

export default AuthHeader;

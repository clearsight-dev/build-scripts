import shell from "shelljs";
import path from "path";

export async function generateCSR(assetsPath) {
  // const currentWrkDir = path.resolve(process.cwd());

  // const assetsPath = path.join(currentWrkDir, "assets");

  console.log(assetsPath);
  // Generate a Private Key
  shell.exec(
    `openssl genpkey -algorithm RSA -out ${assetsPath}/private_key.pem`
  );

  // Extract the Public Key from the Private Key
  shell.exec(
    `openssl rsa -pubout -in ${assetsPath}/private_key.pem -out ${assetsPath}/public_key.pem`
  );

  const subjectInfo =
    "/C=US/ST=Karnataka/L=Bengaluru/O=Apptile/OU=Apptile Unit/CN=Apptile";

  // Generate a CSR
  shell.exec(
    `openssl req -new -key ${assetsPath}/private_key.pem -out ${assetsPath}/csr.pem -subj "${subjectInfo}" -batch`
  );

  return {
    csrPath: `${assetsPath}/csr.pem`,
    privateKeyPath: `${assetsPath}/private_key.pem`,
    publicKeyPath: `${assetsPath}/public_key.pem`,
  };
}

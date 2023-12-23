import shell from "shelljs";
import path from "path";

export function generateP12(privateKeyPath, cerPath, assetsPath) {
  // const currentWrkDir = path.resolve(process.cwd());

  // const assetsPath = path.join(currentWrkDir, "assets");

  shell.exec(
    `openssl pkcs12 -export -out ${assetsPath}/output.p12 -inkey ${privateKeyPath} -in ${cerPath} -passout pass:`
  );

  shell.exec(
    `openssl pkcs12 -info -in ${assetsPath}/output.p12 -noout -passin pass:`
  );

  return `${assetsPath}/output.p12`;
}

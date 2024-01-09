import shell from "shelljs";

export function generateP12(
  privateKeyPath,
  cerPath,
  assetsPath,
  password = ""
) {
  // const currentWrkDir = path.resolve(process.cwd());

  // const assetsPath = path.join(currentWrkDir, "assets");

  shell.exec(
    `openssl pkcs12 -export -legacy -out ${assetsPath}/output.p12 -inkey ${privateKeyPath} -in ${cerPath} -passout pass:${password}`
  );

  // shell.exec(
  //   `openssl pkcs12 -info -in ${assetsPath}/output.p12 -noout -passin pass:${password}`
  // );

  return `${assetsPath}/output.p12`;
}

const xcode = require('xcode');
const fs = require('fs');

if (process.argv.length < 3) {
  console.error('Please pass the project path as the first argument');
  process.exit(1);
}

const projectPath = process.argv[2];
const isProd = process.argv[3];

const project = xcode.project(projectPath);

project.parse(function (err) {
  if (err) throw new Error(err);
  const RESOURCES_GROUP = project.findPBXGroupKey({name: 'Resources'});
  // project.addResourceFile('main.bundle', {}, RESOURCES_GROUP);

  if (!isProd) {
    project.addResourceFile('preview.bundle', {}, RESOURCES_GROUP);
    const APP_GROUP = project.findPBXGroupKey({name: 'ReactNativeTSProject'});
    project.addHeaderFile('ReactNativeTSProject/PreviewDelegate.h', {}, APP_GROUP);
    project.addSourceFile('ReactNativeTSProject/PreviewDelegate.m', {}, APP_GROUP);
  }

  fs.writeFileSync(projectPath, project.writeSync());
});

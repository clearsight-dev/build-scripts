# Build System v 1.0

## Features:

With just a click of a button, Build System performs the following tasks for a given Apptile app.

### IOS Build System:
- Generate IPA for an App 
- Generating Bundle Identifiers on Appstore Connect
- Adding Bundle Capabilities on Appstore Connect
- Upload IPA to TestFlight
- Add Testers to TestFlight

### Android Build System:
- Generate APK with Build Config.
- Perform multiple parallel builds using AWS CodeBuild Serverless.

### Firebase Pipeline:
- Create Firebase Project for a given app ID
- Create Android App within a project for a given bundle ID
- Create IOS App within a project for a given bundle ID
- Download Android and IOS Config Files
- Auto-generate Service Account Key File
- Auto-enable Analytics for a given project

### Alert and Logging:
- Build Success Alerts through Slack Channel when a build completes
- Build Failure Alerts through Slack Channel when a build fails with Error Stack and human-readable Error.
- Error Logs for Each failure are stored on S3 and are available to download through the build dashboard

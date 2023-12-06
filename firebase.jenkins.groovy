// Paste this in the Pipeline Script in Firebase Creation Pipeline


// @param 

// appId -- app_id of the customer's app
// projectName -- project name of the firebase project
// bundleId -- bundle id of the firebase apps
// usingApptileAccount -- true/false determines whether we are creating on apptile acc or customer acc


pipeline {
    agent {label 'mac'} 

    stages {
        stage('Firebase Creation') {
            steps {
                script {
                    // Add your other commands here
                    def buildConfig = params.buildConfig
                    sh '''
                    cd /absolutepath/to/build/scripts
                     APP_ID="$appId" BUNDLE_ID="$bundleId" APP_NAME="$projectName" EXISTING_PROJECT_ID="$existingProjectId" usingApptileAccount="$usingApptileAccount" node firebase.js
                    '''
                }
            }
        }
    }
}

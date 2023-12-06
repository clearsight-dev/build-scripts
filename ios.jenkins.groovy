
// Paste this in the Pipeline Script JENKINS IOS Build Pipeline

//  BUILD IS PARAMETERIZED IN CONFIGURE PIPELINE AND ADD THESE FOLLOWING PARAMETERS 
//SO THAT JENKINS WILL PASS THESE VARAIBLES IN BUILD ENIRONMENT

// @param 

// buildConfig -- distribution.config json that is sent through build manager
// buildName -- build name for jenkins to name this build



pipeline {
    agent {label 'mac'} 

 
    stages {
        stage('Building IOS') {
            steps {
                script {
                    currentBuild.displayName="$buildName"

                    def buildConfig = params.buildConfig
                    sh '''
                    cd /absolutepath/to/build/scripts
                   # BUILD_CONFIG="$buildConfig" PLATFORM="ios" node index.js
                    '''
                }
            }
        }
    }
    
        post {
        aborted {
            echo 'Job was aborted (killed). Performing cleanup or additional actions.'
            // Add your actions to be executed on job abortion (kill)
        }

    }

    
    
    
}

// Paste this in the Pipeline Script in Jenkins Android Build Pipeline

// THIS is triggered in AWS Codebuild and you need to install aws codebuild plugin inorder for this to work

// @param 

// buildConfig -- distribution.config json that is sent through build manager
// buildName -- build name for jenkins to name this build

//!!!! IMPORTANT - ADD AWS ACCESS KEY AND AWS SECRET KEY INORDER FOR THIS TO WORK 

pipeline {
    agent {label 'node'}
    stages {
       
        stage('Build') {
            steps {
                script {
                    currentBuild.displayName="$buildName"
                    // Use a node block to ensure the necessary context is available
                    node {
                        // awsCodeBuild step
                        awsCodeBuild(
                            artifactEncryptionDisabledOverride: '',
                            artifactLocationOverride: '',
                            artifactNameOverride: '',
                            artifactNamespaceOverride: '',
                            artifactPackagingOverride: '',
                            artifactPathOverride: '',
                            artifactTypeOverride: '',
                            awsAccessKey: 'XXXXXXXXXXXX',  //!! AWS Access Key
                            awsSecretKey: 'XXXXXXXXXXXXX', //!! AWS Secret Key
                            buildSpecFile: '',
                            buildTimeoutOverride: '',
                            cacheLocationOverride: '',
                            cacheModesOverride: '',
                            cacheTypeOverride: '',
                            certificateOverride: '',
                            cloudWatchLogsGroupNameOverride: '',
                            cloudWatchLogsStatusOverride: '',
                            cloudWatchLogsStreamNameOverride: '',
                            computeTypeOverride: '',
                            credentialsId: '',
                            credentialsType: 'keys',
                            cwlStreamingDisabled: '',
                            downloadArtifacts: 'false',
                            downloadArtifactsRelativePath: '',
                            envParameters: '',
                            envVariables: '[ { BUILD_CONFIG,$buildConfig},{PLATFORM,android}]',
                            environmentTypeOverride: '',
                            exceptionFailureMode: '',
                            gitCloneDepthOverride: '',
                            imageOverride: '',
                            insecureSslOverride: '',
                            localSourcePath: '',
                            overrideArtifactName: '',
                            privilegedModeOverride: '',
                            projectName: 'android-builder',
                            proxyHost: '',
                            proxyPort: '',
                            region: 'us-east-1',
                            reportBuildStatusOverride: '',
                            s3LogsEncryptionDisabledOverride: '',
                            s3LogsLocationOverride: '',
                            s3LogsStatusOverride: '',
                            sourceControlType:'project',
                            secondaryArtifactsOverride: '',
                            secondarySourcesOverride: '',
                            secondarySourcesVersionOverride: '',
                            serviceRoleOverride: '',
                            sourceLocationOverride: '',
                            sourceVersion: '',
                            sseAlgorithm: '',
                            workspaceExcludes: '',
                            workspaceIncludes: '',
                            workspaceSubdir: ''
                        )
                    }
                }
            }
        }
    }
}

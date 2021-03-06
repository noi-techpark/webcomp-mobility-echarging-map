pipeline {
    agent any

    parameters {
        string(name: 'VERSION', defaultValue: '1.0.0', description: 'Version')
    }

    environment {
        GIT_REPOSITORY = "git@github.com:noi-techpark/webcomp-mobility-echarging-map.git"
    }

    stages {
        stage('Clean') {
            agent {
                dockerfile {
                    filename 'docker/Dockerfile'
                    additionalBuildArgs '--build-arg JENKINS_USER_ID=`id -u jenkins` --build-arg JENKINS_GROUP_ID=`id -g jenkins`'
                    reuseNode true
                }
            }
            steps {
                sh 'rm -rf dist'
            }
        }
        stage('Dependencies') {
            agent {
                dockerfile {
                    filename 'docker/Dockerfile'
                    additionalBuildArgs '--build-arg JENKINS_USER_ID=`id -u jenkins` --build-arg JENKINS_GROUP_ID=`id -g jenkins`'
                    reuseNode true
                }
            }
            steps {
                sh 'yarn install'
            }
        }
        stage('Build') {
            agent {
                dockerfile {
                    filename 'docker/Dockerfile'
                    additionalBuildArgs '--build-arg JENKINS_USER_ID=`id -u jenkins` --build-arg JENKINS_GROUP_ID=`id -g jenkins`'
                    reuseNode true
                }
            }
            steps {
                sh 'yarn run build'
            }
        }
        stage('Git Tag') {
            steps {
                ansiColor('xterm') {
                    sshagent (credentials: ['jenkins_github_ssh_key']) {
                        sh 'git remote set-url origin ${GIT_REPOSITORY}'
                        sh 'git add -A'
                        sh 'git commit -m "Verion ${VERSION}"'
                        sh 'git tag -a v${VERSION} -m "Version ${VERSION}"'
                        sh 'git push origin HEAD:master'
                        sh 'git push origin --tags'
                    }
                }
            }
        }
    }
}

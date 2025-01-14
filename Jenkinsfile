/*
 * Copyright (C) 2022-2025 Savoir-faire Linux Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation; either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program.  If not, see
 * <https://www.gnu.org/licenses/>.
 */

// Requirements:
// - gerrit-trigger plugin
// - Docker plugin
// - ansicolor plugin

pipeline {
    agent any

    triggers {
        gerrit customUrl: '',
            gerritProjects: [
                [branches: [[compareType: 'PLAIN', pattern: 'master']],
                 compareType: 'PLAIN',
                 disableStrictForbiddenFileVerification: false,
                 pattern: 'jami-web']],
            triggerOnEvents: [
                commentAddedContains('!build'),
                patchsetCreated(excludeDrafts: true, excludeNoCodeChange: true,
                    excludeTrivialRebase: true)]
    }

    options {
        ansiColor('xterm')
    }

    parameters {
            string(name: 'GERRIT_REFSPEC',
                   defaultValue: 'refs/heads/master',
                   description: 'The Gerrit refspec to fetch.')
    }

    stages {
        stage('Initialize submodules') {
            steps {
                sh "git submodule update --init --recursive"
            }
        }
        stage('Build jami-daemon') {
            steps {
                dir("daemon") {
                    sh "docker build --build-arg cmake_args=-DJAMI_NODEJS=ON -t jami-daemon ."
                }
            }
        }
        stage('Lint & test') {
            steps {
                script {
                    docker.build("jami-web:${env.BUILD_ID}", "--target test .")
                }
            }
        }
        stage('Build') {
            steps {
                script {
                sh '''#!/bin/bash

                docker build -t jami-web:${BUILD_ID} --target production .

                container_id=$(docker create jami-web:${BUILD_ID})

                mkdir -p jami-web-production/{client,server,common}

                for dir in server common client; do
                    docker cp ${container_id}:/web-client/${dir}/dist jami-web-production/${dir}/
                    docker cp ${container_id}:/web-client/${dir}/package.json jami-web-production/${dir}/
                done

                docker cp ${container_id}:/daemon/bin/nodejs/build/Release/jamid.node jami-web-production/server/
                docker cp ${container_id}:/web-client/server/scripts jami-web-production/server/
                docker cp ${container_id}:/web-client/server/openid-providers.json jami-web-production/server/

                docker cp ${container_id}:/web-client/package.json jami-web-production/
                docker cp ${container_id}:/web-client/install.sh jami-web-production/
                docker cp ${container_id}:/web-client/jami-web.service jami-web-production/

                tar -czf jami-web.tar.gz jami-web-production

                docker rm ${container_id}
                rm -rf jami-web-production
                '''
                }
            }
        }
stage('Post') {
    steps {
        archiveArtifacts artifacts: 'jami-web.tar.gz',
        fingerprint: true,
        onlyIfSuccessful: true
        }
}
stage('Cleanup') {
    steps {
        catchError(buildResult: 'SUCCESS', stageResult: 'SUCCESS') {
            sh '''
                docker container prune -f
                docker image prune -f --filter "until=24h"
                docker volume prune -f
            '''
        }
    }
    post {
        always {
            cleanWs()
        }
    }
}

    }
}

'use strict';
var gConfig = require("../../config.js");

var components = {
    service: {
        "apiVersion": "v1",
        "kind": "Service",
        "metadata": {
            "name": "dashboard-controller-service",
            "labels": {
                "type": "soajs-service"
            }
        },
        "spec": {
            "selector": {
                "soajs-app": "dashboard-controller"
            },
            "ports": [
                {
                    "protocol": "TCP",
                    "port": 4000,
                    "targetPort": 4000
                }
            ]
        }
    },
    deployment: {
        "apiVersion": "extensions/v1beta1",
        "kind": "Deployment",
        "metadata": {
            "name": "dashboard-controller",
            "labels": {
                "soajs.service.group": "core",
                "soajs.service": "controller",
                "soajs.env": "dashboard"
            }
        },
        "spec": {
            "replicas": gConfig.kubernetes.replicas,
            "selector": {
                "matchLabels": {
                    "soajs-app": "dashboard-controller"
                }
            },
            "template": {
                "metadata": {
                    "name": "controllercon",
                    "labels": {
                        "soajs-app": "dashboard-controller"
                    }
                },
                "spec": {
                    "containers": [
                        {
                            "name": "dashboard-controller",
                            "image": gConfig.imagePrefix + "/soajs",
                            "workingDir": "/opt/soajs/FILES/deployer/",
                            "command": ["./soajsDeployer.sh"],
                            "args": ["-T", "service", "-X", "deploy", "-L"],
                            "ports": [
                                {

                                    "containerPort": 4000
                                }
                            ],
                            "env": [
                                {
                                    "name": "NODE_ENV",
                                    "value": "production"
                                },
                                {
                                    "name": "SOAJS_ENV",
                                    "value": "dashboard"
                                },
                                {
                                    "name": "SOAJS_PROFILE",
                                    "value": "/opt/soajs/FILES/profiles/profile.js"
                                },
                                {
                                    "name": "SOAJS_SRV_AUTOREGISTERHOST",
                                    "value": "true"
                                },
                                {
                                    "name": "SOAJS_GIT_OWNER",
                                    "value": "soajs"
                                },
                                {
                                    "name": "SOAJS_GIT_BRANCH",
                                    "value": gConfig.git.branch
                                },
                                {
                                    "name": "SOAJS_GIT_REPO",
                                    "value": "soajs.controller"
                                },
                                {
                                    "name": "SOAJS_DEPLOY_HA",
                                    "value": "kubernetes"
                                },
                                {
                                    "name": "SOAJS_HA_IP",
                                    "valueFrom": {
                                        "fieldRef": {
                                            "fieldPath": "status.podIP"
                                        }
                                    }
                                },
                                {
                                    "name": "SOAJS_HA_NAME",
                                    "valueFrom": {
                                        "fieldRef": {
                                            "fieldPath": "metadata.name"
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        }
    }
};

module.exports = components;

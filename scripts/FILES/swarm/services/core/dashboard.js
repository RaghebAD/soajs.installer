'use strict';
var gConfig = require("../../config.js");

var src = {
	owner: 'soajs',
	repo: 'soajs.dashboard',
	branch: gConfig.git.branch
};

var config = {
	servName: 'dashboard_soajs_dashboard',
	servReplica: parseInt(gConfig.docker.replicas),
	servNetwork: [
		{
			Target: gConfig.docker.network
		}
	],

	image: {
		prefix: gConfig.imagePrefix,
		name: 'soajs'
	},
	env: [
		'NODE_ENV=production',
		'SOAJS_ENV=dashboard',

		'SOAJS_DEPLOY_HA=swarm',
		'SOAJS_HA_NAME={{.Task.Name}}',

		'SOAJS_PROFILE=/opt/soajs/FILES/profiles/profile.js',
		'SOAJS_SRV_AUTOREGISTERHOST=true',
		'SOAJS_MONGO_PREFIX=' + gConfig.mongo.prefix,
		'SOAJS_GIT_OWNER=' + src.owner,
		'SOAJS_GIT_REPO=' + src.repo,
		'SOAJS_GIT_BRANCH=' + src.branch,

		'NODE_TLS_REJECT_UNAUTHORIZED=0' //TODO: check whether this should be kept for testing purposes
	],
	mounts: [
		{
            "Type": "volume",
            "Source": gConfig.docker.volumes.log.label,
            "Target": gConfig.docker.volumes.log.path,
        }
	],
	labels: {
		"soajs.content": "true",
		"soajs.env.code": "dashboard",
		"soajs.service.type": "service",
		"soajs.service.name": "dashboard",
		"soajs.service.group": "SOAJS Core Services",
		"soajs.service.version": "1",
		"soajs.service.label": "dashboard_soajs_dashboard"
	},
	workingDir: '/opt/soajs/FILES/deployer/',
	command: [
		'bash',
		'-c',
		'./soajsDeployer.sh -T service -X deploy -L'
	]
};

module.exports = {
	"Name": config.servName,
	"TaskTemplate": {
		"ContainerSpec": {
			"Image": config.image.prefix + '/' + config.image.name,
			"Env": config.env,
			"Dir": config.workingDir,
			"Command": [config.command[0]],
			"Args": config.command.splice(1),
			"Mounts": config.mounts
		},
		"Resources": {
			"Limits": {
				"MemoryBytes": 209715200.0
			}
		},
		"RestartPolicy": {
			"Condition": "any",
			"MaxAttempts": 5
		}
	},
	"Mode": {
		"Replicated": {
			"Replicas": config.servReplica
		}
	},
	"UpdateConfig": {
		"Delay": 500.0,
		"Parallelism": 2,
		"FailureAction": "pause"
	},
	"Networks": config.servNetwork,
	"Labels": config.labels
};

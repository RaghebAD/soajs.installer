"use strict";
module.exports = {
	"gi": {
		"domain": "soajs.org",
		"api": "dashboard-api",
		"site": "dashboard",
		"wrkDir": "/opt/tmp",
		"email": "me@localhost.com",
		"username": "owner",
		"password": "password"
	},
	"security": {
		"key": "soajs key lal massa",
		"cookie": "this is a secret sentence",
		"session": "this is antoine hage app server",
		"extKey1": "9b96ba56ce934ded56c3f21ac9bdaddc8ba4782b7753cf07576bfabcace8632eba1749ff1187239ef1f56dd74377aa1e5d0a1113de2ed18368af4b808ad245bc7da986e101caddb7b75992b14d6a866db884ea8aee5ab02786886ecf9f25e974",
		"extKey2": "cc9390e7b7bb0a360c899aa904382def1e7cbc8886fe43c89b5541fc6ad1ec9f0dff78e327f9007c718864d7ce71076ac07223a1c59c0d180a4520200917fe9c84917cf63f1579fb66fa60c661e62e293516d0ef95eb24095d366511d2335a8d",
		"extKey3": "da4c95fcb1145cea8df1c7fea89cb9148999e967a28a15fd141b2292ebd160b1577008499557436bdfd1c2c9d1cb179fa6ecce2ad01100e882a63574f784e780d28e188a68732ca24acb74e751ab5d128fa64d649b5bc987a020058204b48639",
	},
	"clusters": {
		"prefix": "",
		"mongoExt": false,
		"servers": [
			{
				"host": "127.0.0.1",
				"port": 27017
			}
		],
		"credentials": {
			"username": "",
			"password": ""
		},
		"URLParam": {
			"connectTimeoutMS": 0,
			"socketTimeoutMS": 0,
			"maxPoolSize": 5,
			"wtimeoutMS": 0,
			"slaveOk": true
		},
		"extraParam": {
			"db": {
				"native_parser": true,
				"bufferMaxEntries": 0
			},
			"server": {
			}
		},
		"streaming": {
			"batchSize": 1000
		}
	},
	"deployment": {
		"deployType": "manual",
		"deployDriver": "manual",
		"deployDockerNodes": [],
		"containerHost": "127.0.0.1",
		
		"gitOwner": null,
		"gitRepo": null,
		"gitToken": null,
		
		"imagePrefix": "soajsorg",
		"nginxPort": 30080,
		"nginxSecurePort": 30443,
		"mongoExposedPort": 32017,
		"nginxSsl": null,
		"dockerReplica": 1,
		
		"docker":{
			"networkName": "soajsnet",
			"dockerSocket": "/var/run/docker.sock",
			"containerPort": 2376,
			"dockerInternalPort": 2377
		},
		"kubernetes":{
			"containerPort": 8443
		}
	}
};
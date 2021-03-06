'use strict';
var dsbrd = {
	"_id": "5551aca9e179c39b760f7a1a",
	"locked": true,
	"type": "admin",
	"code": "DBTN",
	"name": "Dashboard Owner Tenant",
	"description": "this is the main dashboard tenant",
	"oauth": {
		"secret": "soajs beaver",
		"redirectURI": "%protocol%://domain.com",
		"grants": [
			"password",
			"refresh_token"
		]
	},
	"applications": [
		{
			"product": "DSBRD",
			"package": "DSBRD_MAIN",
			"appId": '5512926a7a1f0e2123f638de',
			"description": "This application uses the Dashboard Public Package.",
			"_TTL": 604800000,
			"keys": [
				{
					"key": "38145c67717c73d3febd16df38abf311",
					"extKeys": [
						{
							"extKey": "%extKey1%",
							"device": null,
							"geo": null,
							"env": "DASHBOARD"
						}
					],
					"config": {
						"dashboard": {
							"oauth":{
								"loginMode": "urac"
							},
                           "commonFields":{
	                           "mail": {
		                           "from": '%email%',
		                           "transport": {
			                           "type": "sendmail",
			                           "options": {}
		                           }
	                           }
                           },
                            "urac": {
                                "hashIterations": 1024,
                                "seedLength": 32,
                                "link": {
	                                "addUser": "%protocol%://%site%.%domain%:%port%/#/setNewPassword",
	                                "changeEmail": "%protocol%://%site%.%domain%:%port%/#/changeEmail/validate",
	                                "forgotPassword": "%protocol%://%site%.%domain%:%port%/#/resetPassword",
	                                "join": "%protocol%://%site%.%domain%:%port%/#/join/validate"
                                },
                                "tokenExpiryTTL": 2 * 24 * 3600 * 1000,
                                "validateJoin": true,
                                "mail": {
	                                "join": {
		                                "subject": 'Welcome to SOAJS',
		                                "path": "%wrkDir%/soajs/node_modules/soajs.urac/mail/urac/join.tmpl"
	                                },
	                                "forgotPassword": {
		                                "subject": 'Reset Your Password at SOAJS',
		                                "path": "%wrkDir%/soajs/node_modules/soajs.urac/mail/urac/forgotPassword.tmpl"
	                                },
	                                "addUser": {
		                                "subject": 'Account Created at SOAJS',
		                                "path": "%wrkDir%/soajs/node_modules/soajs.urac/mail/urac/addUser.tmpl"
	                                },
	                                "changeUserStatus": {
		                                "subject": "Account Status changed at SOAJS",
		                                //use custom HTML
                                        "path": "%wrkDir%/soajs/node_modules/soajs.urac/mail/urac/changeUserStatus.tmpl"
	                                },
	                                "changeEmail": {
		                                "subject": "Change Account Email at SOAJS",
		                                "path": "%wrkDir%/soajs/node_modules/soajs.urac/mail/urac/changeEmail.tmpl"
	                                }
                                }
                            }
						}
					}
				}
			]
		},
        {
            "product": "DSBRD",
            "package": "DSBRD_OWNER",
            "appId": '55cc56a3c3aca9179e5048e6',
            "description": "This application uses the Dashboard Owner Package.",
			"_TTL": 604800000,
            "keys": [
                {
                    "key": "9ccfb3cdaf5f61cf0cff5c78215b2292",
                    "extKeys": [
                        {
	                        "env": "DASHBOARD",
                            "extKey": "%extKey2%",
                            "device": null,
                            "geo": null,
	                        "dashboardAccess": true
                        }
                    ],
                    "config": {
                        "dashboard": {
	                        "oauth":{
		                        "loginMode": "urac"
	                        },
                            "commonFields":{
	                            "mail": {
		                            "from": '%email%',
		                            "transport": {
			                            "type": "sendmail",
			                            "options": {}
		                            }
	                            }
                            },
                            "urac": {
                                "hashIterations": 1024,
                                "seedLength": 32,
                                "link": {
                                    "addUser": "%protocol%://%site%.%domain%:%port%/#/setNewPassword",
                                    "changeEmail": "%protocol%://%site%.%domain%:%port%/#/changeEmail/validate",
                                    "forgotPassword": "%protocol%://%site%.%domain%:%port%/#/resetPassword",
                                    "join": "%protocol%://%site%.%domain%:%port%/#/join/validate"
                                },
                                "tokenExpiryTTL": 2 * 24 * 3600 * 1000,
                                "validateJoin": true,
                                "mail": {
                                    "join": {
                                        "subject": 'Welcome to SOAJS',
                                        "path": "%wrkDir%/soajs/node_modules/soajs.urac/mail/urac/join.tmpl"
                                    },
                                    "forgotPassword": {
                                        "subject": 'Reset Your Password at SOAJS',
                                        "path": "%wrkDir%/soajs/node_modules/soajs.urac/mail/urac/forgotPassword.tmpl"
                                    },
                                    "addUser": {
                                        "subject": 'Account Created at SOAJS',
                                        "path": "%wrkDir%/soajs/node_modules/soajs.urac/mail/urac/addUser.tmpl"
                                    },
                                    "changeUserStatus": {
                                        "subject": "Account Status changed at SOAJS",
                                        "path": "%wrkDir%/soajs/node_modules/soajs.urac/mail/urac/changeUserStatus.tmpl"
                                    },
                                    "changeEmail": {
                                        "subject": "Change Account Email at SOAJS",
                                        "path": "%wrkDir%/soajs/node_modules/soajs.urac/mail/urac/changeEmail.tmpl"
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        }
	]
};

module.exports = dsbrd;

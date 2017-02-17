'use strict';
var K8Api = require('kubernetes-client');
var async = require('async');

var path = require('path');
var fs = require('fs');
var Grid = require('gridfs-stream');
var exec = require('child_process').exec;
var soajs = require('soajs');
var request = require('request');

var config = require('./config.js');
var folder = config.folder;
delete require.cache[config.profile];
var profile = require(config.profile);
var mongo = new soajs.mongo(profile);

var utilLog = require('util');

var lib = {

    "loadCustomData": function (cb) {
        var dataDir = process.env.SOAJS_DATA_FOLDER;

        fs.exists(path.normalize(dataDir + "/../custom.js"), function (exists) {
            if (!exists) {
                return cb(null);
            }
            else {
                delete require.cache[require.resolve(path.normalize(dataDir + "/../custom.js"))];
                var customData = require(path.normalize(dataDir + "/../custom.js"));
                return cb(customData);
            }
        });
    },

    printProgress: function (message, counter) {
        process.stdout.clearLine();
        process.stdout.write(showTimestamp() + ' - ' + message + ' ' + showDots() + '\r');

        function showDots() {
            var output = '';
            var numOfDots = counter % 5;
            for (var i = 0; i < numOfDots; i++) { output += '.'; }
            return output;
        }

        function showTimestamp() {
            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            var now = new Date();
            return '' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getHours() + ':' +
                ((now.getMinutes().toString().length === 2) ? now.getMinutes() : '0' + now.getMinutes()) + ':' +
                ((now.getSeconds().toString().length === 2) ? now.getSeconds() : '0' + now.getSeconds());
        }
    },

    getDeployer: function (deployerConfig, cb) {
        if(!config.kubernetes.certsPath){
            return cb(new Error('No certificates found for remote machine.'));
        }
        var deployer = {};

        var certsName = {
            "ca": '/ca.pem',
            "cert": '/apiserver.pem',
            "key": '/apiserver-key.pem'
        };
        lib.loadCustomData(function(body){
            if(body.deployment.deployDriver === 'container.kubernetes.local' && process.platform === 'darwin'){
                certsName = {
                    "ca": '/ca.crt',
                    "cert": '/apiserver.crt',
                    "key": '/apiserver.key'
                };
            }

            deployerConfig.ca = fs.readFileSync(config.kubernetes.certsPath + certsName.ca);
            deployerConfig.cert = fs.readFileSync(config.kubernetes.certsPath + certsName.cert);
            deployerConfig.key = fs.readFileSync(config.kubernetes.certsPath + certsName.key);

            deployerConfig.version = 'v1beta1';
            deployer.extensions = new K8Api.Extensions(deployerConfig);

            deployerConfig.version = 'v1';
            deployer.core = new K8Api.Core(deployerConfig);
            return cb(null, deployer);
        });
    },

    getContent: function (type, group, cb) {
        var path = config.services.path.dir + group + '/';
        fs.exists(path, function (exists) {
            if (!exists) {
                utilLog.log('Folder [' + path + '] does not exist, skipping ...');
                return cb(null, true);
            }

            fs.readdir(path, function (error, content) {
                if (error) return cb(error);

                var regex = new RegExp('[a-zA-Z0-9]*\.' + config.services.path.fileType, 'g');
                var loadContent, allContent = [];
                content.forEach(function (oneContent) {
                    if (oneContent.match(regex)) {
                        try {
                            loadContent = require(path + oneContent);
                        }
                        catch (e) {
                            return cb(e);
                        }
                        allContent.push(loadContent);
                    }
                });
                return cb(null, allContent);
            });
        });
    },

    deployGroup: function (type, services, deployer, cb) {
        if (services.length === 0) {
            utilLog.log('No services of type [' + type + '] found, skipping ...');
            return cb(null, true);
        }

        if (type === 'db' && config.mongo.external) {
            utilLog.log('External Mongo deployment detected, data containers will not be deployed ...');
            return cb(null, true);
        }

        async.eachSeries(services, function (oneService, callback) {
            lib.deployService(deployer, oneService, callback);
        }, cb);
    },

    importData: function (mongoInfo, cb) {
        utilLog.log('Importing provision data to:', profile.servers[0].host + ":" + profile.servers[0].port);
        var dataImportFile = __dirname + "/../dataImport/index.js";
        var execString = process.env.NODE_PATH + " " + dataImportFile;
        // exec(execString, cb);
        exec(execString, function (error, stdout, stderr) {
            console.log (error);
            console.log (stdout);
            console.log (stderr);
            return cb();
        });
    },

    initNamespace: function (deployer, options, cb) {
        //options.namespace
        //1. check if namespace already exists. if it does, return true
        //2. if namespace does not exist create it and return true
        deployer.core.namespaces.get({}, function (error, namespacesList) {
            if (error) return cb(error);

            async.detect(namespacesList.items, function (oneNamespace, callback) {
                return callback(null, oneNamespace.metadata.name === options.namespace);
            }, function (error, foundNamespace) {
                if (foundNamespace) {
                    utilLog.log('Reusing existing namespace: ' + foundNamespace.metadata.name + ' ...');
                    return cb(null, true);
                }

                utilLog.log('Creating a new namespace: ' + options.namespace + ' ...');
                var namespace = {
                    kind: 'Namespace',
                    apiVersion: 'v1',
                    metadata: {
                        name: options.namespace,
                        labels: {
                            'soajs.content': 'true'
                        }
                    }
                };
                deployer.core.namespace.post({body: namespace}, cb);
            });
        });
    },

    importCertificates: function (cb) {
        return cb();
        lib.loadCustomData(function(customFile) {
            if(!customFile.deployment.certsRequired)
                return cb(null, true);

            else{
                utilLog.log('Importing certifictes to:', profile.servers[0].host + ":" + profile.servers[0].port);
                copyCACertificate(function(caErr){
                    if(caErr){
                        utilLog.log("Error while copying the certificate of type CA");
                        throw new Error(caErr);
                    }
                    copyCertCertificate(function(certErr){
                        if(certErr){
                            utilLog.log("Error while copying the certificate of type Cert");
                            throw new Error(certErr);
                        }
                        copyKeyCertificate(function(keyErr){
                            if(keyErr){
                                utilLog.log("Error while copying the certificate of type Key");
                                throw new Error(keyErr);
                            }

                            return cb();
                        });
                    });
                });
            }

            function getDb(soajs) {
                profile.name = "core_provision";
                mongo = new soajs.mongo(profile);
                return mongo;
            }

            function copyCACertificate(cb) {

                var fileData = {
                    filename: "CA Certificate",
                    metadata: {
                        platform: 'kubernetes',
                        certType: 'ca',
                        env: {
                            'DASHBOARD':[customFile.deployment.deployDriver.split('.')[1] + "." + customFile.deployment.deployDriver.split('.')[2]]
                        }
                    }
                };

                getDb(soajs).getMongoDB(function (error, db) {
                    if(error) {
                        throw new Error(error);
                    }
                    var gfs = Grid(db, getDb(soajs).mongodb);
                    var writeStream = gfs.createWriteStream(fileData);
                    var readStream = fs.createReadStream(customFile.deployment.certificates.caCertificate);
                    readStream.pipe(writeStream);

                    writeStream.on('error', function (error) {
                        return cb(error);
                    });
                    writeStream.on('close', function (file) {
                        return cb(null, true);
                    });
                });
            }

            function copyCertCertificate(cb) {

                var fileData = {
                    filename: "Cert Certificate",
                    metadata: {
                        platform: 'kubernetes',
                        certType: 'cert',
                        env: {
                            'DASHBOARD':[customFile.deployment.deployDriver.split('.')[1] + "." + customFile.deployment.deployDriver.split('.')[2]]
                        }
                    }
                };

                getDb(soajs).getMongoDB(function (error, db) {
                    if(error) {
                        throw new Error(error);
                    }
                    var gfs = Grid(db, getDb(soajs).mongodb);
                    var writeStream = gfs.createWriteStream(fileData);
                    var readStream = fs.createReadStream(customFile.deployment.certificates.certCertificate);
                    readStream.pipe(writeStream);
                    writeStream.on('error', function (error) {
                        return cb(error);
                    });
                    writeStream.on('close', function (file) {
                        return cb(null, true);
                    });
                });
            }

            function copyKeyCertificate(cb) {

                var fileData = {
                    filename: "Key Certificate",
                    metadata: {
                        platform: 'kubernetes',
                        certType: 'key',
                        env: {
                            'DASHBOARD':[customFile.deployment.deployDriver.split('.')[1] + "." + customFile.deployment.deployDriver.split('.')[2]]
                        }
                    }
                };

                getDb(soajs).getMongoDB(function (error, db) {
                    if(error) {
                        throw new Error(error);
                    }
                    var gfs = Grid(db, getDb(soajs).mongodb);
                    var writeStream = gfs.createWriteStream(fileData);
                    var readStream = fs.createReadStream(customFile.deployment.certificates.keyCertificate);
                    readStream.pipe(writeStream);
                    writeStream.on('error', function (error) {
                        return cb(error);
                    });
                    writeStream.on('close', function (file) {
                        return cb(null, true);
                    });
                });
            }

        });
    },

    deployService: function (deployer, options, cb) {
        var namespace = config.kubernetes.config.namespaces.default, serviceName;
        if (config.kubernetes.config.namespaces.perService) {
            serviceName = options.service.metadata.labels['soajs.service.label'];
            namespace += '-' + serviceName;
        }

        lib.initNamespace(deployer, {namespace: namespace}, function (error) {
            if (error) return cb(error);

            if (options.service) {
                deployer.core.namespaces(namespace).services.post({body: options.service}, function (error) {
                    if (error) return cb(error);
                    createDeployment(cb);
                });
            }
            else {
                createDeployment(cb);
            }
        });

        function createDeployment(cb1) {
            deployer.extensions.namespaces(namespace).deployments.post({body: options.deployment}, cb1);
        }
    },

    deleteDeployments: function (deployer, options, cb) {
        var filter = { labelSelector: 'soajs.content=true' };
        deployer.extensions.deployments.get({qs: filter}, function (error, deploymentList) {
            if (error) return cb(error);

            if (!deploymentList || !deploymentList.items || deploymentList.items.length === 0) return cb();
            filter.gracePeriodSeconds = 0;
            async.each(deploymentList.items, function (oneDeployment, callback) {
                deployer.extensions.namespaces(oneDeployment.metadata.namespace).deployments.delete({qs: filter}, callback);
            }, cb);
        });
    },

    deleteKubeServices: function (deployer, options, cb) {
        var filter = { labelSelector: 'soajs.content=true', gracePeriodSeconds: 0  };
        deployer.core.services.get({qs: filter}, function (error, serviceList) {
            if (error) return cb(error);

            if (!serviceList || !serviceList.items || serviceList.items.length === 0) return cb();
            async.each(serviceList.items, function (oneService, callback) {
                deployer.core.namespaces(oneService.metadata.namespace).services.delete({ name: oneService.metadata.name }, callback);
            }, cb);
        });
    },

    deletePods: function (deployer, options, cb) {
        //force delete all pods for a better cleanup
        var filter = { labelSelector: 'soajs.content=true' };
        deployer.core.pods.get({ qs: filter }, function (error, podList) {
            if (error) return cb(error);

            if (!podList || !podList.items || podList.items.length === 0) return cb();
            filter.gracePeriodSeconds = 0;
            async.each(podList.items, function (onePod, callback) {
                deployer.core.namespaces(onePod.metadata.namespace).delete({ qs: filter }, callback);
            }, cb);
        });
    },

    deleteNamespaces: function (deployer, options, cb) {
        var filter = { labelSelector: 'soajs.content=true' };
        deployer.core.namespaces.delete({ qs: filter }, cb);
    },

    deletePreviousServices: function (deployer, cb) {
        lib.deleteDeployments(deployer, {}, function (error) {
            if (error) return cb(error);

            lib.deleteKubeServices(deployer, {}, function (error) {
                if (error) return cb(error);

                lib.deletePods(deployer, {}, function (error) {
                    if (error) return cb(error);

                    lib.deleteNamespaces(deployer, {}, cb);
                });
            });
        });
    },

    getServiceIPs: function (serviceName, deployer, replicaCount, counter, cb) {
        if (typeof (counter) === 'function') {
            cb = counter; //counter wasn't passed as param
            counter = 0;
        }

        var namespace = config.kubernetes.config.namespaces.default;
        if (config.kubernetes.config.namespaces.perService) {
            namespace += '-' + serviceName;
        }

        //if serviceName is provided with namespace, remove namespace and filter only by service name
        //splitting based on dots is ok since it's a reseverd char in kubernetes, no service name can include a dot
        if (serviceName.indexOf('.') !== -1) {
            serviceName = serviceName.split('.')[0];
        }

        var filter = { labelSelector: 'soajs.service.label=' + serviceName };
        deployer.core.pods.get({ qs: filter }, function (error, podList) {
            if (error) return cb(error);
            var onePod, ips = [];
            if (podList && podList.items && Array.isArray(podList.items)) {
                podList.items.forEach(function (onePod) {
                    if (onePod.status.phase === 'Running' && onePod.metadata.namespace === namespace) {
                        ips.push({
                            name: onePod.metadata.name,
                            ip: onePod.status.podIP
                        });
                    }
                });
            }

            if (ips.length !== replicaCount) {
                //pod containers may not be ready yet
                lib.printProgress('Waiting for ' + serviceName + ' containers to become available', counter++);
                setTimeout(function () {
                    return lib.getServiceIPs(serviceName, deployer, replicaCount, counter, cb);
                }, 1000);
            }
            else {
                utilLog.log(""); //intentional, to force writting a new line.
                return cb(null, ips);
            }
        });
    },

    addMongoInfo: function (services, mongoInfo, cb) {
        var mongoEnv = [];

        if(config.mongo.prefix && config.mongo.prefix !== ""){
            mongoEnv.push({name: 'SOAJS_MONGO_PREFIX', value: config.mongo.prefix});
        }

        if (config.mongo.external) {
            // if (!config.dataLayer.mongo.url || !config.dataLayer.mongo.port) {
            if (!profile.servers[0].host || !profile.servers[0].port) {
                utilLog.log('ERROR: External Mongo information is missing URL or port, make sure SOAJS_MONGO_EXTERNAL_URL and SOAJS_MONGO_EXTERNAL_PORT are set ...');
                return cb('ERROR: missing mongo information');
            }

            mongoEnv.push({ name: 'SOAJS_MONGO_NB', value: '' + profile.servers.length });
            for(var i = 0; i < profile.servers.length; i++){
                mongoEnv.push({name: 'SOAJS_MONGO_IP_' + (i + 1), value: profile.servers[i].host});
                mongoEnv.push({name: 'SOAJS_MONGO_PORT_' + (i + 1), value: '' + profile.servers[i].port});
            }

            if (profile.credentials && profile.credentials.username && profile.credentials.password) {
                mongoEnv.push({ name: 'SOAJS_MONGO_USERNAME', value: profile.credentials.username });
                mongoEnv.push({ name: 'SOAJS_MONGO_PASSWORD', value: profile.credentials.password });
                mongoEnv.push({ name: 'SOAJS_MONGO_AUTH_DB', value: profile.URLParam.authSource });
            }

            if(profile.URLParam.ssl){
                mongoEnv.push({ name: 'SOAJS_MONGO_SSL', value: profile.URLParam.ssl });
            }
        }
        else {
            mongoEnv.push({ name: 'SOAJS_MONGO_NB', value: '1' });
            mongoEnv.push({ name: 'SOAJS_MONGO_IP_1', value: profile.servers[0].host});
            mongoEnv.push({ name: 'SOAJS_MONGO_PORT_1', value: '27017'});
        }

        services.forEach(function (oneService) {
            oneService.deployment.spec.template.spec.containers[0].env = oneService.deployment.spec.template.spec.containers[0].env.concat(mongoEnv);
        });

        return cb(null, services);
    },


    closeDbCon: function (cb) {
        mongo.closeDb();
        return cb();
    }
};

module.exports = lib;

'use strict';
const fs = require('fs');
const os = require('os');
const cp = require('child_process');

class ServerlessWhitesourcePlugin {  
  
  constructor(serverless, options) {
	const packageDetails = require('./package.json');
	console.log('serverless-whitesource plugin version: ', packageDetails.version);
    this.serverless = serverless;
	//adding a hook to the post-deploy event
    this.hooks = {	
	  'after:deploy:deploy': this.afterDeploy.bind(this)
    };
  }
  
  afterDeploy() {
    var doubleDot = '..';
	// detecting if this is win os, so the separator has to be switched
    var separator = '/';
    if (os.platform().startsWith('win')){
		separator = '\\';
	}
	// builing path to the function-names txt file
	var functionNamesFile = __dirname + separator + 'functionNames.txt'; 	
	var stringToAppend = '\r\nserverless.includes=' + functionNamesFile;
	var names = '';
	// extracting name of each deployed function
	this.serverless.service.getAllFunctions().forEach((functionName) => {		
		const functionObj = this.serverless.service.getFunction(functionName);
		names+=functionObj.name+'\r\n';
	});
	// reading the path to the config file from the parameter in the serverless.yml file	
	const pathToConfig = this.serverless.service.custom.whitesource.pathToConfig;
	const whitesourceParams = this.serverless.service.custom.whitesource;
	const runUaFunc = this.runUA;
	// writing the function-names txt file
	fs.writeFile(functionNamesFile, names, function(err) {
		if(err) {
			console.log('could not write functions-name\'s file: ' + err);
			return err;
		}
		console.log("The names file was saved");
		fs.readFile(pathToConfig, "utf8", (err, data) => {
			if (err) {
				console.log('could not read ' + pathToConfig + ': ' + err);				
				return err;
			}
			if (!data.endsWith(stringToAppend)){
				// appending the 'serverless.includes` property (with the path to the function-names txt file) to the config file
				fs.appendFile(pathToConfig, stringToAppend, function(err){
					if (err) {
						console.log('could not write ' + pathToConfig + ': ' + err);				
						return err;
					}
					console.log(pathToConfig + ' file updated');
					console.log("about to call 'runUaFunc'");
					runUaFunc(whitesourceParams);
				});
			} else { // no need to append again if the file was already appended previously
				console.log(pathToConfig + ' already contains path to function-names\' file; no need to update');
				console.log("about to call 'runUaFunc'");
				runUaFunc(whitesourceParams);
			}
		});		
	});
  }
  
  runUA(whitesourceParams) {
	console.log('runUA ' + process.platform);  
	console.log('pathToJar = ' + whitesourceParams.pathToJar);
	console.log('pathToConfig = ' + whitesourceParams.pathToConfig);
	const { spawn } = require('child_process');
	const params = [];
	// building different parameters list depending on the OS
	if (process.platform === 'win32'){
		params.push('/c', 'java', '-jar', whitesourceParams.pathToJar, '-c', whitesourceParams.pathToConfig);
	} else if (process.platform === 'linux' || process.platform === 'darwin') {
		params.push('-jar', whitesourceParams.pathToJar, '-c', whitesourceParams.pathToConfig);
	}
	if (params.length > 0) {
		// reading custom parameters from the serverless.yml 
		for (var param in whitesourceParams) {
			if (param.startsWith('wss-')){			
				params.push(param.substring(3), whitesourceParams[param]);
			}
		}	
		const bat = spawn(process.platform === 'win32' ? 'cmd.exe' : 'java' , params);

		bat.stdout.on('data', (data) => {
		  console.log(data.toString());
		});

		bat.stderr.on('data', (data) => {
		  console.error(data.toString());
		});

		bat.on('exit', (code) => {
		  console.log(`Child exited with code ${code}`);
		});
	} else {
		console.log('OS ' + process.platform + ' is not supported');
	}
  }
}

module.exports = ServerlessWhitesourcePlugin;

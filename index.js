'use strict';
const fs = require('fs');
const cp = require('child_process');
const path = require('path')

/*
  this plugin is ran as part of the serverlss deploy process.  it detects the serverless functions that were deployed and have the UA scan them.
  it does so by detecting the deployed functions, writing them into a txt file, adding the path of that file to the UA's config file, and running the UA.
  before doing so, it detects which serverless package is installed, because not all serverless versions support the command (spawn) which runs the UA
*/
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
	// checking if the serverless package being used is 1.49.0 and above, for otherwise the plugin won't be able to run the UA  
	var self = this;
	var callsites = require('callsites');
	var callerPath = callsites()[1].getFileName(); // the path to the js file which called the serverless-plugin
	var serverlessPath;
	// checking if the used serverless plugin is local (npm i serverless) or global (npm i -g serverless)
	var local = callerPath.includes(process.cwd());
	if (local) {
		serverlessPath = 'node_modules' + path.sep + 'serverless'; 
	} else {
		// finding the path to the global serverless package
		var resolveGlobal = require('resolve-global');
		var serverlessPath = resolveGlobal('serverless');	
		serverlessPath = serverlessPath.substr(0, serverlessPath.lastIndexOf(path.sep)-1);
		serverlessPath = serverlessPath.substr(0, serverlessPath.lastIndexOf(path.sep));
	}
	fs.readFile(serverlessPath + path.sep + 'package.json', 'utf8', function(error, data) {
      if (error) {
        console.error(error);
		console.log('could not detect serverless version; exiting');
      } else {
        var pkg = JSON.parse(data);
        var version = pkg['version'];        
		var versionArr = version.split('.');
	    if (versionArr[0] > 1 || (versionArr[0] == 1 && versionArr[1] >= 49)) {
		  self.updateConfigFile();
	    } else {
		  console.log('The Whitesource serverless plugin requires serverless version 1.49.0 and above, however, it has detected that the installed version is ' + version + '.\r\nPlease run \'npm install' + (local ? '' : ' -g') + ' serverless\' to update the serverless version and run the Unfied-Agent scan.');
	   }
      }
    });
  }
  
  updateConfigFile(){
    var doubleDot = '..';
	// builing path to the function-names txt file
	var functionNamesFile = __dirname + path.sep + 'functionNames.txt'; 	
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
					runUaFunc(whitesourceParams);
				});
			} else { // no need to append again if the file was already appended previously
				console.log(pathToConfig + ' already contains path to function-names\' file; no need to update');				
				runUaFunc(whitesourceParams);
			}
		});		
	});
  }
  
  runUA(whitesourceParams) {
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
		const bat = cp.spawn(process.platform === 'win32' ? 'cmd.exe' : 'java' , params);
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

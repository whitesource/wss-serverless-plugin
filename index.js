'use strict';
const fs = require('fs');
const os = require('os');


class ServerlessWhitesourcePlugin {  
  
  constructor(serverless, options) {
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
				});
			} else { // no need to append again if the file was already appended previously
				console.log(pathToConfig + ' already contains path to function-names\' file; no need to update');
			}
		});		
	});
  }
}

module.exports = ServerlessWhitesourcePlugin;

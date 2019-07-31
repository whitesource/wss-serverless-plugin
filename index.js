'use strict';
const fs = require('fs');

class ServerlessWhitesourcePlugin {  
  
  constructor(serverless, options) {
	console.log('ServerlessWhitesourcePlugin constructor');  
    this.serverless = serverless;	
    this.hooks = {	
	  'after:deploy:deploy': this.afterDeploy.bind(this)
    };
  }
  
  afterDeploy() {  
	var stringToAppend = '\r\nserverless.includes=functionNames.txt';
	var names = '';
	this.serverless.service.getAllFunctions().forEach((functionName) => {		
		const functionObj = this.serverless.service.getFunction(functionName);
		names+=functionObj.name+'\r\n';
	});
	const pathToConfig = this.serverless.service.custom.whitesource.pathToConfig;
	fs.writeFile("functionNames.txt", names, function(err) {
		if(err) {
			console.log('could not write functions-name\'s file: ' + err);
			return err;
		}
		console.log("The names file was saved!");
		fs.readFile(pathToConfig, "utf8", (err, data) => {
			if (err) {
				console.log('could not read ' + pathToConfig + ': ' + err);				
				return err;
			}
			if (!data.endsWith(stringToAppend)){
				fs.appendFile(pathToConfig, stringToAppend, function(err){
					if (err) {
						console.log('could not write ' + pathToConfig + ': ' + err);				
						return err;
					}
					console.log(pathToConfig + ' file updated');
				});
			} else {
				console.log(pathToConfig + ' already contains path to function-names\' file; no need to update');
			}
		});		
	});
  }  
}

module.exports = ServerlessWhitesourcePlugin;

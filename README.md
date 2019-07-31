serverless-whitesource
=======



[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)


[![WhiteSource](https://www.whitesourcesoftware.com/wp-content/uploads/2016/06/whitesource_logo_rgb-02.png)](https://www.whitesourcesoftware.com)



# Description

Perform a WhiteSource scan for Serverless functions. 

# Requirements

- [Serverless Framework](https://github.com/serverless/serverless) 1.0 or higher
- [WhiteSource Unified Agent] (https://whitesource.atlassian.net/wiki/spaces/WD/pages/33718339/Unified+Agent) 19.7.2 or higher

# Installation

```
npm install serverless-whitesource
```
```
sudo npm install -g serverless #this step is required only in the first run
```

# Configuration

### serverless.yml

```yaml

plugins:
  - serverless-whitesource

custom:
  whitesource:
    pathToConfig: ${path-to-configuration-file}
```

# Usage

### 1. Download the UA jar
```
curl -LJO https://wss-qa.s3.amazonaws.com/unified-agent/integration/wss-unified-agent
```

### 2. Install WhiteSource plugin
```
npm install serverless-whitesource
```

### 3. Run the Unified Agent
```
java -jar wss-unified-agent.jar -c {path-to-configuration-file} -apiKey {your-api-key} -logLevel debug
```

Authors
-------

Created and maintained by [WhiteSource Software](https://www.whitesourcesoftware.com) (<product@whitesourcesoftware.com>)

License
-------

Apache 2.0 License (see [LICENSE](https://www.apache.org/licenses/LICENSE-2.0.txt))
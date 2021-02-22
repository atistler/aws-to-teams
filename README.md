# AWS-to-Teams




Forward AWS CloudWatch Alarms and other notifications from Amazon SNS to Microsoft Teams.

<table>
   <tr>
      <th>CloudWatch Example</th>
      <th>EB Event Example</th>
   </tr>
   <tr>
      <td width="50%"><img alt="CloudWatch Alarm Example" src="./docs/alert-example-cw.png"></td>
      <td><img alt="Elastic Beanstalk Example" src="./docs/alert-example-eb.png"></td>
   </tr>
</table>

## What is it?
_AWS-to-Teams_ is a Lambda function written in Node.js that forwards alarms and
notifications to a dedicated Teams channel. It is self-hosted
in your own AWS environment and doesn't have any 3rd party dependencies other
than the Google Charts API for rendering CloudWatch metrics.

Supported AWS product notification formats:
* Auto-Scaling Events
* Batch Events
* CloudFormation
* CloudWatch Alarms *(incl. Metrics!)*
* CodeBuild
* CodeCommit
* CodeDeploy 🆕 _(via SNS/CloudWatch)_
* CodePipeline 🆕 _(via SNS/CloudWatch)_
* CodePipeline Manual Approval 🆕
* Elastic Beanstalk
* GuardDuty 🆕
* Health Dashboard
* Inspector
* RDS
* SES Received Notifications
* Generic SNS messages
* Plain text messages

Additional formats will be added. Pull Requests are welcome!

## Try!
Ready to try the latest version for yourself? Installation into your own AWS environment is simple:

### Option 1: Quick Start (OLD CODE)

[![Launch CloudFormation Stack](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=aws-to-teams)

*Warning!* The template referenced by this link is an old template and old code! If you want the latest version of this repo, you need to update the Lambda code after it's launched.
      
### Option 2: Get the latest bug fixes

1. Download this repo locally.

1. Use AWS Console's [Create CloudFormation Stack](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=aws-to-teams) tool.

   Upload [cloudformation.yaml](https://raw.githubusercontent.com/arabold/aws-to-teams/master/cloudformation.yaml) as your template.

1. Finish launching the Stack.

   For details on the parameter values, see [Installation](#installation) section. 

1. Build / Update the code by running the following from the root of this project:
   ```
   AWS_REGION="<your_lambda_region>" LAMBDA_NAME="<your_lambda_name>" make deploy
   ```  

   If you use AWS CLI profiles, simply add `AWS_PROFILE` to the make command like so:
   ```
   AWS_PROFILE="my-profile" AWS_REGION="<your_lambda_region>" LAMBDA_NAME="<your_lambda_name>" make deploy
   ```

### Option 3: Use deploy target

See [Managing Multiple Deployments](#managing-multiple-deployments) for a `.env` file approach to creating or managing multiple stacks.

## Installation

### Step 1: Setup Microsoft Teams
The Lambda function communicates with Teams through a Teams webhook


### Step 2: Configure & Launch the CloudFormation Stack

Note that the AWS region will be the region from which you launch the CloudFormation wizard, which will also scope the resources (SNS, etc.) to that region. 

Launch the CloudFormation Stack by using our preconfigured CloudFormation
[template](https://raw.githubusercontent.com/atistler/aws-to-teams/master/cloudformation.yaml) and following the [steps above](#try).

**Afterwards**

Click "Next" and on the following page name your new stack and paste the
webhook URL from before into the "HookUrl" field. You can also configure a
different channel to post to if wanted.

![AWS CloudFormation Configuration](./docs/config-stack.png)

Click "Next" again, complete the stack setup on the following pages and
finally launch your stack.

### Step 3: Subscribe to Triggers

Before the Lambda function will actually do anything you need to subscribe it
to actual CloudWatch alarms and other SNS triggers. Open up the AWS Lambda,
switch to the "Triggers" tab and subscribe for all events you're interested in.

![Lambda Triggers](./docs/config-lambda-triggers.png)


### Setting Up AWS CodeBuild
CodeBuild integration was suggested by [ericcj](https://github.com/ericcj) and is based on
the Medium post [Monitor your AWS CodeBuilds via Lambda and Teams](https://hackernoon.com/monitor-your-aws-codebuilds-via-lambda-and-slack-ae2c621f68f1) by
Randy Findley. 

To enable CodeBuild notifications add a new _CloudWatch Event Rule_, choose _CodeBuild_
as source and _CodeBuild Build State Change_ as type. As Target select the `aws-to-teams`
Lambda. You can leave all other settings as is. Once your rule is created all CodeBuild
build state events will be forwarded to your Teams channel.

### Setting Up AWS CodeCommit

Similar to the CodeBuild integration, CodeCommit notifications are triggered by
CloudWatch Event Rules. Create a new CloudWatch Event Rule, select _CodeCommit_
as the source, and select one of the supported event types:

* _CodeCommit Pull Request State Change_ - Will generate events when a pull
  request is opened, closed, merged, or updated.
* _CodeCommit Repository State Change_ - Will generate events when a branch
  or tag reference is created, updated, or deleted.

Add the `aws-to-teams` lambda as the target. No other settings are needed.

## Managing Multiple Deployments

You can save local `.env` files that contain your stack configurations for easier deployment and updates.  Copy `targets/example.env` to a separate file and customize the parameters.  Then deploy the file like this:

```bash
TARGET=targets/my-deploy.env make deploy
```

If you want to force-compile this project and push your code to a stack, use this:
```bash
TARGET=targets/my-deploy.env make package deploy
```

If you need to update your CloudFormation parameters, try this:
```bash
TARGET=targets/my-deploy.env make update-stack
```

## Contributing

You want to contribute? That's awesome! 🎉

Check out our [issues page](https://github.com/arabold/aws-to-teams/issues) for
some ideas how to contribute and a list of open tasks. There're plenty of
notification formats that still need to be supported.

The repository comes with a very simple `Makefile` to build the CloudFormation
stack yourself. 

```bash
make package
```

This generates a new `release.zip` in the root folder. Upload this zip to your
AWS Lambda function and you're good to go. Make sure to check out [Managing Multiple Deployments](#managing-multiple-deployments) for a more scalable solution to deploys.

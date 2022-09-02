import * as cdk from 'aws-cdk-lib';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

interface WebProps extends cdk.StackProps {
    userPoolId?: string;
    userPoolClientId?: string;
  }
  
export class StaticWebStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: WebProps) {
        super(scope, id, props);

        if (!props || !props.userPoolId || !props.userPoolClientId) {
            console.warn('Not using Amplify because no user pool id or client id was provided');
        }
        const userPoolId = props?.userPoolId;
        const userPoolClientId = props?.userPoolClientId;

        const githubSecret = new secretsmanager.Secret(this, 'githubSecret')
        const githubOwner = 'egochao';
        const githubRepo = 'simple_gatsby_blog';
        const githubProdBranch = 'master';
        const githubDevBranch = 'devevelop';
        
        const githubToken = secretsmanager.Secret.fromSecretNameV2(
            this, 'githubToken', githubSecret.secretName).secretValue;
        
        
        const amplifyApp = new amplify.App(this, 'StaticWebApp', {
            sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
                owner: githubOwner,
                repository: githubRepo,
                oauthToken: githubToken,
            }),
        });
        
        const prodBranch = amplifyApp.addBranch(githubProdBranch);
        const developBranch = amplifyApp.addBranch(githubDevBranch);

        new cdk.CfnOutput(this, 'githubTokenSecretArn', {
            value: githubSecret.secretArn,
        });
        new cdk.CfnOutput(this, 'SiteUrl', {
            value: amplifyApp.defaultDomain,
        });
    }
}

import * as cdk from 'aws-cdk-lib';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

  
export class StaticWebStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
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

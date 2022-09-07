import * as cdk from 'aws-cdk-lib';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

interface WebProps extends cdk.StackProps {
    userPoolId: string;
    userPoolClientId: string;
    identityPoolId: string;
    cognitoRegion: string;
}
  
export class StaticWebStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: WebProps) {
        super(scope, id, props);

        const githubSecret = new secretsmanager.Secret(this, 'githubSecret')
        const githubOwner = 'egochao';
        const githubRepo = 'simple_gatsby_blog';
        const githubProdBranch = 'master';
        const githubDevBranch = 'develop';
        
        const githubToken = secretsmanager.Secret.fromSecretNameV2(
            this, 'githubToken', githubSecret.secretName).secretValue;
        
        if (!(props?.userPoolId && 
            props?.userPoolClientId && 
            props?.identityPoolId && 
            props?.cognitoRegion)) {
            console.warn("Missing some Cognito parameters, input is: ", props);
        } else {
            console.log("Cognito parameters are: ", props);
        }

    
        const amplifyApp = new amplify.App(this, 'StaticWebApp', {
            sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
                owner: githubOwner,
                repository: githubRepo,
                oauthToken: githubToken,
            }),
            environmentVariables: {
                'GATSBY_USER_POOL_ID': props?.userPoolId || "none",
                'GATSBY_USER_POOL_CLIENT_ID': props?.userPoolClientId || "none",
                'GATSBY_IDENTITY_POOL_ID': props?.identityPoolId || "none",
                'GATSBY_COGNITO_REGION': props?.cognitoRegion || "none",
            },
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

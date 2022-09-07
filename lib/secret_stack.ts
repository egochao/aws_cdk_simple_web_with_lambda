import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { GithubCredentials } from './config';

export class SecretStack extends cdk.Stack {
    // Note this stack only create place holder for github token
    // The actual token is created in the console
    // You can use the following command to set the token
    // aws  secretsmanager put-secret-value --secret-id secret_arn --secret-string github_token

    public readonly githubCred: GithubCredentials;

    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const githubSecret = new secretsmanager.Secret(this, 'githubSecret')
        const githubToken = secretsmanager.Secret.fromSecretNameV2(
            this, 'githubToken', githubSecret.secretName).secretValue;

        this.githubCred = {
            githubOwner: 'egochao',
            githubRepo: 'simple_gatsby_blog',
            githubProdBranch: 'master',
            githubDevBranch: 'develop',
            githubToken: githubToken,
        }
        new cdk.CfnOutput(this, 'GithubTokenArn', {
            value: githubSecret.secretArn,
        });


    }
}
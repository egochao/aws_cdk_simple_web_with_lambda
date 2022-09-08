import * as cdk from 'aws-cdk-lib';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { GithubCredentials, CognitoAuthConfig } from './config';

interface WebProps extends cdk.StackProps {
    githubCred: GithubCredentials;
    cognitoAuthEndpoints: CognitoAuthConfig;
}
  
export class StaticWebStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props: WebProps) {
        super(scope, id, props);
    
        const amplifyApp = new amplify.App(this, 'StaticWebApp', {
            sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
                owner: props.githubCred.githubOwner,
                repository: props.githubCred.githubRepo,
                oauthToken: props.githubCred.githubToken,
            }),
            environmentVariables: {
                'GATSBY_USER_POOL_ID': props.cognitoAuthEndpoints.userPoolId,
                'GATSBY_USER_POOL_CLIENT_ID': props.cognitoAuthEndpoints.userPoolClientId,
                'GATSBY_IDENTITY_POOL_ID': props.cognitoAuthEndpoints.identityPoolId,
                'GATSBY_COGNITO_REGION': props.cognitoAuthEndpoints.region,
            },
            autoBranchCreation: { // Automatically connect branches that match a pattern set
                patterns: ['feature/*', 'test/*'],
            },
            autoBranchDeletion: true, // Automatically disconnect a branch when you delete a branch from your repository            
            buildSpec: this.gatsbyBuildSpec,
        });
        
        this.configSite(amplifyApp, props); // sub domain prefix defaults to branch name

        new cdk.CfnOutput(this, 'SiteUrl', {
            value: amplifyApp.defaultDomain,
        });
    }

    private configSite(amplifyApp: amplify.App, props: WebProps) {
        amplifyApp.addCustomRule(amplify.CustomRule.SINGLE_PAGE_APPLICATION_REDIRECT);

        const prodBranch = amplifyApp.addBranch(props.githubCred.githubProdBranch);
        const developBranch = amplifyApp.addBranch(props.githubCred.githubDevBranch);

        const domain = amplifyApp.addDomain('ctablog.net', {
            enableAutoSubdomain: true,
            autoSubdomainCreationPatterns: ['*', 'pr*'], // regex for branches that should auto register subdomains
        });
        domain.mapRoot(prodBranch); // map prodBranch branch to domain root
        domain.mapSubDomain(prodBranch, 'www');
        domain.mapSubDomain(developBranch);
    }

    private readonly gatsbyBuildSpec = codebuild.BuildSpec.fromObjectToYaml({
        // Alternatively add a `amplify.yml` to the repo
        version: '1.0',
        frontend: {
            phases: {
                preBuild: {
                    commands: [
                        'npm install',
                    ],
                },
                build: {
                    commands: [
                        'echo GATSBY_USER_POOL_ID=$GATSBY_USER_POOL_ID >> .env',
                        'echo GATSBY_USER_POOL_CLIENT_ID=$GATSBY_USER_POOL_CLIENT_ID >> .env',
                        'echo GATSBY_IDENTITY_POOL_ID=$GATSBY_IDENTITY_POOL_ID >> .env',
                        'echo GATSBY_COGNITO_REGION=$GATSBY_COGNITO_REGION >> .env',
                        'npm run build',
                    ],
                },
            },
            artifacts: {
                baseDirectory: 'public',
                files: [
                    '**/*'
                ],
            },
            cache: {
                paths: ['node_modules/**/*'],
            },
        },
    });

}

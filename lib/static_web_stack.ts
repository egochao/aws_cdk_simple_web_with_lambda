import * as cdk from 'aws-cdk-lib';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { GithubCredentials } from './config';

interface WebProps extends cdk.StackProps {
    githubCred: GithubCredentials;
    userPoolId: string;
    userPoolClientId: string;
    identityPoolId: string;
    cognitoRegion: string;
}
  
export class StaticWebStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props: WebProps) {
        super(scope, id, props);

        const githubToken = props.githubCred.githubToken;
        const githubOwner = props.githubCred.githubOwner;
        const githubRepo = props.githubCred.githubRepo;
        const githubProdBranch = props.githubCred.githubProdBranch;
        const githubDevBranch = props.githubCred.githubDevBranch;

    
        const amplifyApp = new amplify.App(this, 'StaticWebApp', {
            sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
                owner: githubOwner,
                repository: githubRepo,
                oauthToken: githubToken,
            }),
            environmentVariables: {
                'GATSBY_USER_POOL_ID': props.userPoolId || "none",
                'GATSBY_USER_POOL_CLIENT_ID': props.userPoolClientId || "none",
                'GATSBY_IDENTITY_POOL_ID': props.identityPoolId || "none",
                'GATSBY_COGNITO_REGION': props.cognitoRegion || "none",
            },
            autoBranchCreation: { // Automatically connect branches that match a pattern set
                patterns: ['feature/*', 'test/*'],
            },
            autoBranchDeletion: true, // Automatically disconnect a branch when you delete a branch from your repository            
            buildSpec: this.gatsbyBuildSpec,
        });
        
        amplifyApp.addCustomRule(amplify.CustomRule.SINGLE_PAGE_APPLICATION_REDIRECT);

        const prodBranch = amplifyApp.addBranch(githubProdBranch);
        const developBranch = amplifyApp.addBranch(githubDevBranch);

        const domain = amplifyApp.addDomain('ctablog.net', {
            enableAutoSubdomain: true, // in case subdomains should be auto registered for branches
            autoSubdomainCreationPatterns: ['*', 'pr*'], // regex for branches that should auto register subdomains
          });
        domain.mapRoot(prodBranch); // map prodBranch branch to domain root
        domain.mapSubDomain(prodBranch, 'www');
        domain.mapSubDomain(developBranch); // sub domain prefix defaults to branch name

        new cdk.CfnOutput(this, 'SiteUrl', {
            value: amplifyApp.defaultDomain,
        });
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

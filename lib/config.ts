import { SecretValue } from "aws-cdk-lib";

export interface GithubCredentials {
    githubOwner: string;
    githubRepo: string;
    githubProdBranch: string;
    githubDevBranch: string;
    githubToken: SecretValue;
}

export interface CognitoAuthConfig {
    userPoolId: string;
    userPoolClientId: string;
    identityPoolId: string;
    region: string;
}

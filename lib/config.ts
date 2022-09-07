import { SecretValue } from "aws-cdk-lib";

export interface GithubCredentials {
    githubOwner: string;
    githubRepo: string;
    githubProdBranch: string;
    githubDevBranch: string;
    githubToken: SecretValue;
}

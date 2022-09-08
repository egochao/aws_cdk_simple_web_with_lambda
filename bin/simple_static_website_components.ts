#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { CognitoStack } from '../lib/cognito_stack';
import { StaticWebStack } from '../lib/static_web_stack';
import { SecretStack } from '../lib/secret_stack';


const app = new cdk.App();

const secretSt = new SecretStack(app, 'SecretStack');

const authSt = new CognitoStack(app, 'CognitoStack');

const websiteSt = new StaticWebStack(app, 'StaticWebStack', {
        githubCred: secretSt.githubCred,
        cognitoAuthEndpoints: authSt.cognitoAuthEndpoints,
    }
);

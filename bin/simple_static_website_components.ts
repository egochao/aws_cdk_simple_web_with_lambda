#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { CognitoStack } from '../lib/cognito_stack';
import { StaticWebStack } from '../lib/static_web_stack';

const app = new cdk.App();

const authStack = new CognitoStack(app, 'CognitoStack');

const website = new StaticWebStack(app, 'StaticWebStack');

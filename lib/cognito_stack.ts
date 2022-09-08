import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CognitoAuthConfig } from './config';

export class CognitoStack extends cdk.Stack {
    public readonly cognitoAuthEndpoints: CognitoAuthConfig;

    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: 'static-web-app-user-pool',
            selfSignUpEnabled: true,
            signInAliases: {
                username: true,
                email: true
            },
            autoVerify: {
                email: true
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
            userPool,
            userPoolClientName: 'static-web-app-user-pool-client',
            generateSecret: false
        });


        const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
            identityPoolName: 'static-web-app-identity-pool',
            allowUnauthenticatedIdentities: true,
            cognitoIdentityProviders: [
                {
                    clientId: userPoolClient.userPoolClientId,
                    providerName: userPool.userPoolProviderName,
                },
            ],
        });
      
        
        this.setRole(identityPool, userPool, userPoolClient);
              
        this.cognitoAuthEndpoints = {
            userPoolId: userPool.userPoolId,
            userPoolClientId: userPoolClient.userPoolClientId,
            identityPoolId: identityPool.ref,
            region: process.env.CDK_DEFAULT_REGION || "us-east-1",
        }
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: this.cognitoAuthEndpoints.userPoolId,
        });
        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: this.cognitoAuthEndpoints.userPoolClientId,
        });
        new cdk.CfnOutput(this, 'IdentityPoolId', {
            value: this.cognitoAuthEndpoints.identityPoolId,
        });
    }

    private setRole(identityPool: cognito.CfnIdentityPool, userPool: cognito.UserPool, userPoolClient: cognito.UserPoolClient) {
        const isAnonymousCognitoGroupRole = new iam.Role(
            this,
            'anonymous-group-role',
            {
                description: 'Default role for anonymous users',
                assumedBy: new iam.FederatedPrincipal(
                    'cognito-identity.amazonaws.com',
                    {
                        StringEquals: {
                            'cognito-identity.amazonaws.com:aud': identityPool.ref,
                        },
                        'ForAnyValue:StringLike': {
                            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
                        },
                    },
                    'sts:AssumeRoleWithWebIdentity'
                ),
                managedPolicies: [
                    iam.ManagedPolicy.fromAwsManagedPolicyName(
                        'service-role/AWSLambdaBasicExecutionRole'
                    ),
                ],
            }
        );

        const isUserCognitoGroupRole = new iam.Role(this, 'users-group-role', {
            description: 'Default role for authenticated users',
            assumedBy: new iam.FederatedPrincipal(
                'cognito-identity.amazonaws.com',
                {
                    StringEquals: {
                        'cognito-identity.amazonaws.com:aud': identityPool.ref,
                    },
                    'ForAnyValue:StringLike': {
                        'cognito-identity.amazonaws.com:amr': 'authenticated',
                    },
                },
                'sts:AssumeRoleWithWebIdentity'
            ),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                    'service-role/AWSLambdaBasicExecutionRole'
                ),
            ],
        });


        new cognito.CfnIdentityPoolRoleAttachment(
            this,
            'identity-pool-role-attachment',
            {
                identityPoolId: identityPool.ref,
                roles: {
                    authenticated: isUserCognitoGroupRole.roleArn,
                    unauthenticated: isAnonymousCognitoGroupRole.roleArn,
                },
                roleMappings: {
                    mapping: {
                        type: 'Token',
                        ambiguousRoleResolution: 'AuthenticatedRole',
                        identityProvider: `cognito-idp.${cdk.Stack.of(this).region}.amazonaws.com/${userPool.userPoolId}:${userPoolClient.userPoolClientId}`,
                    },
                },
            }
        );
    }
}

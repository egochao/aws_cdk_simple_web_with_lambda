import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';


export class CognitoStack extends cdk.Stack {
    public readonly userPoolId: string;
    public readonly userPoolClientId: string;
    public readonly IdentityPoolId: string | undefined;
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
            generateSecret: true
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
                'sts:AssumeRoleWithWebIdentity',
                ),
                managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                    'service-role/AWSLambdaBasicExecutionRole',
                ),
                ],
            },
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
                'sts:AssumeRoleWithWebIdentity',
            ),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                'service-role/AWSLambdaBasicExecutionRole',
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
                      identityProvider: `cognito-idp.${
                        cdk.Stack.of(this).region
                      }.amazonaws.com/${userPool.userPoolId}:${
                        userPoolClient.userPoolClientId
                      }`,
                    },
                  },
                },
              );
              
        
        this.userPoolId = userPool.userPoolId;
        this.userPoolClientId = userPoolClient.userPoolClientId;
        this.IdentityPoolId = identityPool.attrName || "None";
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: this.userPoolId,
        });
        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: this.userPoolClientId,
        });
        new cdk.CfnOutput(this, 'IdentityPoolId', {
            value: this.IdentityPoolId,
        });
        
    }
}

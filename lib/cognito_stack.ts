import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cdk from 'aws-cdk-lib';


export class CognitoStack extends cdk.Stack {
    public readonly userPoolId: string;
    public readonly userPoolClientId: string;
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


        this.userPoolId = userPool.userPoolId;
        this.userPoolClientId = userPoolClient.userPoolClientId;
        
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: this.userPoolId,
        });
        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: this.userPoolClientId,
        });
    }
}

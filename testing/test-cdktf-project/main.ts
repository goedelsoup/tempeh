import { App, TerraformStack } from "cdktf";
import { Construct } from "constructs";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    // This is a minimal stack for testing
    // In a real project, you would add resources here
  }
}

const app = new App();
new MyStack(app, "test-stack");
app.synth();

import generate from "@babel/generator";
import * as t from "@babel/types";
import { VM } from "vm2";

export class CodeSnippetGenerator {
  codeSnippets: string[] = [];
  sandbox: VM;

  constructor() {
    this.sandbox = new VM();
  }

  generateCode(node: t.Node): void {
    const code = generate(node).code;
    this.codeSnippets.push(code + "\n\n");
  }

  execute(): Promise<void> {
    // Join all code snippets into a single string
    const joinedCode = this.codeSnippets.join("");

    // Execute the joined code in the sandbox environment
    return new Promise<void>((resolve, reject) => {
      try {
        this.sandbox.run(joinedCode);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  evalCode(code: string) {
    // Evaluate the code using the VM sandbox environment
    return this.sandbox.run(code);
  }
}

export default CodeSnippetGenerator;

import generate from "@babel/generator";
import { NodePath, parseSync } from "@babel/core";
import * as t from "@babel/types";

export class CodeSnippetGenerator {
  private codeSnippets: string[] = [];

  constructor() {}

  generateCode(node: t.Node): void {
    const code = generate(node).code;
    this.codeSnippets.push(code + "\n\n");
  }

  generateCodeSnippets(): void {}

  executeCodeSnippets(): void {
    // Pass the code snippets to a sandbox or any other execution environment
    // Execute each code snippet in order
    for (const codeSnippet of this.codeSnippets) {
      // Execute codeSnippet using the desired environment
      // Example: vm.run(codeSnippet);
    }
  }
}
export default CodeSnippetGenerator;

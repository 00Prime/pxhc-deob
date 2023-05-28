import { appendFileSync, readFileSync, writeFileSync } from "fs";
import { parseSync } from "@babel/core";
import traverse, { NodePath } from "@babel/traverse";
import generate_ from "@babel/generator";
import * as t from "@babel/types";
import { VM } from "vm2";
import CodeSnippetGenerator from "./codeSnippet";

const code: string = readFileSync("../out/captcha.js", "utf8");

const ast = parseSync(code);

let arrayFunctionVisted: string[] = [];

let sandbox: CodeSnippetGenerator = new CodeSnippetGenerator();

traverse(ast, {
  ForStatement(path: NodePath<t.ForStatement>) {
    const { body } = path.node;

    if (!t.isTryStatement(body)) return;
    if (body.handler.body.body.length == 0) return;

    let binding;
    //for(;;) some obfuscated loops have init before the for loop
    if (!path.node.init) {
      const variable = path.getPrevSibling().node as t.VariableDeclaration; //set it to code above

      //set the binding for function variable is declared with
      //must be callexpession
      if (!t.isCallExpression(variable.declarations[0].init)) return;

      const callee = variable.declarations[0].init.callee;
      if (!t.isIdentifier(callee)) return;

      //get the variable declaration and set the binding to the function

      binding = path.scope.getBinding(callee.name).path;

      sandbox.generateCode(binding.node); // generate_(path.node).code;
      sandbox.generateCode(variable); //add the missing variable declaration to sandbox
    } else {
      path.traverse({
        CallExpression(path: NodePath<t.CallExpression>) {
          const { arguments: args, callee } = path.node;

          if (!t.isIdentifier(callee)) return;

          const binding = path.scope.getBinding(callee.name).path;
          sandbox.generateCode(binding.node);
          path.stop();
        },
      });
    }

    //
    //get the binding function called in the for loop traverse
    path.traverse({
      IfStatement(path: NodePath<t.IfStatement>) {
        path.traverse({
          CallExpression(path) {
            const { arguments: args, callee } = path.node;

            if (args.length !== 2) return;
            if (!t.isIdentifier(callee)) return;

            const binding = path.scope.getBinding(callee.name).path;
            sandbox.generateCode(binding.node);
            path.stop();
          },
        });
      },
    });

    //Thats forloop
    sandbox.generateCode(path.node);
  },
});

debugger;
// traverse_(ast, {
//   CallExpression(path) {
//     const {
//       callee,
//       arguments: args,
//     } = path.node;

//     if (t.isIdentifier(callee) && args.length == 2 && (t.isUnaryExpression(args[0]) || t.isNumericLiteral(args[0])) && (t.isUnaryExpression(args[1]) || t.isNumericLiteral(args[1]))) {

//       const binding = path.scope.getBinding(callee.name);
//       if (!binding) return; // built-in functions
//       const funcPath = binding.path;

//       if (!t.isFunctionDeclaration(funcPath.node)) return;

//       if (funcPath.node.body.body.length !== 2) {
//         // console.log('left out a function ', funcPath.node.id.name);
//         // debugger;
//         return;
//       }

//       const offsets: number[] = args.map((arg: t.Expression) => {
//         if (t.isUnaryExpression(arg) && arg.operator === '-') {
//           return -(arg.argument as t.NumericLiteral).value;
//         }
//         if (t.isNumericLiteral(arg)) {
//           return (arg as t.NumericLiteral).value;
//         }
//         throw new Error('offset must be a number');
//       });

//       evalCode(funcPath);

//     }
//   }
// });

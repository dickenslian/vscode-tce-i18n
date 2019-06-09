import * as vscode from "vscode";
const fs = require("fs");
const clipboardy = require("clipboardy");
const path = require('path');
const exec = require('child_process').exec;

enum ComponentType {
  TABLE,
}


function extractTableField(fileContent: string): string {
  const re = /[\s\S]*colums:([\s\S]*\}\s+\])[\s\S]*/;
  const found = re.exec(fileContent);

  if (!Array.isArray(found) || found.length < 2) {
    return "fail to extract table field";
  }

  const matchStr = found[1];
  // 给属性名加上双引号，不然 parse 的时候会报错
  const formatedStr = matchStr.replace(/\s{2,}(\w+)/g, (match, key) => {
    return `"${key}"`;
  });

  const fieldList = JSON.parse(formatedStr);

  if (Array.isArray(fieldList)) {
    fieldList.forEach(item => {
      const key = item.key;
      const reContent = new RegExp(`[\\s\\S]*case "${key}":([\\s\\S]*?)break`,"g");
      const foundContent = reContent.exec(fileContent);

      if (!Array.isArray(foundContent) || foundContent.length < 2) {
        item.render = '(data: object) => { "/* return ()*/" }';
      } else {
        let caseContent = foundContent[1];
        caseContent = caseContent.trim();
        item.render = `(data: object) => { "/*${caseContent}*/" }`;
      }
    });
  }

  // parse 默认忽略方法，指定方法直接转成字符串
  let columnsToWrite = JSON.stringify(fieldList, (key, value) => {
    if (typeof value === "function") {
      return value.toString();
    } else {
      return value;
    }
  });

  // 去掉属性名两边的引号
  columnsToWrite = columnsToWrite.replace(/"(\w+)":/g, (match, key) => {
    return `${key}:`;
  });

  // 去掉方法两边的引号
  columnsToWrite = columnsToWrite.replace(
    /"(\([\s\S]*?\s\})"/g,
    (match, key) => {
      return key;
    }
  );

  // 去掉方法两边的引号
  // columnsToWrite = columnsToWrite.replace(
  //   /"(\([\s\S]*?data)"/g,
  //   (match, key) => {
  //     return key;
  //   }
  // );

  // 去掉多余的换行和斜杠
  columnsToWrite = columnsToWrite.replace(/\\n/g,'');
  columnsToWrite = columnsToWrite.replace(/\\/g,'');  

  // 让注释生效
  columnsToWrite = columnsToWrite.replace(/"\/\*/g,'\/\*');  
  columnsToWrite = columnsToWrite.replace(/\*\/"/g,'\*\/');  


  const strToWrite = `import React, { Fragment } from 'react';
  import { t, Trans } from '@tea/app/i18n';
  import { constants } from '@tencent/tce-lib';

  export function getListFields() {
    // 列表参数
    let columns = ${columnsToWrite};

    return columns;
  }
  `;

  return strToWrite;
}

function generateClassName(dirName:string) {
  if (!dirName) {
      throw new Error('dir name should not be null');
  }

  function capitalizeFirstLetter(string:string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const nameArr = dirName.split('_');
  let className = '';
  
  for (const name of nameArr) {
      className += capitalizeFirstLetter(name);
  }
  
  return className;
}

function generateComponent(componentName:string, fullPath:string, componentType: ComponentType) {
  if (fs.existsSync(fullPath)) {
      console.log(`${componentName} already exists, please choose another name.`);
      return;
  }

  const className = generateClassName(componentName);
  console.log(`class name: ${className}`);


  fs.mkdirSync(fullPath);

  const fcTemplate = path.resolve(__dirname, '../code_templates/fc.txt');

  const jsFile = path.resolve(`${fullPath}/index.js`);

  const jsFileContent = fs.readFileSync(fcTemplate, { encoding: 'utf-8' });

  fs.writeFileSync(jsFile, jsFileContent.replace(/ClassName/g, className));

/*   exec(`cd ${fullPath} && git add .`, (err) => {
      if (err) {
          console.log('command fail:', 'git add .');
      } else {
          console.log('command success:', 'git add .');
      }
  }); */

 vscode.window.showInformationMessage('component created successfully!');
}

export function activate(context: vscode.ExtensionContext) {
  
  const generateCode = vscode.commands.registerCommand(
    "extension.generateCode",
    param => {
      let currentlyOpenTabfilePath;
      const textEditor = vscode.window.activeTextEditor;

      if (!textEditor) {
        vscode.window.showInformationMessage(
          "pls open the file your code generated from"
        );
        return;
      }

      currentlyOpenTabfilePath = textEditor.document.fileName;

      fs.readFile(
        currentlyOpenTabfilePath,
        "utf8",
        (err: any, data: string) => {
          if (err) throw err;

          if (!data) {
            vscode.window.showInformationMessage("fail to read file");
            return;
          }

          const strToWrite = extractTableField(data);

          clipboardy.writeSync(strToWrite);

          vscode.window.showInformationMessage(
            "file content has been written to clipboard"
          );
        }
      );
    }
  );

  const createTable = vscode.commands.registerCommand(
    "extension.createTable",
    param => {
      const folderPath = param.fsPath;

      const options = {
        prompt: "Please input the component name: ",
        placeHolder: "Component Name"
    }
    
    vscode.window.showInputBox(options).then(value => {
        if (!value) return;

        const componentName = value;
        const fullPath = `${folderPath}/${componentName}`;

        generateComponent(componentName, fullPath, ComponentType.TABLE);
    });
    });

  context.subscriptions.push(generateCode);
  context.subscriptions.push(createTable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

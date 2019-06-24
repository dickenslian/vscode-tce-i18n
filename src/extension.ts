import * as vscode from "vscode";
const fs = require("fs");
const clipboardy = require("clipboardy");
const path = require("path");
const exec = require("child_process").exec;

enum ComponentType {
  TABLE,
  FORM
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

  let fieldList;
  try {
    fieldList = JSON.parse(formatedStr);
  } catch (error) {
    vscode.window.showErrorMessage('Code parse error! Please uncomment the code in the table column definition.');
  }
  

  if (Array.isArray(fieldList)) {
    fieldList.forEach(item => {
      const key = item.key;
      const reContent = new RegExp(
        `[\\s\\S]*case "${key}":([\\s\\S]*?)break`,
        "g"
      );
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
  columnsToWrite = columnsToWrite.replace(/\\n/g, "");
  columnsToWrite = columnsToWrite.replace(/\\/g, "");

  // 让注释生效
  columnsToWrite = columnsToWrite.replace(/"\/\*/g, "/*");
  columnsToWrite = columnsToWrite.replace(/\*\/"/g, "*/");

  const strToWrite = `import React, { Fragment } from 'react';
  import { t, Trans } from '@tea/app/i18n';
  import { constants } from '@tencent/tce-lib';

  export function getTableFields() {
    let columns = ${columnsToWrite};

    return columns;
  }
  `;

  return strToWrite;
}

function generateClassName(dirName: string) {
  if (!dirName) {
    throw new Error("dir name should not be null");
  }

  function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const nameArr = dirName.split("_");
  let className = "";

  for (const name of nameArr) {
    className += capitalizeFirstLetter(name);
  }

  return className;
}

function generateTable(fullPath: string, className: string) {
  /*********** index 文件 ***********/
  const indexTemplate = path.resolve(
    __dirname,
    "../code_templates/table.index.tsx.txt"
  );
  const indexFile = path.resolve(`${fullPath}/index.tsx`);
  const indexFileContent = fs.readFileSync(indexTemplate, {
    encoding: "utf-8"
  });
  fs.writeFileSync(
    indexFile,
    indexFileContent.replace(/ClassName/g, className)
  );

  const cssTemplate = path.resolve(
    __dirname,
    "../code_templates/index.css.txt"
  );
  const cssFile = path.resolve(`${fullPath}/index.css`);
  fs.writeFileSync(
    cssFile,
    fs.readFileSync(cssTemplate, { encoding: "utf-8" })
  );

  /*********** api 文件 ***********/
  fs.mkdirSync(`${fullPath}/api`);

  const apiTemplate = path.resolve(__dirname, "../code_templates/api.ts.txt");
  const apiFile = path.resolve(`${fullPath}/api/index.ts`);
  fs.writeFileSync(
    apiFile,
    fs.readFileSync(apiTemplate, { encoding: "utf-8" })
  );

  /*********** panel 文件 ***********/
  fs.mkdirSync(`${fullPath}/OperationPanel`);

  const panelTemplate = path.resolve(
    __dirname,
    "../code_templates/panel.tsx.txt"
  );
  const panelFile = path.resolve(`${fullPath}/OperationPanel/index.tsx`);
  fs.writeFileSync(
    panelFile,
    fs.readFileSync(panelTemplate, { encoding: "utf-8" })
  );

  /*********** table 文件 ***********/
  fs.mkdirSync(`${fullPath}/Table`);

  const tableTemplate = path.resolve(
    __dirname,
    "../code_templates/table.tsx.txt"
  );
  const tableFile = path.resolve(`${fullPath}/Table/index.tsx`);
  fs.writeFileSync(
    tableFile,
    fs.readFileSync(tableTemplate, { encoding: "utf-8" })
  );
  const cssTableFile = path.resolve(`${fullPath}/Table/index.css`);
  fs.writeFileSync(
    cssTableFile,
    fs.readFileSync(cssTemplate, { encoding: "utf-8" })
  );

  /*********** table hooks 文件 ***********/
  fs.mkdirSync(`${fullPath}/Table/hooks`);

  const hookTemplate = path.resolve(__dirname, "../code_templates/table.hook.ts.txt");
  const hookFile = path.resolve(`${fullPath}/Table/hooks/index.ts`);
  fs.writeFileSync(
    hookFile,
    fs.readFileSync(hookTemplate, { encoding: "utf-8" })
  );

  /*********** table config 文件 ***********/
  fs.mkdirSync(`${fullPath}/Table/config`);

  const addonTemplate = path.resolve(
    __dirname,
    "../code_templates/addon.tsx.txt"
  );
  const addonFile = path.resolve(`${fullPath}/Table/config/addons.tsx`);
  fs.writeFileSync(
    addonFile,
    fs.readFileSync(addonTemplate, { encoding: "utf-8" })
  );

  const fieldsTemplate = path.resolve(
    __dirname,
    "../code_templates/fields.tsx.txt"
  );
  const fieldsFile = path.resolve(`${fullPath}/Table/config/fields.tsx`);
  fs.writeFileSync(
    fieldsFile,
    fs.readFileSync(fieldsTemplate, { encoding: "utf-8" })
  );

  const configTemplate = path.resolve(
    __dirname,
    "../code_templates/config.index.ts.txt"
  );
  const configFile = path.resolve(`${fullPath}/Table/config/index.ts`);
  fs.writeFileSync(
    configFile,
    fs.readFileSync(configTemplate, { encoding: "utf-8" })
  );
}

function generateForm(fullPath: string, className: string) {
  /*********** index 文件 ***********/
  const indexTemplate = path.resolve(
    __dirname,
    "../code_templates/form.index.tsx.txt"
  );
  const indexFile = path.resolve(`${fullPath}/index.tsx`);
  const indexFileContent = fs.readFileSync(indexTemplate, {
    encoding: "utf-8"
  });
  fs.writeFileSync(
    indexFile,
    indexFileContent.replace(/ClassName/g, className)
  );

  const cssTemplate = path.resolve(
    __dirname,
    "../code_templates/index.css.txt"
  );
  const cssFile = path.resolve(`${fullPath}/index.css`);
  fs.writeFileSync(
    cssFile,
    fs.readFileSync(cssTemplate, { encoding: "utf-8" })
  );

  /*********** validate 文件 ***********/ 
  fs.mkdirSync(`${fullPath}/validate`);

  const validateTemplate = path.resolve(__dirname, "../code_templates/validate.ts.txt");
  const validateFile = path.resolve(`${fullPath}/validate/index.ts`);
  fs.writeFileSync(
    validateFile,
    fs.readFileSync(validateTemplate, { encoding: "utf-8" })
  ); 

  /*********** hooks 文件 ***********/ 
  fs.mkdirSync(`${fullPath}/hooks`);

  const hookTemplate = path.resolve(__dirname, "../code_templates/hook.ts.txt");
  const hookFile = path.resolve(`${fullPath}/hooks/index.ts`);
  fs.writeFileSync(
    hookFile,
    fs.readFileSync(hookTemplate, { encoding: "utf-8" })
  ); 

  /*********** submit 文件 ***********/ 
  fs.mkdirSync(`${fullPath}/submit`);

  const submitTemplate = path.resolve(__dirname, "../code_templates/submit.ts.txt");
  const submitFile = path.resolve(`${fullPath}/submit/index.ts`);
  fs.writeFileSync(
    submitFile,
    fs.readFileSync(submitTemplate, { encoding: "utf-8" })
  ); 
}

function generateComponent(
  componentName: string,
  fullPath: string,
  componentType: ComponentType
) {
  if (fs.existsSync(fullPath)) {
    console.log(`${componentName} already exists, please choose another name.`);
    return;
  }

  const className = generateClassName(componentName);
  console.log(`class name: ${className}`);

  // 生成父级目录
  fs.mkdirSync(fullPath);

  switch(componentType) {
    case ComponentType.TABLE:
      generateTable(fullPath, className);
      break;
    case ComponentType.FORM:
      generateForm(fullPath, className);
      break;
    default:
      vscode.window.showErrorMessage('unsupported component type');
  }
  
  vscode.window.showInformationMessage("component created successfully!");
}

export function activate(context: vscode.ExtensionContext) {
  const generateTableField = vscode.commands.registerCommand(
    "extension.generateTableField",
    param => {
      let currentlyOpenTabfilePath;
      const textEditor = vscode.window.activeTextEditor;

      if (!textEditor) {
        vscode.window.showInformationMessage(
          "please open the file your code generated from"
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
            vscode.window.showErrorMessage("fail to read file");
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
      };

      vscode.window.showInputBox(options).then(value => {
        if (!value) return;

        const componentName = value;
        const fullPath = `${folderPath}/${componentName}`;

        generateComponent(componentName, fullPath, ComponentType.TABLE);
      });
    }
  );

  const createForm = vscode.commands.registerCommand(
    "extension.createForm",
    param => {
      const folderPath = param.fsPath;

      const options = {
        prompt: "Please input the component name: ",
        placeHolder: "Component Name"
      };

      vscode.window.showInputBox(options).then(value => {
        if (!value) return;

        const componentName = value;
        const fullPath = `${folderPath}/${componentName}`;

        generateComponent(componentName, fullPath, ComponentType.FORM);
      });
    }
  );

  context.subscriptions.push(generateTableField);
  context.subscriptions.push(createTable);
  context.subscriptions.push(createForm);
}

// this method is called when your extension is deactivated
export function deactivate() {}

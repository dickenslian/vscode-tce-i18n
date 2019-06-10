# TCE i18n 插件

TCE i18n 插件是为 TCE 国际化项目定制的效率工具。目前提供 2 个功能：

- 自动生成列表代码模板
  ![new code](https://github.com/dickenslian/vscode-tce-i18n/blob/master/images/table.gif?raw=true)

  1. 在想要新建代码的地方，点击右键，选择`Create Table`
  2. 相关的组件和配置文件的模板将自动生成

- 从老代码里提取出表格字段
  ![add code](https://github.com/dickenslian/vscode-tce-i18n/blob/master/images/generate.gif?raw=true)

  1. 打开包含字段信息的老代码（包含`columns`字段），点击右键，选择`Generate Code`
  2. 代码抽取后将会复制到粘贴板
  3. 在新代码的文件中，粘贴代码，然后格式化一下

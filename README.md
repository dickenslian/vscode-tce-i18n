# TCE i18n 插件

TCE i18n 插件是为 TCE 国际化项目定制的效率工具。目前提供 6 个功能：

- 自动生成列表代码模板
  ![new code](https://github.com/dickenslian/vscode-tce-i18n/blob/master/images/table.gif?raw=true)

  1. 打开导航栏，在想要新建代码的地方，点击右键，选择`Create Table`
  2. 相关的组件和配置文件的模板将自动生成

- 自动生成表单代码模

  1. 打开导航栏，在想要新建代码的地方，点击右键，选择`Create Form`
  2. 相关的组件和配置文件的模板将自动生成

- 自动生成普通组件代码模

  1. 打开导航栏，在想要新建代码的地方，点击右键，选择`Create Function Component`
  2. 相关的组件和配置文件的模板将自动生成

- 从老代码里提取出表格字段
  ![add code](https://github.com/dickenslian/vscode-tce-i18n/blob/master/images/generate.gif?raw=true)

  1. 打开包含字段信息（`columns`）的老代码，点击右键，选择`Generate Code`
  2. 代码抽取后将会复制到粘贴板
  3. 在新代码的文件中，粘贴代码，然后格式化一下

- 生成代码流程图
  ![add flowchart](https://raw.githubusercontent.com/dickenslian/vscode-tce-i18n/master/images/chart.gif)

  1. 打开导航栏，右键点击目标 \*\*.js 文件，选择`Generate JS Flowchart`
  2. 会在当前目录下生成文件的流程图 \*\*.svg
  3. 可以安装插件 Svg Preview 查看 SVG 文件

- 将 require 转换为 import
  ![change require](https://raw.githubusercontent.com/dickenslian/vscode-tce-i18n/master/images/import.gif)

  1. 在编辑器打开目标文件，点击右键，选择`Change Require to Import`
  2. 所有的 require 将自动转换为 import

- 在当前编辑代码的文件中自动将所有的中文加上国际化转换函数 t() 1.打开包含中文信息的代码，点击右键，选择 Auto Add t() 2.全部替换完成会自动全部替换完成，如果没有需要替换的中文或已经全部替换过的会提示没有找到需要替换的中文
  PS: 处理的情况有

  ```js
  （1）const a = '我是一个中文'   ===>    const a = t('我是一个中文')
   (2) <p title="我是一个中文"></p>    ====>    <p title={t('我是一个中文')}></p>
   (3) <p>我是一个中文</p>      ====>     <p><Trans>我是一个中文</Trans></p>
  ```

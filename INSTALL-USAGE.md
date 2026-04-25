# Base Table 安装与使用简明手册

## 运行位置

所有命令在项目根目录执行：

```bash
cd /home/wang/wk/code/base-table
```

## 开发运行

```bash
npm run tauri:dev
```

也可以只启动前端预览：

```bash
npm run dev
```

## Arch 安装包

重新生成 Arch 安装包：

```bash
./packaging/arch/build-arch-package.sh
```

安装：

```bash
sudo pacman -U packaging/arch/base-table-0.1.0-1-x86_64.pkg.tar.zst
```

安装后运行：

```bash
base-table
```

## 基础使用

1. 点击 `新建 Base` 创建一个文件。
2. 可用文件旁边的 `⇄` 把文件移动到指定文件夹。
3. 点击 `新建表` 创建表格。
4. 点击 `新增列` 创建字段，字段类型支持 `text`、`number`、`date`、`bool`、`single_select`。
5. 字段旁的 `选项` 可为 `single_select` 配置可选项，多个值用英文逗号分隔。
6. 字段旁的 `校验规则` 可填写正则表达式，编辑单元格时会校验。
7. 点击 `新增记录` 后，可在表格单元格中直接编辑数据。
8. 点击 `列行转换` 会切换到单独的转置视图，不会生成新表。
9. 点击 `导出数据` 可把当前表按字段顺序导出为 CSV；桌面版会弹出保存文件对话框。
10. `列设置` 面板可点击 `隐藏设置` 收起，点击 `显示设置` 展开；展开时拖动面板右侧竖条可缩小或放大。

## Excel 导入

点击 `导入 Excel` 后会弹出系统文件选择对话框，选择 `.xlsx`、`.xlsm` 或 `.xls` 文件。若只运行 `npm run dev` 的浏览器预览版，则会退回为路径输入；桌面版 `npm run tauri:dev` 和安装包会使用原生文件选择对话框。

- 每个 sheet 会自动创建为一张表。
- 首行自动作为字段名。
- 导入时会自动推断字段类型和候选维度。

## 视图

- `表格`：直接维护行列数据。
- `看板`：可选择分组字段，并勾选卡片需要显示的字段。
- `甘特`：当表中存在 `date` 类型字段时，会按日期字段生成甘特视图。
- `列行转换`：以视图方式展示字段和记录互换后的结果，不改变原表结构。
- `统计`：工作区上方显示行数、列数、填充率、候选维度数量。

## 验证命令

```bash
npm run test
npm run build
cd src-tauri && cargo fmt --check && cargo test
```

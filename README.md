# 私人知识图书馆

本地阅读用的第一版原型。四栏内容很少，阅读器是主体：技术文有目录，散文把工具收起来。没有进度、打卡、积分或学习统计。

浏览器里现在就能看。桌面端用 Tauri 把同一套界面接到 SQLite，数据目录和安装目录分开。

## 预览

开发服务器：

[私人知识图书馆](http://127.0.0.1:43123/)

这是浏览器预览。页脚写着 `IndexedDB · 浏览器数据库 pkl-library`。它是结构化的 IndexedDB，不是 `localStorage`，也不是 SQLite 文件。换浏览器或清除站点数据，这份预览会消失。桌面版不会读写这个库。

## 本地运行

需要 Node.js 22 左右。

```bash
npm install
npm run dev
```

`npm run dev` 固定在 `http://127.0.0.1:43123`。

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

`npm run build` 只构建网页。它不产生 Windows 安装包。

## Windows 桌面构建

桌面壳在 `src-tauri`。在 Windows 上需要：

- Rust 1.90 或更新（Tauri 2.12 的要求）
- Visual Studio 生成工具，含 MSVC
- WebView2（Windows 11 通常已带）
- Node.js，以及本仓库的 `npm install`

```bash
npm run tauri -- build
```

安装包目标在 `src-tauri/tauri.conf.json` 里写成 NSIS。产物会在 `src-tauri/target/release/bundle/`。

这次环境是 Linux。用 Rust 1.90 执行了 `cargo build -p private-knowledge-library`，链接通过。没有执行 Windows 构建，也没有 NSIS 安装包。不要把这次结果当成 Windows 安装包已经打出来。

本机默认的 Rust 1.83 编不过 Tauri 2.12。检查桌面壳时用的是另外安装的 1.90。

SQLite 逻辑不依赖界面，用下面的命令测过：

```bash
cargo test -p pkl-store
```

## 数据放在哪里

桌面版标识是 `app.private-knowledge-library`。Tauri 会把它放到系统的应用数据目录，不在安装目录里。Windows 上通常类似：

`%APPDATA%\app.private-knowledge-library\`

里面有：

- `library.db`：SQLite，含文章元数据、阅读状态、划线、笔记、个人专题、偏好
- `content/`：每篇文章一份 Markdown。直接改文件不会自动覆盖库内正文
- `attachments/`：附件目录。这一版界面还不能往个人专题插图
- `backups/`：预留的备份目录。设置里的导出目前是浏览器下载，不自动写入这里

外部或新版本的教材正文要经过确认才替换。笔记在另一张表里，替换正文不会带走它们。

浏览器预览没有上述目录。对象仓库在 IndexedDB 数据库 `pkl-library`：`articles`、`documents`、`reading`、`highlights`、`notes` 等。设置页写明了这个差别。

## 项目结构

```text
src/content/articles     十二篇示例 Markdown
src/domain               检索、备份校验、导入、划线定位、未连接的 AI
src/storage              IndexedDB、内存端口、桌面命令端口
src/reader               技术文 / 散文两种版面、公式与代码
src/pages                首页、知识库、发现、AI 搜索、我的、设置
src/components/ui        按钮、对话框、输入（Radix）
crates/pkl-store         SQLite、FTS5、Markdown 文件策略
src-tauri                Tauri 2 壳，命令转到 pkl-store
```

## 版式

纸色 `#f3efe6`，墨色 `#1c1916`，朱印 `#6f2c23`，松绿 `#234742`。夜读只换这一组变量。没有渐变、玻璃卡片和装饰性图标。

页面宽最多 72rem，左右页边约 1.5rem。技术文版心由设置控制：窄 34rem、适中 40rem、宽 46rem，正文 1.0625rem，默认行高 1.9，段落不缩进。散文版心不超过 34rem，字号 1.2rem，行高在偏好上再加 0.16，段首缩进 2em，工具默认收起。

拉丁字母用随包的 Literata。中文用系统字体（Windows 上会落到宋体、黑体或思源；这个 Linux 预览落到文泉驿）。公式和代码高亮的样式也打在包里，阅读时不请求远程字体或图片。

## 栏与示例

每栏三篇，都标了示例，不把候选资料写成教材。

- 大模型：认识与使用，理解与构建。长文包含公式、代码和本地示意图。
- 散文：两篇原创示例可以沉浸阅读。江南与史铁生只有简介、书名和合法入口，没有他们的正文。
- CSP：原创 C++ 教程，链到洛谷上真实存在的题，不转载题面，不能运行或评测。
- 高斯溅射：基础和参数、重建问题、单独的来源示例。来源写了 2026-11-22 之后没有再核验。

发现页的条目都标成候选或入口，不进教材列表。

## 已经能用

- 六处导航：首页、知识库、发现、AI 搜索、我的、设置
- 技术文目录、锚点、KaTeX、代码高亮、文内知识链接
- 散文的收起工具和可展开的背景
- 已读、收藏、最近阅读、笔记
- 划线：同一段里的连续文字可以标回正文。跨段、公式内、正文被替换后对不上的句子，仍作为摘录留在「我的」
- 个人专题：自己的话、从划线来的引用。不能插图
- 离线全文检索。桌面同时维护 SQLite FTS5 trigram；界面为了两端排序一致，读取已保存正文后再计算命中
- Markdown 导入、单篇导出、JSON 备份与恢复。恢复前要确认；不认识的版本直接拒绝；不会用导入文章覆盖审定教材
- AI 接口是可替换的 `AiClient`。默认未连接，不发请求，不编造回答或引用。设置里的地址只保存在本地
- 演示草稿必须确认才写入，并一直标成演示

## 只是占位或还没有

- 没有接任何官方或本地模型。填了地址也不会显示连接成功
- 没有 Windows 安装包
- 没有代码运行、评测、自动抓取、推荐、知识图谱
- 没有手机端和实时同步。`src/storage/sync.ts` 会明确拒绝实时同步，迁移走备份文件
- 个人专题不能插图。附件目录只是建好了
- 内容安全策略目前是空的，正式分发前要收紧。KaTeX 需要内联样式
- 划线做不到跨段稳定回贴

## 这次实际跑过的结果

在本环境中：

- `npm run typecheck`：通过
- `npm test`：10 个文件，26 项通过。覆盖检索、备份校验、导入、划线定位、未连接 AI、IndexedDB 里收藏在重新打开后还在、教材更新不覆盖笔记、恢复必须确认
- `cargo test -p pkl-store`：3 项通过。覆盖中文 FTS5、磁盘 Markdown 未确认不覆盖正文和笔记、恢复不覆盖审定教材、拒绝 `../` 路径
- `npm run build`：通过。网页包较大，主要是 KaTeX 字体和 Markdown 渲染
- `cargo +1.90.0 build -p private-knowledge-library`：Linux 上链接通过
- 浏览器冒烟：公式和代码出现，收藏在重新打开后仍是「已收藏」，检索「注意力怎样用到上下文」命中本地文章，页面写明 AI 未连接

没有跑 Windows 安装包构建。

截图：

- `docs/screenshots/home.png`
- `docs/screenshots/reader-technical.png`
- `docs/screenshots/reader-essay.png`
- `docs/screenshots/ask.png`
- `docs/screenshots/library.png`

## 接下来值得做的

先在一台 Windows 上打出安装包，并核对应用数据目录是否如预期。然后才考虑把 `AiClient` 接到一个明确告知读者的官方接口或本机模型。划线如果要更稳，需要按块记录，而不是只靠一段纯文本。这些都还不在这一版里。

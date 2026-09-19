# SillyTavern 记忆宫殿（Memory Palace）插件

给 SillyTavern（酒馆）接入真正的**长期记忆**——一个**纯前端插件**，无需任何外部后端或额外 Python 依赖，本地酒馆与云酒馆（Docker / Serv00 等）完美通用。

## 架构定位

> 第二阶段重大重构：**彻底放弃外接 Mem0 和独立 FastAPI 后端**，改为纯酒馆原生方案。

```
SillyTavern 前端插件（纯 JS，无后端）
└── index.js（单文件自包含：记忆引擎 + 数据层 + 提示词 + LLM + 管理面板）
    ├── 存储层       ← 7 分区 + 多角色隔离 + CRUD 底座（extension_settings 服务端持久化）
    ├── 提示词层     ← 全自定义 Prompt 配置（大总结 / 待办提取）
    ├── LLM 调用     ← 复用酒馆主模型，或可选独立外部 API
    ├── 记忆引擎     ← 阈值大总结 / 关键词+情绪标签检索召回 / 分批次总结
    └── 管理面板     ← 悬浮球 + 可视化增删改查
```

## 核心特性

### 1. 存储与架构（本地 + 云端通用）
- 纯前端插件，无 mem0ai、无 Python 后端依赖。
- **严禁 localStorage**：所有结构化记忆通过 SillyTavern 的 `extensionSettings` 持久化到服务端 `data/` 目录，云酒馆（Docker/Serv00）与本地酒馆都能正确落盘，多端同步、清浏览器缓存不丢失。

### 2. 多角色隔离 + 7 大结构化分区
- 通过角色唯一标识（`角色名::characterId`）独立建档，多角色、群聊、多人卡严格隔离。
- 7 个核心分区：
  1. 情绪标签 `emotional_tags`
  2. 关键事件 `key_events`
  3. 纪念日 `special_occasions`
  4. 日记 `character_diary`
  5. 情感流转 `emotion_flow`
  6. 待办/约定 `todos`（高频触发 + 动态删除）
  7. 重要物品 `important_items`（{name, significance} 极简结构）
- 每次发送消息前，将分区内容组装成精简提示词，悄悄注入给模型。

### 3. 真实 LLM 摘要与滚动压缩
- 楼层滚动总结：对话超过阈值（默认 20 层，保留最近 5 层），自动调用酒馆当前主模型压缩旧楼层，浓缩成结构化摘要写入关键事件分区。
- 原子化提取：后台调用模型，把关键事实自动归类到对应分区。

### 4. NPC 动态建档
- 对话中频繁出现的新 NPC，自动为其开辟独立记忆库（独立 agent_id）。

### 5. 待办/约定分区（高频触发）
- 每 N 轮（默认 10）触发一次待办检查，未完成约定注入上下文提醒；办完后可一键标记完成或删除。

### 6. 提示词全自定义（可落盘）
- 所有核心 Prompt（总库提炼、日记、情绪标签、待办、NPC 识别等）默认值集中在 `prompts.js`。
- 用户通过面板修改后，**修改结果写回服务端**（`extensionSettings`），换设备、清缓存均生效；未修改项自动回退默认值。

### 7. 可视化管理面板（档案风）
- 侧边**可拖拽悬浮球**（静止时隐藏到侧面、只露出 1/4），点击召唤档案面板。
- 五大分区 + 扩展数据（NPC 库 / 待办 / 物品）直观展示，全部支持**手动增删改查**，改动即时落盘。
- 独立「提示词配置」页，网页端直接修改所有 Prompt 并保存到服务端。
- 响应式布局，手机端与电脑端均美观不拥挤。

## 存储机制说明（通用性与安全性）

本插件的**所有数据**（记忆、NPC 档案、待办、物品、提示词配置）统一写入
SillyTavern 官方的 `extensionSettings`，由酒馆自动持久化到服务端：

- 本地酒馆 → `data/default-user/settings.json`
- 云酒馆（华为云 / 宝塔 / Docker / Serv00）→ 项目目录下等价位置

因此无论换电脑、清浏览器缓存、还是切换设备访问云酒馆，只要服务器上的
数据目录还在，记忆就**绝对不会丢失**。全程**不使用 localStorage**。

## 目录结构

```
sillytavern-long-term-memory/
├── manifest.json   # 插件清单（GitHub 一键安装入口，author: badcode1024-tech）
├── index.js        # 主入口（事件绑定、注入、设置面板）
├── store.js        # 数据模型 + 持久化 + CRUD 底座 + 并发写保护
├── engine.js       # 记忆引擎（提取/总结/待办/NPC）
├── llm.js          # LLM 调用封装（复用酒馆主模型）
├── prompts.js      # 提示词全自定义配置层（可落盘）
├── panel.js        # 档案风可视化管理面板（悬浮球 + 抽屉）
├── style.css       # 样式（暗红/米白毛玻璃 + 响应式）
├── LICENSE         # MIT
└── README.md
```

## 安装（一键）

在 SillyTavern 的「扩展 → **Install Extension**」中，粘贴本仓库的 URL：

```
https://github.com/badcode1024-tech/sillytavern-long-term-memory
```

（可选填分支，多用户场景可选择安装到"所有用户"或"当前用户"）

点击确认后，酒馆会自动下载并加载插件，无需任何额外配置（无后端、无 API Key），立即可用。

> 提示：安装第三方扩展需要电脑上已安装 git。

## 设置项

| 设置 | 默认值 | 说明 |
|------|--------|------|
| 总开关 | 开 | 启用/关闭整个记忆功能 |
| 注入记忆到提示词 | 开 | 是否把记忆注入模型 |
| 总结触发阈值 | 20 | 达到该楼层数触发滚动总结 |
| 保留最近活跃楼层数 | 5 | 总结后保留不折叠的楼层 |
| 待办检查频率 | 10 | 每 N 轮检查一次待办 |

## 说明

- 记忆数据随酒馆的 `settings.json` 一起保存，位于 `data/default-user/settings.json`（本地）或云端的等价位置。
- 本插件复用酒馆当前正在使用的 LLM API 做后台提取/总结，不会额外消耗除当前模型外的任何服务。
- 作者：badcode1024-tech

## 上传到 GitHub（供他人一键安装）

本仓库已按酒馆标准插件格式整理（`manifest.json` 在根目录）。首次上传只需三步：

1. **登录 GitHub**，点右上角 `+` → `New repository`，仓库名填 `sillytavern-long-term-memory`，选 Public，**不要**勾选任何初始化选项（README/gitignore/license 都不勾），点 Create。
2. **运行推送**：双击仓库根目录下的 `推送GitHub.bat`（或手动执行下方 git 命令），粘贴你的仓库地址，按提示完成登录授权。
3. **完成**：推送成功后，别人在酒馆「扩展 → Install Extension」粘贴
   `https://github.com/badcode1024-tech/sillytavern-long-term-memory` 即可一键安装。

手动 git 命令（等价于脚本）：

```bash
git remote add origin https://github.com/badcode1024-tech/sillytavern-long-term-memory.git
git push -u origin main
```

## License

MIT

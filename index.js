// =============================================================
// index.js — 记忆宫殿插件（纯前端 SillyTavern 插件，单文件版）
//
// 架构：纯前端方案，无外部后端、无 mem0ai 依赖。
// 数据通过 getContext().extensionSettings 持久化到服务端 data/ 目录，
// 本地酒馆与云酒馆（Docker/Serv00 等）通用，多端同步、清缓存不丢失。
//
// 重要：本文件是「单文件自包含」版本。SillyTavern 的第三方插件
// 通过 <script> 方式加载 manifest.json 声明的 js 文件，不支持
// ES module 的相对 import，因此这里把 store / engine / llm /
// prompts / panel 全部内联，统一挂到全局 window.LTM 命名空间，
// 彻底避免「Extension failed to load」的模块解析错误。
//
// 安装：SillyTavern「扩展 → 插件」通过 GitHub 链接一键安装。
// =============================================================

(function (global) {
    'use strict';

    // 插件唯一 ID（记忆宫殿）
    const PLUGIN_ID = 'memory-palace';
    // 旧版插件 ID，用于数据迁移：读取旧数据时兼容，避免改名后记忆丢失。
    const LEGACY_PLUGIN_ID = 'long-term-memory';
    // 悬浮球小羊贴图（base64 内嵌，单文件部署；构建时由工具脚本注入）
    const FAB_SHEEP_ICON = 'data:image/png;base64,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';

    // ---------------------------------------------------------------------
    // 兼容层：获取 SillyTavern 上下文。不同版本/加载方式下，
    // getContext 可能来自 window.SillyTavern.getContext 或全局。
    // ---------------------------------------------------------------------
    function getSTContext() {
        try {
            if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
                return SillyTavern.getContext();
            }
            if (global.getContext && typeof global.getContext === 'function') {
                return global.getContext();
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    // =============================================================
    // 分区定义与默认设置
    // =============================================================
    const PARTITIONS = {
        emotional_tags: { label: '情绪标签', type: 'array' },
        key_events: { label: '关键事件', type: 'array' },
        special_occasions: { label: '纪念日', type: 'array' },
        character_diary: { label: '日记', type: 'array' },
        emotion_flow: { label: '情感流转', type: 'array' },
        todos: { label: '待办/约定', type: 'array' },
        important_items: { label: '重要物品', type: 'array' },
    };

    const DEFAULT_SETTINGS = {
        enabled: true,
        injectPrompt: true,
        summaryThreshold: 25,
        keepActiveFloors: 5,
        todoCheckInterval: 10,
        npcMinMentions: 3,
        debug: false,
        // 独立 API（可选，用于单独做总结；留空则复用酒馆主模型）
        externalApiEnabled: false,
        externalApiUrl: '',
        externalApiKey: '',
        externalApiModel: '',
        // 分批次总结：每批最大楼层数
        batchSize: 25,
        // 自定义总结范围（楼层区间）：留空表示总结全部未总结楼层。
        // 例如 startFloor=26, endFloor=48 表示只总结第 26~48 层（含两端）。
        summaryStartFloor: '',
        summaryEndFloor: '',
        // 主题配色 key：'default' | 'theme2' | 'theme3'
        theme: 'default',
    };

    // 三组主题配色（重点色 / 底色 / 辅助色）
    const THEMES = {
        default: {
            name: '默认（暗红·米白）',
            accent: '#8c1c1c',   // 重点色
            accentDark: '#5e1010',
            accentDeep: '#b23a2a',
            gold: '#c9a86a',
            bg: '#f6f1e6',       // 底色
            bg2: '#efe6d3',
            aux: '#8795a5',      // 辅助色（用于文字次要色）
            text: '#3a2f2a',
        },
        theme2: {
            name: '配色二（蓝灰·米白）',
            accent: '#70b0cc',
            accentDark: '#4d8aac',
            accentDeep: '#c96a4a',
            gold: '#70b0cc',
            bg: '#e9e3ce',
            bg2: '#ddd5bf',
            aux: '#8795a5',
            text: '#3a2f2a',
        },
        theme3: {
            name: '配色三（暖黄·奶白）',
            accent: '#f7df7b',
            accentDark: '#d9b94c',
            accentDeep: '#c98a4a',
            gold: '#f7df7b',
            bg: '#fefce5',
            bg2: '#f7f2d0',
            aux: '#6d9dce',
            text: '#3a2f2a',
        },
    };

    // ---------------------------------------------------------------------
    // 默认 Prompt 定义（用户可通过面板覆盖）
    // ---------------------------------------------------------------------
    const DEFAULT_PROMPTS = {
        // 一次性大总结：暂停剧情，总结全部内容，输出结构化 JSON
        summarize_all: {
            name: '大总结',
            system: `请暂停剧情，开始对以下对话内容进行完整的长期记忆总结。你是「{{char}}」的记忆整理助手，
需要把对话里所有值得记住的信息，分门别类整理成结构化的 JSON。

【总结内容与格式】严格按下面的 JSON 结构输出（不要输出 JSON 以外的任何文字）：

{
  "key_events": [
    {
      "date": "这条事件发生的具体年月日（格式 YYYY.M.D，如 2036.4.19；若对话中无明确年月日，则根据上下文推断最近的日期）",
      "content": "发生的关键事件描述（一句话，具体、完整）",
      "keywords": ["事件锚点关键词1", "关键词2", "关键词3"],
      "emotions": ["情绪分类1", "情绪分类2"]
    }
  ],
  "diary": [
    {
      "date": "具体日期（如 4.19 或 4月19日；若对话中无明确日期则用相对时间如「第二天」）",
      "content": "以「{{char}}」口吻、不带个人情绪地流水账式记录这一两天发生的事，一两句话"
    }
  ],
  "emotion_flow": [
    {
      "date": "这一阶段覆盖的具体日期区间，格式为「YYYY.M.D-YYYY.M.D」（如 2036.4.1-2036.4.19；若对话中无明确年月日，则用相对时间区间如「第一天-第三天」）",
      "content": "这一阶段「{{char}}」对 user 的情感变化总结（因为哪些事、态度有了什么变化、现在对 user 的看法）",
      "affection": "当前好感度估值（如 10%-20%，或从 25% 降至 18% 之类的变化描述）",
      "relationship": "「{{char}}」认为自己现在和 user 是什么关系（如：恋人、挚友、师徒、宿敌、陌生人等，一句话概括）"
    }
  ],
  "special_occasions": ["提到的纪念日/生日/重要日期"],
  "todos": [{"content": "约定/承诺/待办内容", "done": false}],
  "important_items": [{"name": "物品名", "significance": "意义"}],
  "npc": [
    {"name": "NPC名字", "identity": "NPC的身份/与主角的关系", "brief": "关于这个NPC的一句话简略记忆（关键事实，越简略越好）"}
  ]
}

【严格规则】
1. 只输出一个合法 JSON 对象，不要输出解释、代码块标记或注释。
2. key_events 是记忆的核心：每条事件必须独立、完整、可单独理解；每条事件都必须带 date（年月日时间锚点）；keywords 是 1-3 个能触发回忆的锚点词（人名/地名/物品/关键动作等），emotions 是这条事件对应的情绪分类词。
3. 【关键词格式铁律】keywords 里的每一个词必须「极简」：英文只能是一个单词，中文只能是一个 2 字或 3 字的词语。严禁输出长短语、整句话、或 4 字以上的词组。例如：正确「戒指」「告白」「生日」「猫」；错误「一起去海边看日出」「她喜欢的那家咖啡店」。
4. diary 是带日期的流水账，客观记录事实，不抒发个人情绪。date 用「几月几日」格式（如 4.19、4月19日），方便作为纪念日关键词触发。
5. emotion_flow 是这一阶段的情感变化总结，必须包含具体日期区间 date、好感度百分比 affection，以及 relationship（char 认为自己现在和 user 的关系）。
6. npc 是对话中出现的其他角色：name 是名字，identity 是身份（如「掌柜」「师姐」「仇人」），brief 是极简略的一句话记忆。NPC 记忆务必简略，不需要像主要角色那么细致。
7. todos 里，对话中已经明确「做完、完成、兑现、取消」的约定/承诺，done 必须填 true；只有仍未完成的才填 false。同一个约定若在多段对话里反复出现，只输出一次，且按最新状态判断 done。
8. important_items 中，同一个物品（名称一致）只能出现一次，不要因为多次提及就重复输出；只有在出现真正重要的物品时才填写，没有就输出空数组。
9. 没有内容的分区输出空数组 []，严禁虚构、推测、补充不存在的信息。

【待总结对话】
{{chunk}}`,
            user: '请开始总结。',
        },
        // 旧版单楼层提取（保留兼容，但默认流程不再每层调用）
        extract_facts: {
            name: '单段提炼（兼容）',
            system: `你是「{{char}}」的长期记忆提取器。请从下面的对话片段中，提取出值得长期记住的关键信息，
并严格按 JSON 结构归类输出。只提取明确出现、值得保留的事实，不要臆测、不要编造。

【分区定义】
- emotional_tags: 「{{char}}」当前表现出的情绪标签。
- key_events: 对话中发生的关键事件、重要剧情节点。
- special_occasions: 提到的特殊节日、纪念日、生日。
- character_diary: 「{{char}}」视角的日记式记录。
- emotion_flow: 「{{char}}」情绪的变化流转。
- todos: 待办、约定、承诺。
- important_items: 重要物品，格式 {name, significance}。
- npc: 其他角色名字。

【严格规则】
1. 只输出一个合法 JSON 对象，不要输出任何 JSON 以外的文字。
2. 没有内容的分区输出空数组 []。
3. 严禁虚构。

【输出格式】
{{json_schema}}

【待处理对话】
{{chunk}}`,
            user: '请执行提取。',
        },
        summarize_floors: {
            name: '楼层滚动总结（兼容）',
            system: `你是「{{char}}」的记忆整理助手。下面是最近一段时间里滚出上下文的旧对话内容。
请把这些内容浓缩成一段简洁、信息密度高的结构化摘要，保留所有关键事实、情感变化、
约定和重要物品，删除寒暄和冗余。

【旧对话内容】
{{history}}

【要求】用中文输出，控制在 300 字以内，按时间顺序概括。`,
            user: '请总结。',
        },
        todo_extract: {
            name: '待办事项提取',
            system: `请从下面对话中提取「{{char}}」或用户明确做出的约定、承诺、待办事项。
每项输出为 JSON 对象：{ "content": "约定内容", "done": false }。
如果有多项，输出数组；如果没有任何约定，输出空数组 []。

【严格规则】
1. 只输出 JSON 数组，不要输出任何 JSON 以外的文字或解释。
2. 只提取明确说出口的约定/承诺/待办，不要凭空猜测。
3. content 要完整、具体。
4. 已经明确「做完、完成、兑现、取消」的约定，done 填 true；只有仍未完成的才填 false。
5. 同一个约定不要重复输出多次，只输出一次，并按最新状态判断 done。

【对话内容】
{{chunk}}`,
            user: '提取待办。',
        },
    };

    const EXTRACT_JSON_SCHEMA = `{
  "emotional_tags": ["情绪词1", "情绪词2"],
  "key_events": ["事件1", "事件2"],
  "special_occasions": ["纪念日1"],
  "character_diary": "日记片段",
  "emotion_flow": ["从X到Y的转变"],
  "todos": [{"content": "约定内容", "done": false}],
  "important_items": [{"name": "物品名", "significance": "意义"}],
  "npc": ["NPC名字1"]
}`;

    // =============================================================
    // 存储层（store）
    // =============================================================
    function extSettings() {
        return getSTContext()?.extensionSettings || {};
    }

    let __saveQueued = false;
    function saveSettings() {
        const ctx = getSTContext();
        if (__saveQueued) return;
        __saveQueued = true;
        if (typeof queueMicrotask === 'function') {
            queueMicrotask(() => { __saveQueued = false; });
        } else {
            setTimeout(() => { __saveQueued = false; }, 0);
        }
        if (typeof ctx?.saveSettingsDebounced === 'function') {
            ctx.saveSettingsDebounced();
        } else if (typeof ctx?.saveExtensionSettings === 'function') {
            ctx.saveExtensionSettings();
        } else if (typeof ctx?.saveSettings === 'function') {
            ctx.saveSettings();
        }
    }

    // 获取当前聊天记录 ID（Chat File / Chat ID）。
    // 优先用 getCurrentChatId()（新版 ST 提供），否则回退 context.chatId。
    // 这是实现「换一个新聊天就切换独立记忆存档」的关键标识。
    function getCurrentChatId() {
        try {
            const context = getSTContext();
            if (!context) return null;
            if (typeof context.getCurrentChatId === 'function') {
                const id = context.getCurrentChatId();
                if (id) return String(id);
            }
            if (context.chatId) return String(context.chatId);
        } catch (e) { /* ignore */ }
        return null;
    }

    // 记忆存储键：绑定「角色 + 当前聊天 ID」。
    // - 拿到 chatId 时：`角色名::角色ID::聊天ID`（换新对话自动切独立存档）
    // - 拿不到 chatId 时：回退为 `角色名::角色ID`（兼容旧版/异常情况）
    function getAgentId() {
        const context = getSTContext();
        if (!context) return null;
        const char = context.characters?.[context.characterId];
        if (!char) return null;
        const base = `${char.name}::${context.characterId}`;
        const chatId = getCurrentChatId();
        return chatId ? `${base}::${chatId}` : base;
    }

    // 旧版（不含 chatId）的存储键，用于数据迁移
    function getLegacyAgentId() {
        const context = getSTContext();
        if (!context) return null;
        const char = context.characters?.[context.characterId];
        if (!char) return null;
        return `${char.name}::${context.characterId}`;
    }

    function getCharName() {
        const context = getSTContext();
        return context?.characters?.[context.characterId]?.name || '未知角色';
    }

    function getDatabase() {
        const s = extSettings();
        if (!s[PLUGIN_ID]) s[PLUGIN_ID] = {};
        // 数据迁移：改名后首次访问时，把旧插件 ID 下的数据搬到新 ID，避免记忆丢失。
        if (s[LEGACY_PLUGIN_ID] && !s[PLUGIN_ID].database && s[LEGACY_PLUGIN_ID].database) {
            s[PLUGIN_ID].database = s[LEGACY_PLUGIN_ID].database;
            if (s[LEGACY_PLUGIN_ID].settings && !s[PLUGIN_ID].settings) {
                s[PLUGIN_ID].settings = s[LEGACY_PLUGIN_ID].settings;
            }
            if (s[LEGACY_PLUGIN_ID].prompts && !s[PLUGIN_ID].prompts) {
                s[PLUGIN_ID].prompts = s[LEGACY_PLUGIN_ID].prompts;
            }
            delete s[LEGACY_PLUGIN_ID];
            saveSettings();
        }
        if (!s[PLUGIN_ID].database) s[PLUGIN_ID].database = {};
        return s[PLUGIN_ID].database;
    }

    function createEmptyMemory() {
        return {
            emotional_tags: [],     // 保留：全局情绪标签池（可选）
            key_events: [],         // 关键事件：[{content, keywords:[], emotions:[]}]
            special_occasions: [],  // 纪念日：[string]
            character_diary: [],    // 日记：[{date, content}]
            emotion_flow: [],       // 情感流转：[{content, affection}]
            todos: [],              // 待办：[{content, done}]
            important_items: [],    // 重要物品：[{name, significance}]
            npcs: {},
            meta: {
                created_at: Date.now(),
                updated_at: Date.now(),
                pendingFloors: 0,
                todoCounter: 0,
                lastSummarizedFloor: 0,   // 上次总结到的楼层索引
                pendingFlowInjection: false, // 大总结后下一轮注入情感流转一次
            },
        };
    }

    function getCharacterMemory(agentId) {
        const db = getDatabase();
        if (!db[agentId]) {
            // 迁移：新键（含 chatId）首次访问时，若旧键（不含 chatId）存在历史记忆，
            // 把它「移动」到当前聊天存档（迁移后删除旧键），避免升级后记忆丢失。
            // 删除旧键是关键：否则用户再开第二个新聊天时，旧键仍存在，会把旧记忆
            // 再次复制到新聊天，造成记忆污染。
            const legacyId = getLegacyAgentId();
            if (legacyId && legacyId !== agentId && db[legacyId] && db[legacyId].meta) {
                db[agentId] = db[legacyId];
                delete db[legacyId];
                saveSettings();
            } else {
                db[agentId] = createEmptyMemory();
            }
        }
        return db[agentId];
    }

    function getPartition(agentId, partition, npcName = null) {
        const mem = npcName
            ? getCharacterMemory(agentId).npcs[npcName]
            : getCharacterMemory(agentId);
        if (!mem) return [];
        return mem[partition] || [];
    }

    function addToPartition(agentId, partition, item, npcName = null) {
        const mem = npcName
            ? getCharacterMemory(agentId).npcs[npcName]
            : getCharacterMemory(agentId);
        if (!mem) return;
        if (!Array.isArray(mem[partition])) mem[partition] = [];
        if (Array.isArray(item)) {
            mem[partition].push(...item);
        } else {
            mem[partition].push(item);
        }
        getCharacterMemory(agentId).meta.updated_at = Date.now();
        saveSettings();
    }

    // 归一化字符串用于去重比较（去空白、小写）
    function normalizeStr(s) {
        return String(s ?? '').replace(/\s+/g, '').toLowerCase();
    }

    // 重要物品去重：按 name 归一化后比较，已存在则合并/跳过
    function mergeImportantItems(agentId, items, npcName = null) {
        const mem = npcName
            ? getCharacterMemory(agentId).npcs[npcName]
            : getCharacterMemory(agentId);
        if (!mem) return;
        if (!Array.isArray(mem.important_items)) mem.important_items = [];

        for (const raw of items) {
            const name = typeof raw === 'string' ? raw : (raw?.name || '');
            const significance = typeof raw === 'object' ? (raw.significance || '') : '';
            if (!name || !String(name).trim()) continue;

            const key = normalizeStr(name);
            const existing = mem.important_items.find((it) => {
                const n = typeof it === 'string' ? it : it?.name;
                return normalizeStr(n) === key;
            });
            if (existing) {
                // 已存在：若旧条目缺 significance，则补上
                if (typeof existing === 'object' && !existing.significance && significance) {
                    existing.significance = significance;
                }
                continue;
            }
            mem.important_items.push(
                typeof raw === 'string'
                    ? raw
                    : { name: String(name).trim(), significance: significance || '' }
            );
        }
        getCharacterMemory(agentId).meta.updated_at = Date.now();
        saveSettings();
    }

    // 待办去重 + 完成态合并：按 content 归一化去重；已存在的待办若新结果标记 done，则更新为完成
    function mergeTodos(agentId, items, npcName = null) {
        const mem = npcName
            ? getCharacterMemory(agentId).npcs[npcName]
            : getCharacterMemory(agentId);
        if (!mem) return;
        if (!Array.isArray(mem.todos)) mem.todos = [];

        for (const raw of items) {
            const content = typeof raw === 'string' ? raw : (raw?.content || '');
            const done = typeof raw === 'object' ? !!raw.done : false;
            if (!content || !String(content).trim()) continue;

            const key = normalizeStr(content);
            const existing = mem.todos.find((t) => {
                const c = typeof t === 'string' ? t : t?.content;
                return normalizeStr(c) === key;
            });
            if (existing) {
                // 已存在：若新结果标记为已完成，则更新为完成（完成态只进不退）
                if (done && typeof existing === 'object') {
                    existing.done = true;
                }
                continue;
            }
            mem.todos.push(
                typeof raw === 'string'
                    ? raw
                    : { content: String(content).trim(), done: done }
            );
        }
        getCharacterMemory(agentId).meta.updated_at = Date.now();
        saveSettings();
    }

    function updatePartitionItem(agentId, partition, index, newItem, npcName = null) {
        const mem = npcName
            ? getCharacterMemory(agentId).npcs[npcName]
            : getCharacterMemory(agentId);
        if (!mem || !Array.isArray(mem[partition]) || index < 0 || index >= mem[partition].length) {
            return false;
        }
        mem[partition][index] = newItem;
        getCharacterMemory(agentId).meta.updated_at = Date.now();
        saveSettings();
        return true;
    }

    function removePartitionItem(agentId, partition, index, npcName = null) {
        const mem = npcName
            ? getCharacterMemory(agentId).npcs[npcName]
            : getCharacterMemory(agentId);
        if (!mem || !Array.isArray(mem[partition]) || index < 0 || index >= mem[partition].length) {
            return false;
        }
        mem[partition].splice(index, 1);
        getCharacterMemory(agentId).meta.updated_at = Date.now();
        saveSettings();
        return true;
    }

    function clearMemory(agentId, partition = null) {
        const db = getDatabase();
        if (!db[agentId]) return;
        if (partition === null) {
            db[agentId] = createEmptyMemory();
        } else {
            const mem = db[agentId];
            if (Array.isArray(mem[partition])) mem[partition] = [];
        }
        saveSettings();
    }

    function markTodoDone(agentId, index, npcName = null) {
        const mem = npcName
            ? getCharacterMemory(agentId).npcs[npcName]
            : getCharacterMemory(agentId);
        if (!mem || !Array.isArray(mem.todos) || index < 0 || index >= mem.todos.length) {
            return false;
        }
        const todo = mem.todos[index];
        if (typeof todo === 'string') {
            mem.todos[index] = { content: todo, done: true };
        } else {
            todo.done = true;
        }
        getCharacterMemory(agentId).meta.updated_at = Date.now();
        saveSettings();
        return true;
    }

    function ensureNpcMemory(agentId, npcName, identity = '') {
        const mem = getCharacterMemory(agentId);
        if (!mem.npcs[npcName]) {
            mem.npcs[npcName] = createEmptyMemory();
            mem.npcs[npcName].meta.is_npc = true;
            mem.npcs[npcName].meta.name = npcName;
            mem.npcs[npcName].meta.identity = identity || '';
            saveSettings();
        } else if (identity && !mem.npcs[npcName].meta.identity) {
            // 补充身份信息
            mem.npcs[npcName].meta.identity = identity;
            saveSettings();
        }
        return mem.npcs[npcName];
    }

    function listNpcs(agentId) {
        const mem = getCharacterMemory(agentId);
        return Object.keys(mem.npcs || {});
    }

    // ---------------------------------------------------------------------
    // 主要角色 vs NPC 精细化判定
    // ---------------------------------------------------------------------

    // 从角色卡本体 + 世界书里收集「主要角色候选名字」
    // 角色卡：context.characters 的 name / alternative_names
    // 世界书：context.worldInfo 的 entries 里 keys 数组（关键词通常是角色名）
    function collectMainCharacterNames() {
        const ctx = getSTContext();
        const names = new Set();

        // 1) 角色卡本体
        if (Array.isArray(ctx?.characters)) {
            for (const ch of ctx.characters) {
                if (!ch) continue;
                if (ch.name) names.add(String(ch.name).trim());
                if (Array.isArray(ch.alternative_names)) {
                    ch.alternative_names.forEach((n) => n && names.add(String(n).trim()));
                }
            }
        }

        // 2) 世界书 entries 的 keys（世界书里的角色名/关键概念）
        const wi = ctx?.worldInfo;
        const entries = (wi && (wi.entries || wi.worldInfo || wi)) || [];
        if (Array.isArray(entries)) {
            for (const e of entries) {
                if (!e) continue;
                if (Array.isArray(e.keys)) {
                    e.keys.forEach((k) => k && names.add(String(k).trim()));
                }
                if (Array.isArray(e.key)) {
                    e.key.forEach((k) => k && names.add(String(k).trim()));
                }
                // 兼容某些版本用 keyword 字段
                if (Array.isArray(e.keywords)) {
                    e.keywords.forEach((k) => k && names.add(String(k).trim()));
                }
            }
        }

        // 去掉空串和过短的名字（单个字符可能是误报）
        return [...names].filter((n) => n && n.length >= 1);
    }

    // 统计某个名字在正文对话里出现的次数
    function countNameFrequency(name, chat) {
        if (!name || !Array.isArray(chat)) return 0;
        let count = 0;
        for (const m of chat) {
            const txt = String(m?.mes || m?.content || '');
            if (txt.includes(name)) count++;
        }
        return count;
    }

    // 判断一个名字是否应视为「主要角色」：
    // 在角色卡/世界书里出现过，且在正文对话里反复出现（≥ 阈值）→ 主要角色
    // 否则 → NPC（角色卡里没写，或正文出现频率极低）
    function isMainCharacter(name, chat) {
        if (!name) return false;
        const mainNames = collectMainCharacterNames();
        // 名字命中主要角色候选（精确匹配，或候选是名字的一部分）
        const inCardOrWorld = mainNames.some((mn) => {
            const a = mn.toLowerCase();
            const b = name.toLowerCase();
            return a === b || a.includes(b) || b.includes(a);
        });
        if (!inCardOrWorld) return false;
        // 正文里反复出现（默认阈值 2 次，可在 meta 里调整）
        const freq = countNameFrequency(name, chat);
        const threshold = 2;
        return freq >= threshold;
    }

    function removeNpc(agentId, npcName) {
        const mem = getCharacterMemory(agentId);
        if (mem.npcs && mem.npcs[npcName]) {
            delete mem.npcs[npcName];
            saveSettings();
            return true;
        }
        return false;
    }

    function getNpcMemory(agentId, npcName) {
        const mem = getCharacterMemory(agentId);
        return mem.npcs?.[npcName] || null;
    }

    function getSettings() {
        const s = extSettings();
        if (!s[PLUGIN_ID]) s[PLUGIN_ID] = {};
        if (!s[PLUGIN_ID].settings) {
            s[PLUGIN_ID].settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        }
        const cur = s[PLUGIN_ID].settings;
        for (const key in DEFAULT_SETTINGS) {
            if (cur[key] === undefined) cur[key] = DEFAULT_SETTINGS[key];
        }
        return cur;
    }

    function setSetting(key, value) {
        getSettings()[key] = value;
        saveSettings();
    }

    // 获取当前主题配置（带兜底）
    function getTheme() {
        const key = getSettings().theme || 'default';
        return THEMES[key] || THEMES.default;
    }

    // 应用主题：把主题色写入 CSS 变量（挂到 :root，供面板所有元素引用）
    function applyTheme(key) {
        if (!key || !THEMES[key]) key = 'default';
        setSetting('theme', key);
        const t = THEMES[key];
        const root = document.documentElement;
        root.style.setProperty('--ltm-accent', t.accent);
        root.style.setProperty('--ltm-accent-dark', t.accentDark);
        root.style.setProperty('--ltm-accent-deep', t.accentDeep);
        root.style.setProperty('--ltm-gold', t.gold);
        root.style.setProperty('--ltm-bg', t.bg);
        root.style.setProperty('--ltm-bg2', t.bg2);
        root.style.setProperty('--ltm-aux', t.aux);
        root.style.setProperty('--ltm-text', t.text);
    }

    // ---------------------------------------------------------------------
    // 记忆导入 / 导出
    // ---------------------------------------------------------------------
    const MEMORY_EXPORT_VERSION = '2.2.0';

    // 导出当前角色的完整记忆为 JSON 文件下载
    function exportMemory() {
        const agentId = getAgentId();
        if (!agentId) {
            toastr?.warning?.('记忆宫殿：请先选择角色卡');
            return;
        }
        const mem = getCharacterMemory(agentId);
        const payload = {
            plugin: 'memory-palace',
            version: MEMORY_EXPORT_VERSION,
            exported_at: new Date().toISOString(),
            agentId: agentId,
            charName: getCharName(),
            memory: mem,
        };
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = String(getCharName() || '角色').replace(/[\\/:*?"<>|]/g, '_');
        a.href = url;
        a.download = `记忆宫殿_${safeName}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toastr?.success?.(`记忆宫殿：已导出「${getCharName()}」的完整记忆`);
    }

    // 导入记忆：读取 JSON 文件，正确归属到当前角色分区，不乱码不串台
    function importMemory(file) {
        if (!file) return;
        const agentId = getAgentId();
        if (!agentId) {
            toastr?.warning?.('记忆宫殿：请先选择角色卡');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                // 兼容两种结构：带外层包装 {memory:...} 或直接的记忆对象
                const mem = data && data.memory ? data.memory : data;
                if (!mem || typeof mem !== 'object') {
                    throw new Error('文件内容不是有效的记忆数据');
                }

                // 分区白名单：只导入合法分区，防止杂数据污染
                const PARTITIONS_KEYS = [
                    'emotional_tags', 'key_events', 'special_occasions',
                    'character_diary', 'emotion_flow', 'todos', 'important_items',
                ];
                const target = getCharacterMemory(agentId);
                for (const key of PARTITIONS_KEYS) {
                    if (Array.isArray(mem[key])) {
                        target[key] = mem[key];
                    }
                }
                // NPC 库：逐个导入（对象结构，键为 NPC 名）
                if (mem.npcs && typeof mem.npcs === 'object') {
                    target.npcs = {};
                    for (const npcName in mem.npcs) {
                        const nm = mem.npcs[npcName];
                        if (nm && typeof nm === 'object') {
                            target.npcs[npcName] = nm;
                            if (nm.meta && !nm.meta.name) nm.meta.name = npcName;
                        }
                    }
                }
                // meta：保留目标原有的 meta（楼层计数、flow 标记等不随导入覆盖）
                target.meta = target.meta || {};
                target.meta.updated_at = Date.now();
                saveSettings();
                renderCurrentView();
                toastr?.success?.(`记忆宫殿：已导入「${getCharName()}」的记忆（${MEMORY_EXPORT_VERSION}）`);
            } catch (err) {
                console.warn('[记忆宫殿] 导入失败：', err);
                toastr?.error?.('记忆宫殿：导入失败，' + (err?.message || '文件格式不正确'));
            }
        };
        reader.onerror = () => {
            toastr?.error?.('记忆宫殿：文件读取失败');
        };
        reader.readAsText(file, 'utf-8');
    }

    // 触发文件选择框
    function triggerImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = () => {
            if (input.files && input.files[0]) {
                importMemory(input.files[0]);
            }
        };
        input.click();
    }

    function getGroupCharNames() {
        const context = getSTContext();
        const names = [];
        const group = context?.groupId;
        const chars = context?.characters || {};
        if (group) {
            const members = context?.groups?.find?.(g => g.id === group)?.members || [];
            for (const m of members) {
                const name = chars[m]?.name;
                if (name) names.push(name);
            }
        } else if (context?.characterId != null) {
            names.push(getCharName());
        }
        return names;
    }

    // =============================================================
    // Prompt 层（prompts）
    // =============================================================
    function getPromptOverrides() {
        const s = extSettings();
        if (!s[PLUGIN_ID]) s[PLUGIN_ID] = {};
        return s[PLUGIN_ID].prompts || {};
    }

    function getPrompt(key) {
        const overrides = getPromptOverrides();
        const def = DEFAULT_PROMPTS[key];
        if (!def) return null;
        const custom = overrides[key];
        return {
            name: (custom && custom.name) || def.name,
            system: (custom && custom.system) || def.system,
            user: (custom && custom.user) || def.user,
        };
    }

    function getAllPrompts() {
        const result = {};
        for (const key in DEFAULT_PROMPTS) {
            result[key] = getPrompt(key);
        }
        return result;
    }

    function savePrompt(key, patch) {
        const s = extSettings();
        if (!s[PLUGIN_ID]) s[PLUGIN_ID] = {};
        if (!s[PLUGIN_ID].prompts) s[PLUGIN_ID].prompts = {};
        s[PLUGIN_ID].prompts[key] = {
            name: patch.name,
            system: patch.system,
            user: patch.user,
        };
        saveSettings();
    }

    function resetPrompt(key) {
        const s = extSettings();
        if (s[PLUGIN_ID] && s[PLUGIN_ID].prompts && s[PLUGIN_ID].prompts[key]) {
            delete s[PLUGIN_ID].prompts[key];
            saveSettings();
        }
    }

    // =============================================================
    // LLM 层（llm）
    // =============================================================
    function log(...args) {
        if (getSettings().debug) console.log('[LTM]', ...args);
    }

    async function generateQuiet(prompt, systemPrompt = null) {
        try {
            const context = getSTContext();
            if (!context || typeof context.generateQuietPrompt !== 'function') {
                console.warn('[LTM] 当前酒馆版本不支持 generateQuietPrompt');
                return '';
            }
            // 注意：generateQuietPrompt 只支持 quietPrompt 一个字段，
            // 不支持 systemPrompt 字段。必须把 system + user 合并进 quietPrompt，
            // 否则系统指令会被忽略，导致模型收到不完整指令、输出无意义内容。
            const merged = systemPrompt
                ? `${systemPrompt}\n\n---\n\n${prompt}`
                : prompt;
            const options = { quietPrompt: merged };
            const result = await context.generateQuietPrompt(options);
            return result ?? '';
        } catch (err) {
            console.warn('[LTM] generateQuiet 调用失败：', err);
            return '';
        }
    }

    async function generateWithRetry(prompt, systemPrompt = null, retries = 1) {
        for (let i = 0; i <= retries; i++) {
            const out = await generateQuiet(prompt, systemPrompt);
            if (out && out.trim()) return out;
        }
        return '';
    }

    // 独立 API 生成（可选）：用户配置外部 API 后，总结改走外部接口
    async function generateViaExternalApi(prompt, systemPrompt = null) {
        const settings = getSettings();
        let url = (settings.externalApiUrl || '').trim();
        const key = (settings.externalApiKey || '').trim();
        const model = (settings.externalApiModel || '').trim();

        if (!url) {
            throw new Error('未配置外部 API 地址');
        }

        // URL 规范化：用户可能填的是 base URL（如 https://xxx.com/v1）而非完整
        // chat/completions 地址。若 URL 不以 /chat/completions 结尾，自动补全。
        // 这能修复「能拉模型列表、但总结报错」的问题——拉列表走 /models 能凑对，
        // 但 POST 打到 base URL 上会 404/405。
        if (!/\/chat\/completions\/?$/i.test(url)) {
            url = url.replace(/\/+$/, '') + '/chat/completions';
        }

        const merged = systemPrompt ? `${systemPrompt}\n\n---\n\n${prompt}` : prompt;

        const body = {
            messages: [
                { role: 'user', content: merged },
            ],
        };
        // 只有填了 model 才带 model 字段（有些网关不填 model 也能跑）
        if (model) body.model = model;

        const headers = { 'Content-Type': 'application/json' };
        if (key) headers['Authorization'] = `Bearer ${key}`;

        let resp;
        try {
            resp = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
        } catch (e) {
            // 网络层错误（地址不通、CORS、域名解析失败等）
            throw new Error(`无法连接外部 API（${e?.message || '网络错误'}）。请检查地址是否可访问、是否需走代理。`);
        }

        if (!resp.ok) {
            // 尽量提取 API 返回的错误详情，方便定位
            let detail = '';
            try {
                const errData = await resp.json();
                detail = errData?.error?.message || errData?.message || errData?.error || '';
            } catch (_) { /* 忽略 */ }
            throw new Error(`外部 API 请求失败：HTTP ${resp.status}${detail ? ' — ' + detail : ''}`);
        }

        const data = await resp.json();
        // 兼容 OpenAI 格式与 Anthropic 格式
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content || '';
        }
        if (data.content && Array.isArray(data.content)) {
            const textParts = data.content.filter((c) => c.type === 'text').map((c) => c.text);
            return textParts.join('\n') || '';
        }
        if (typeof data.content === 'string') {
            return data.content;
        }
        // 兜底：尝试其他常见字段
        if (data.output_text) return data.output_text;
        if (data.output && Array.isArray(data.output)) {
            const txt = data.output.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
            if (txt) return txt;
        }
        return '';
    }

    // 生成入口：优先外部 API，否则酒馆主模型
    async function generateSmart(prompt, systemPrompt = null) {
        const settings = getSettings();
        if (settings.externalApiEnabled && settings.externalApiUrl) {
            return await generateViaExternalApi(prompt, systemPrompt);
        }
        return await generateQuiet(prompt, systemPrompt);
    }

    // 拉取外部 API 的可用模型列表（OpenAI 兼容 /models 接口）
    async function fetchExternalModels() {
        const settings = getSettings();
        const url = settings.externalApiUrl;
        const key = settings.externalApiKey;

        if (!url) {
            toastr?.error?.('记忆宫殿：请先填写 API 地址');
            return null;
        }

        // 从 chat/completions 地址推断 base URL
        let baseUrl = url;
        baseUrl = baseUrl.replace(/\/chat\/completions\/?$/, '');
        baseUrl = baseUrl.replace(/\/completions\/?$/, '');
        baseUrl = baseUrl.replace(/\/+$/, '');

        const modelsUrl = `${baseUrl}/models`;
        const headers = {};
        if (key) headers['Authorization'] = `Bearer ${key}`;

        try {
            const resp = await fetch(modelsUrl, { method: 'GET', headers });
            if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}`);
            }
            const data = await resp.json();
            const models = (data.data || [])
                .map((m) => m.id || m.name)
                .filter(Boolean)
                .sort();
            return models;
        } catch (err) {
            console.warn('[记忆宫殿] 拉取模型失败：', err);
            throw err;
        }
    }

    function parseJsonFromText(text) {
        if (!text) return null;
        let cleaned = text.trim();
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start === -1 || end === -1 || end <= start) {
            const arrStart = cleaned.indexOf('[');
            const arrEnd = cleaned.lastIndexOf(']');
            if (arrStart !== -1 && arrEnd > arrStart) {
                cleaned = cleaned.slice(arrStart, arrEnd + 1);
            } else {
                return null;
            }
        } else {
            cleaned = cleaned.slice(start, end + 1);
        }
        try {
            return JSON.parse(cleaned);
        } catch (e) {
            console.warn('[LTM] JSON 解析失败');
            return null;
        }
    }

    // =============================================================
    // 记忆引擎（engine）
    // =============================================================
    function fillTemplate(tpl, vars) {
        let out = tpl;
        for (const k in vars) {
            out = out.split(`{{${k}}}`).join(String(vars[k] ?? ''));
        }
        return out;
    }

    async function extractFacts(agentId, chunkText) {
        const prompt = getPrompt('extract_facts');
        const charName = getCharName();

        const system = fillTemplate(prompt.system, {
            char: charName,
            chunk: chunkText,
            json_schema: EXTRACT_JSON_SCHEMA,
        });

        const out = await generateWithRetry(prompt.user, system);
        const data = parseJsonFromText(out);
        if (!data) {
            log('提取失败或输出非 JSON，跳过');
            return null;
        }

        if (Array.isArray(data.emotional_tags)) addToPartition(agentId, 'emotional_tags', data.emotional_tags);
        if (Array.isArray(data.key_events)) {
            // 兼容字符串或对象两种格式
            for (const ev of data.key_events) {
                if (typeof ev === 'string') {
                    addToPartition(agentId, 'key_events', { content: ev, keywords: [], emotions: [] });
                } else if (ev && typeof ev === 'object') {
                    addToPartition(agentId, 'key_events', {
                        content: ev.content || '',
                        keywords: Array.isArray(ev.keywords) ? ev.keywords : [],
                        emotions: Array.isArray(ev.emotions) ? ev.emotions : [],
                    });
                }
            }
        }
        if (Array.isArray(data.special_occasions)) addToPartition(agentId, 'special_occasions', data.special_occasions);
        if (data.character_diary) {
            if (Array.isArray(data.character_diary)) {
                for (const d of data.character_diary) {
                    addToPartition(agentId, 'character_diary', typeof d === 'string' ? { date: '', content: d } : d);
                }
            } else {
                addToPartition(agentId, 'character_diary', { date: '', content: data.character_diary });
            }
        }
        if (Array.isArray(data.emotion_flow)) addToPartition(agentId, 'emotion_flow', data.emotion_flow);
        if (Array.isArray(data.todos)) addToPartition(agentId, 'todos', data.todos);
        if (Array.isArray(data.important_items)) addToPartition(agentId, 'important_items', data.important_items);
        if (Array.isArray(data.npc)) {
            const chat = getSTContext()?.chat || [];
            for (const name of data.npc) {
                const nm = name && name.trim();
                if (!nm) continue;
                // 主要角色判定：角色卡/世界书出现 + 正文反复出现 → 跳过，不建 NPC 档
                if (isMainCharacter(nm, chat)) continue;
                ensureNpcMemory(agentId, nm);
            }
        }

        log('提取完成，写入分区：', Object.keys(data));
        return data;
    }

    // 把大总结输出的结构化 JSON 分门别类写入对应分区
    // 分区去重检查：date + content 归一化后相同即视为同一条目。
    // 用于总结写入路径，保护「总结失败后重试」场景：已成功批次的数据保留在库中，
    // 重试时同一批次重新总结也不会产生重复的关键事件/日记/情感流转。
    function partitionHasDuplicate(agentId, partition, npcName, item) {
        const mem = npcName ? getNpcMemory(agentId, npcName) : getCharacterMemory(agentId);
        const arr = mem?.[partition];
        if (!Array.isArray(arr)) return false;
        const iContent = normalizeStr(item?.content);
        const iDate = normalizeStr(item?.date);
        return arr.some((it) => {
            if (!it || typeof it !== 'object') return false;
            return normalizeStr(it.content) === iContent && normalizeStr(it.date || '') === iDate;
        });
    }

    // 带去重的写入：同一 date+content 的条目只写一次
    function addIfNew(agentId, partition, item, npcName = null) {
        if (!item || typeof item !== 'object') {
            addToPartition(agentId, partition, item, npcName);
            return;
        }
        if (partitionHasDuplicate(agentId, partition, npcName, item)) return;
        addToPartition(agentId, partition, item, npcName);
    }

    function applySummaryData(agentId, data) {
        if (!data || typeof data !== 'object') return false;

        // 关键事件（对象结构，带 date + keywords + emotions）
        if (Array.isArray(data.key_events)) {
            for (const ev of data.key_events) {
                if (typeof ev === 'string') {
                    addIfNew(agentId, 'key_events', { date: '', content: ev, keywords: [], emotions: [] });
                } else if (ev && typeof ev === 'object' && ev.content) {
                    addIfNew(agentId, 'key_events', {
                        date: ev.date || '',
                        content: String(ev.content),
                        keywords: Array.isArray(ev.keywords) ? ev.keywords.map(String) : [],
                        emotions: Array.isArray(ev.emotions) ? ev.emotions.map(String) : [],
                    });
                }
            }
        }

        // 日记（带日期流水账）
        if (Array.isArray(data.diary)) {
            for (const d of data.diary) {
                if (typeof d === 'string') {
                    addIfNew(agentId, 'character_diary', { date: '', content: d });
                } else if (d && typeof d === 'object') {
                    addIfNew(agentId, 'character_diary', {
                        date: d.date || '',
                        content: d.content || '',
                    });
                }
            }
        }

        // 情感流转（含好感度 + 关系定位 + 具体日期区间）
        if (Array.isArray(data.emotion_flow)) {
            for (const f of data.emotion_flow) {
                if (typeof f === 'string') {
                    addIfNew(agentId, 'emotion_flow', { content: f, affection: '', relationship: '', date: '' });
                } else if (f && typeof f === 'object') {
                    addIfNew(agentId, 'emotion_flow', {
                        content: f.content || '',
                        affection: f.affection || '',
                        relationship: f.relationship || '',
                        date: f.date || '',
                    });
                }
            }
        }

        if (Array.isArray(data.special_occasions)) addToPartition(agentId, 'special_occasions', data.special_occasions);
        // 待办去重 + 完成态合并（避免跨楼层重复、已完成被记成未完成）
        if (Array.isArray(data.todos)) mergeTodos(agentId, data.todos);
        // 重要物品去重（避免同一物品被误判为不同物品重复记录）
        if (Array.isArray(data.important_items)) mergeImportantItems(agentId, data.important_items);

        // NPC：解析 {name, identity, brief} 结构，命名「名字-身份」，记忆简略
        // 但先做主要角色判定：角色卡/世界书里出现过且正文反复出现的，视作主要角色，不建 NPC 档。
        if (Array.isArray(data.npc)) {
            const chat = getSTContext()?.chat || [];
            for (const n of data.npc) {
                let npcName = null;
                let identity = '';
                let brief = '';
                if (typeof n === 'string') {
                    npcName = n.trim();
                } else if (n && typeof n === 'object') {
                    npcName = (n.name || '').trim();
                    identity = (n.identity || '').trim();
                    brief = (n.brief || '').trim();
                }
                if (!npcName) continue;

                // 主要角色判定：命中角色卡/世界书且正文反复出现 → 跳过（不当作 NPC）
                if (isMainCharacter(npcName, chat)) {
                    log(`[记忆宫殿] 「${npcName}」判定为主要角色，跳过 NPC 建档`);
                    continue;
                }

                const npcMem = ensureNpcMemory(agentId, npcName, identity);
                // NPC 记忆尽量简略：brief 作为关键事件存一条（同样去重，防止重试重复建档）
                if (brief) {
                    addIfNew(agentId, 'key_events', {
                        content: brief,
                        keywords: [npcName, ...(identity ? [identity] : [])],
                        emotions: [],
                    }, npcName);
                }
            }
        }

        return true;
    }

    // 强校验：模型返回文本为空（null/undefined/空串/纯空白）时，判定为总结失败。
    // 防止被安全机制拦截导致返回空、却误报「总结成功」并写入空白记忆。
    function assertNonEmptyOutput(out) {
        if (out === null || out === undefined || String(out).trim() === '') {
            const err = new Error('记忆总结失败：返回内容为空或被安全拦截');
            err.ltmEmpty = true;
            throw err;
        }
        return out;
    }

    // 分批次总结：超过 batchSize 层的对话，拆成多批分别总结
    async function summarizeInBatches(agentId, floors, batchSize) {
        const results = [];
        const total = floors.length;
        const size = Math.max(1, batchSize || 25);

        for (let start = 0; start < total; start += size) {
            const end = Math.min(start + size, total);
            const batch = floors.slice(start, end);
            const batchText = batch
                .map((m) => `${m.is_user ? '用户' : getCharName()}：${m.content}`)
                .join('\n');

            const prompt = getPrompt('summarize_all');
            const system = fillTemplate(prompt.system, {
                char: getCharName(),
                chunk: batchText,
            });

            const out = assertNonEmptyOutput(await generateSmart(prompt.user, system));
            const data = parseJsonFromText(out);
            if (!data) {
                // 该批次返回非空但解析不出 JSON：立即中止并抛错（已成功批次的数据保留在记忆库）。
                // 严禁「部分批次失败仍继续」——否则上层会误判为总结成功，照常隐藏楼层造成记忆丢失。
                const batchNo = Math.floor(start / size) + 1;
                const batchTotal = Math.ceil(total / size);
                const err = new Error(`记忆总结失败：第 ${batchNo}/${batchTotal} 批次（第 ${start + 1}~${end} 层）返回内容无法解析为有效记忆`);
                err.ltmEmpty = true;
                throw err;
            }
            applySummaryData(agentId, data);
            results.push(data);
        }
        return results;
    }

    async function rollingSummarize(agentId, oldFloors) {
        // 改用大总结逻辑（结构化 JSON），而非单段文字摘要
        await summarizeInBatches(agentId, oldFloors, getSettings().batchSize);
    }

    // 一次性大总结（手动触发 / 阈值触发共用的核心）
    async function doFullSummarize(agentId, floors) {
        const settings = getSettings();
        const batchSize = settings.batchSize || 25;
        const total = floors.length;

        if (total === 0) return null;

        if (total > 50) {
            // 超过 50 层分批次
            return await summarizeInBatches(agentId, floors, batchSize);
        } else {
            const allText = floors
                .map((m) => `${m.is_user ? '用户' : getCharName()}：${m.content}`)
                .join('\n');
            const prompt = getPrompt('summarize_all');
            const system = fillTemplate(prompt.system, {
                char: getCharName(),
                chunk: allText,
            });
            const out = assertNonEmptyOutput(await generateSmart(prompt.user, system));
            const data = parseJsonFromText(out);
            if (!data) {
                // 返回非空但无法解析为 JSON：同样视为失败，禁止写入空白记忆
                const err = new Error('记忆总结失败：返回内容无法解析为有效记忆');
                err.ltmEmpty = true;
                throw err;
            }
            applySummaryData(agentId, data);
            return data;
        }
    }

    // 大总结完成后：隐藏除最近 keepActiveFloors 层以外的全部楼层。
    // getContext() 不暴露 hideChatMessageRange，故直接设置 is_system=true（与酒馆 /hide 命令等效），
    // 再调用 ctx.saveChat()（即 saveChatConditional）持久化，并同步刷新 DOM。
    async function hideFloorsExceptRecent(agentId) {
        const ctx = getSTContext();
        const chat = ctx?.chat || [];
        const keep = getSettings().keepActiveFloors || 5;
        if (!chat.length) return;

        const hideCount = chat.length - keep;
        if (hideCount <= 0) return; // 没有需要隐藏的楼层

        // 直接设置 is_system 标记（隐藏 [0, hideCount) 即前 hideCount 条）
        for (let i = 0; i < hideCount; i++) {
            if (chat[i]) chat[i].is_system = true;
            // 同步 DOM 属性，让界面即时显示隐藏（幽灵图标）
            const block = document.querySelector(`.mes[mesid="${i}"]`);
            if (block) block.setAttribute('is_system', 'true');
        }

        // 保存聊天
        if (typeof ctx?.saveChat === 'function') {
            try {
                await ctx.saveChat();
            } catch (e) {
                console.warn('[记忆宫殿] saveChat 失败：', e);
            }
        }
    }

    // 标记：大总结刚完成，下一轮注入情感流转一次
    function markFlowInjectionPending(agentId) {
        const mem = getCharacterMemory(agentId);
        if (!mem.meta) mem.meta = {};
        mem.meta.pendingFlowInjection = true;
        saveSettings();
    }

    // 从设置读取自定义总结范围，裁剪 chat 为对应楼层区间。
    // 返回 { floors, startIdx, endIdx }；区间无效时返回 null 并提示。
    function resolveSummaryRange(chat) {
        const s = getSettings();
        const total = chat.length;
        const startRaw = String(s.summaryStartFloor ?? '').trim();
        const endRaw = String(s.summaryEndFloor ?? '').trim();

        // 未填写区间：总结全部楼层
        if (!startRaw && !endRaw) {
            return { floors: chat.map(toFloor), startIdx: 0, endIdx: total - 1 };
        }

        // 楼层号从 1 开始（用户视角），内部索引从 0 开始
        const startFloor = startRaw ? parseInt(startRaw, 10) : 1;
        const endFloor = endRaw ? parseInt(endRaw, 10) : total;

        if (!Number.isFinite(startFloor) || !Number.isFinite(endFloor)) {
            return { error: '楼层范围必须是数字' };
        }
        if (startFloor < 1) {
            return { error: '起始楼层不能小于 1' };
        }
        if (endFloor > total) {
            return { error: `结束楼层不能超过当前总楼层数（${total}）` };
        }
        if (startFloor > endFloor) {
            return { error: '起始楼层不能大于结束楼层' };
        }

        const startIdx = startFloor - 1;
        const endIdx = endFloor - 1;
        const slice = chat.slice(startIdx, endIdx + 1);
        return { floors: slice.map(toFloor), startIdx, endIdx };
    }

    // 楼层消息 → 统一结构
    function toFloor(m) {
        return { is_user: m.is_user, content: String(m.mes) };
    }

    async function manualSummarizeAll(agentId) {
        const context = getSTContext();
        const chat = context?.chat || [];
        const statusEl = document.getElementById('ltm-summarize-status');
        const setStatus = (msg, isErr = false) => {
            if (statusEl) {
                statusEl.style.display = 'block';
                statusEl.style.color = isErr ? '#b23a2a' : '#5e7a3e';
                statusEl.innerHTML = msg;
            }
        };

        if (!chat.length) {
            setStatus('<i class="fa-solid fa-circle-info"></i> 当前没有可总结的对话内容。', true);
            return;
        }

        const range = resolveSummaryRange(chat);
        if (range.error) {
            setStatus(`<i class="fa-solid fa-triangle-exclamation"></i> 总结范围无效：${esc(range.error)}`, true);
            toastr.warning('记忆宫殿：' + range.error);
            return;
        }

        setStatus('<i class="fa-solid fa-spinner fa-spin"></i> 正在总结，请稍候……');

        try {
            const { floors, startIdx, endIdx } = range;
            const result = await doFullSummarize(agentId, floors);
            // 强校验：必须真正产出记忆（对象或非空数组）才算总结成功；
            // 总结失败/被拦截/解析不出内容时，保持楼层原样显示，绝不隐藏。
            const produced = Array.isArray(result) ? result.length > 0 : !!result;
            if (!produced) {
                const err = new Error('记忆总结失败：未能产出有效记忆，楼层保持原样');
                err.ltmEmpty = true;
                throw err;
            }
            const coversToEnd = endIdx === chat.length - 1;
            // 仅当总结覆盖到末尾楼层时，推进已总结指针并归档隐藏旧楼层
            if (coversToEnd) {
                getCharacterMemory(agentId).meta.lastSummarizedFloor = chat.length;
            }
            // 标记：下一轮注入情感流转一次（稳定关系级别）
            markFlowInjectionPending(agentId);
            if (coversToEnd) {
                await hideFloorsExceptRecent(agentId);
            }
            const rangeText = (startIdx !== 0 || endIdx !== chat.length - 1)
                ? `（第 ${startIdx + 1}~${endIdx + 1} 层）`
                : '';
            setStatus(`<i class="fa-solid fa-circle-check"></i> 总结完成${rangeText}，记忆已更新。`);
            toastr.success(`记忆宫殿：总结完成${rangeText}，已写入记忆库`);
            renderCurrentView();
        } catch (err) {
            console.warn('[记忆宫殿] 一键总结失败：', err);
            const reason = err?.message || '请检查模型是否可用';
            setStatus('<i class="fa-solid fa-triangle-exclamation"></i> 总结失败：' + esc(reason), true);
            toastr.error('记忆宫殿：总结失败，' + reason);
        }
    }

    async function checkTodosForce(agentId, recentText) {
        const prompt = getPrompt('todo_extract');
        const system = fillTemplate(prompt.system, { char: getCharName(), chunk: recentText });
        const out = await generateWithRetry(prompt.user, system);
        const todos = parseJsonFromText(out);
        if (Array.isArray(todos) && todos.length) {
            mergeTodos(agentId, todos);
        }
    }

    async function checkTodos(agentId, recentText) {
        const settings = getSettings();
        const mem = getCharacterMemory(agentId);
        mem.meta.todoCounter = (mem.meta.todoCounter || 0) + 1;
        if (mem.meta.todoCounter < settings.todoCheckInterval) {
            return null;
        }
        mem.meta.todoCounter = 0;

        const prompt = getPrompt('todo_extract');
        const system = fillTemplate(prompt.system, { char: getCharName(), chunk: recentText });
        const out = await generateWithRetry(prompt.user, system);
        const todos = parseJsonFromText(out);
        if (Array.isArray(todos) && todos.length) {
            mergeTodos(agentId, todos);
        }

        const pending = mem.todos.filter((t) => !(t && t.done));
        return pending;
    }

    // 情绪反向映射：负面情绪 → 相对的正面情绪。
    // 当上下文命中负面情绪时，同时触发对应正面情绪标签的事件，
    // 让 char 回忆起 user 的好，冲淡冲突感。
    const EMOTION_OPPOSITES = {
        '伤心': ['开心', '幸福', '温暖', '甜蜜', '感动'],
        '难过': ['开心', '幸福', '温暖', '快乐'],
        '生气': ['温暖', '甜蜜', '体贴', '包容', '温柔'],
        '愤怒': ['温暖', '甜蜜', '体贴', '温柔'],
        '失望': ['温暖', '幸福', '惊喜', '陪伴'],
        '委屈': ['温暖', '安慰', '陪伴', '体贴'],
        '生气失望': ['温暖', '幸福'],
        '冷漠': ['温暖', '亲密', '依恋'],
        '害怕': ['安心', '守护', '依靠', '温暖'],
        '恐惧': ['安心', '守护', '依靠'],
        '孤独': ['陪伴', '温暖', '亲密'],
        '难过生气': ['开心', '温暖', '甜蜜'],
        '讨厌': ['喜欢', '心动', '温暖'],
        '恨': ['爱', '心动', '温暖', '甜蜜'],
        '悲伤': ['快乐', '温暖', '幸福'],
        '沮丧': ['鼓励', '支持', '温暖'],
    };

    // 判断文本是否命中某种情绪（含反向映射）
    function matchEmotion(emotion, text) {
        if (!emotion) return false;
        if (text.includes(emotion)) return true;
        // 反向：如果上下文命中负面情绪，则相对的正面情绪也视为命中
        for (const neg in EMOTION_OPPOSITES) {
            if (text.includes(neg)) {
                const positives = EMOTION_OPPOSITES[neg];
                if (positives.some((p) => p === emotion || emotion.includes(p) || p.includes(emotion))) {
                    return true;
                }
            }
        }
        return false;
    }

    // 关键词/情绪标签检索召回：只返回命中的关键事件
    // 情绪标签支持反向召回：上下文命中负面情绪时，也触发相对的正面情绪标签事件
    function retrieveRelevantEvents(agentId, userText) {
        const mem = getCharacterMemory(agentId);
        const events = mem.key_events || [];
        const text = String(userText || '');

        const matched = [];
        for (const ev of events) {
            if (!ev || typeof ev !== 'object') continue;
            const keywords = ev.keywords || [];
            const emotions = ev.emotions || [];

            // 命中关键词（锚点词）
            const hitKeyword = keywords.some((kw) => kw && text.includes(kw));
            // 命中情绪标签：情绪词出现在上下文中，或反向映射命中
            const hitEmotion = emotions.some((em) => em && matchEmotion(em, text));

            if (hitKeyword || hitEmotion) {
                matched.push(ev);
            }
        }
        return matched;
    }

    // 检索命中日期关键词的日记（用于纪念日）
    function retrieveRelevantDiary(agentId, userText) {
        const mem = getCharacterMemory(agentId);
        const diary = mem.character_diary || [];
        const text = String(userText || '');
        if (!text) return [];

        const matched = [];
        for (const d of diary) {
            if (!d || typeof d !== 'object') continue;
            const date = String(d.date || '').trim();
            if (!date) continue;
            // 日期关键词：几月几日 / 月日 / 节日名
            // 提取日期中的数字部分作为关键词（如「4月19日」「4.19」）
            const dateTokens = date.split(/[^0-9一二三四五六七八九十月日号点\.]/).filter((t) => t && t.length >= 2);
            const hit = dateTokens.some((t) => t && text.includes(t)) || text.includes(date);
            if (hit) {
                matched.push(d);
            }
        }
        return matched;
    }

    function buildInjectionPrompt(agentId, userText) {
        const mem = getCharacterMemory(agentId);
        const parts = [];
        const text = String(userText || '');

        const push = (label, arr, formatter) => {
            if (arr && arr.length) {
                const body = formatter ? arr.map(formatter).join('；') : arr.join('；');
                parts.push(`${label}：${body}`);
            }
        };

        // 关键事件：只发送检索命中的事件（核心）
        const relevant = retrieveRelevantEvents(agentId, userText);
        if (relevant.length) {
            const eventText = relevant.map((ev) => {
                const kw = (ev.keywords || []).join('/');
                const em = (ev.emotions || []).join('/');
                const dt = ev.date ? `[${ev.date}]` : '';
                const tag = [dt, kw, em].filter(Boolean).join(' · ');
                return tag ? `${ev.content}（${tag}）` : ev.content;
            }).join('；');
            parts.push(`相关记忆事件：${eventText}`);
        }

        // 日记：仅命中日期关键词时发送（纪念日用途）
        const relevantDiary = retrieveRelevantDiary(agentId, userText);
        if (relevantDiary.length) {
            const diaryText = relevantDiary
                .map((d) => (d.date ? `[${d.date}] ${d.content}` : d.content))
                .join('；');
            parts.push(`纪念日记忆：${diaryText}`);
        }

        // 待办/约定（未完成，轻量）
        const pendingTodos = (mem.todos || []).filter((t) => !(t && t.done));
        push('待办/约定', pendingTodos.map((t) => (typeof t === 'string' ? t : t.content)));

        // 情感流转：只在「刚完成大总结」的那一轮发送一次，用于稳定关系级别
        const shouldInjectFlow = mem.meta && mem.meta.pendingFlowInjection === true;
        if (shouldInjectFlow) {
            const flows = mem.emotion_flow || [];
            if (flows.length) {
                const latest = flows[flows.length - 1];
                if (typeof latest === 'object') {
                    const flowParts = [];
                    if (latest.date) flowParts.push(`阶段：${latest.date}`);
                    if (latest.content) flowParts.push(latest.content);
                    if (latest.affection) flowParts.push(`好感度：${latest.affection}`);
                    if (latest.relationship) flowParts.push(`关系定位：${latest.relationship}`);
                    if (flowParts.length) {
                        parts.push(`当前情感状态（稳定关系）：${flowParts.join('；')}`);
                    }
                }
            }
            // 只注入这一次，之后清除标记
            mem.meta.pendingFlowInjection = false;
            saveSettings();
        }

        // NPC：必须命中 NPC 名字或身份关键词，才发送该 NPC 的简略记忆
        for (const npcName in mem.npcs) {
            const npcMem = mem.npcs[npcName];
            const identity = npcMem?.meta?.identity || '';
            // 名字「张三-掌柜」拆出名字与身份，都作为触发关键词
            const nameTokens = npcName.split(/[-—–_·\s]/).filter(Boolean);
            const triggerTokens = [...nameTokens, identity].filter(Boolean);

            const hit = triggerTokens.some((t) => t && text.includes(t));
            if (!hit) continue;

            const npcKeyEvents = npcMem.key_events || [];
            if (npcKeyEvents.length) {
                // NPC 记忆尽量简略，只取最近一条关键事件
                const brief = npcKeyEvents
                    .map((e) => (typeof e === 'object' ? e.content : e))
                    .filter(Boolean)
                    .slice(-1)
                    .join('；');
                if (brief) {
                    const label = identity ? `${npcName}（${identity}）` : npcName;
                    parts.push(`【${label}】记忆：${brief}`);
                }
            }
        }

        if (!parts.length) return '';
        return `\n\n[以下是你（${getCharName()}）的长期记忆，请自然融入你的回答，不要直接复述这些文字]\n${parts.join('\n')}`;
    }

    // 检查是否该自动总结（基于楼层计数）。返回 true 表示已触发。
    // 该函数是「到达阈值自动触发」的核心：实时读取当前聊天楼层数，
    // 与上次已总结楼层比较，达到阈值即触发，无需手动。
    function maybeAutoSummarize() {
        const settings = getSettings();
        if (!settings.enabled) return false;

        const agentId = getAgentId();
        if (!agentId) return false;

        const context = getSTContext();
        const chat = context?.chat || [];
        if (!chat.length) return false;

        const mem = getCharacterMemory(agentId);
        const lastSummarized = mem.meta.lastSummarizedFloor || 0;

        // 尚未总结的新楼层数（聊天总楼层 - 已总结到的楼层）
        const newFloorCount = chat.length - lastSummarized;
        const threshold = Math.max(1, parseInt(settings.summaryThreshold, 10) || 25);

        if (newFloorCount < threshold) return false;

        // 防止同一批楼层被重复触发（并发保护，模块级变量不持久化）
        if (_autoSummarizing) return false;
        _autoSummarizing = true;

        const newFloors = chat.slice(lastSummarized).map((m) => ({
            is_user: m.is_user,
            content: String(m.mes),
        }));

        // 后台静默总结：不阻塞本轮回复
        doFullSummarize(agentId, newFloors)
            .then(async (result) => {
                _autoSummarizing = false;
                // 只有真正产出记忆才推进已总结楼层指针；否则保留，下次重试
                if (result && (Array.isArray(result) ? result.length > 0 : true)) {
                    mem.meta.lastSummarizedFloor = chat.length;
                    markFlowInjectionPending(agentId);
                    saveSettings();
                    try {
                        await hideFloorsExceptRecent(agentId);
                    } catch (hideErr) {
                        console.warn('[记忆宫殿] 隐藏楼层失败：', hideErr);
                    }
                    toastr.success('记忆宫殿：到达阈值，已自动完成总结并归档旧楼层');
                } else {
                    saveSettings();
                }
            })
            .catch((err) => {
                _autoSummarizing = false;
                console.warn('[记忆宫殿] 自动总结失败：', err);
                toastr.error('记忆宫殿：自动总结失败，' + (err?.message || '请检查模型'));
            });
        return true;
    }

    // 核心入口：每次用户发消息时调用。只负责「判断是否该总结」+「检索注入」，
    // 不再每层提取。
    async function processUserMessage(userText) {
        const settings = getSettings();
        if (!settings.enabled) return '';

        const agentId = getAgentId();
        if (!agentId) return '';

        // 自动总结检测（到达阈值自动触发）
        maybeAutoSummarize();

        // 检索命中并注入（仅命中关键词/情绪的关键事件）
        return buildInjectionPrompt(agentId, userText);
    }

    // =============================================================
    // 管理面板（panel）
    // =============================================================
    function esc(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    const PART_ICONS = {
        emotional_tags: 'fa-face-smile',
        key_events: 'fa-bolt',
        special_occasions: 'fa-cake-candles',
        character_diary: 'fa-book-open',
        emotion_flow: 'fa-heart-pulse',
        todos: 'fa-list-check',
        important_items: 'fa-box-archive',
    };

    const PART_TABS = [
        { key: 'key_events', label: '关键事件' },
        { key: 'special_occasions', label: '特殊节日' },
        { key: 'emotional_tags', label: '情绪标签' },
        { key: 'character_diary', label: '日记本' },
        { key: 'emotion_flow', label: '情感流转' },
    ];

    let currentNpc = null;
    let currentPart = 'key_events';
    let currentView = 'memory';
    // 自动总结并发保护标志（模块级，非持久化，避免刷新/崩溃后残留卡死）
    let _autoSummarizing = false;

    function ensureFontAwesome() {
        if (document.getElementById('ltm-fa-css')) return;
        const existing = [...document.styleSheets].some((s) => {
            try { return (s.href || '').includes('font-awesome') || (s.href || '').includes('fontawesome'); } catch (e) { return false; }
        });
        if (existing) return;
        const link = document.createElement('link');
        link.id = 'ltm-fa-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
        link.crossOrigin = 'anonymous';
        link.referrerPolicy = 'no-referrer';
        document.head.appendChild(link);
    }

    // 关键：动态注入面板样式，确保不依赖 manifest 的 css 字段是否被加载。
    // 这样即使酒馆版本/主题没有加载 style.css，面板样式也能 100% 生效。
    function ensurePanelStyles() {
        if (document.getElementById('ltm-panel-style')) return;
        const style = document.createElement('style');
        style.id = 'ltm-panel-style';
        // 主题变量：默认值，applyTheme() 会动态覆盖（挂到 #ltm-panel-drawer 上）
        const theme = getTheme();
        style.textContent = `
:root{
--ltm-accent:${theme.accent};
--ltm-accent-dark:${theme.accentDark};
--ltm-accent-deep:${theme.accentDeep};
--ltm-gold:${theme.gold};
--ltm-bg:${theme.bg};
--ltm-bg2:${theme.bg2};
--ltm-aux:${theme.aux};
--ltm-text:${theme.text};
}
/* 悬浮球：位置完全由 JS 以内联 left/top 控制，CSS 仅负责外观与过渡。
   外观为无背景小羊贴图 + 柔和白色光晕（圆形光斑，无生硬方形底块/边框），
   drop-shadow 沿贴图 alpha 轮廓投影，深浅色聊天背景下都清晰可见。 */
#ltm-fab{position:fixed;left:0;top:0;z-index:30000;width:56px;height:56px;cursor:grab;user-select:none;-webkit-user-select:none;transition:left .28s cubic-bezier(.22,1,.36,1),top .28s cubic-bezier(.22,1,.36,1),opacity .22s ease;touch-action:none;}
#ltm-fab.ltm-fab-hidden{opacity:0;pointer-events:none;}
#ltm-fab.ltm-fab-dragging{transition:none;cursor:grabbing;}
#ltm-fab .ltm-fab-ball{width:100%;height:100%;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.95) 50%,rgba(255,255,255,.5) 65%,rgba(255,255,255,0) 78%);border:none;box-shadow:none;display:flex;align-items:center;justify-content:center;transition:transform .25s ease;position:relative;}
#ltm-fab:hover .ltm-fab-ball{transform:scale(1.07);}
#ltm-fab .ltm-fab-sheep{width:88%;height:88%;object-fit:contain;object-position:center;pointer-events:none;-webkit-user-drag:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.22));}
#ltm-fab .ltm-fab-label{position:absolute;right:62px;top:50%;transform:translateY(-50%);white-space:nowrap;background:var(--ltm-accent-dark);color:var(--ltm-bg);font-size:12px;padding:4px 10px;border-radius:8px;opacity:0;pointer-events:none;transition:opacity .2s ease;}
#ltm-fab:hover .ltm-fab-label{opacity:1;}
/* 左侧吸附时，标签改到球体右侧显示，避免超出屏幕 */
#ltm-fab[data-side="left"] .ltm-fab-label{right:auto;left:62px;}
/* 缩进态：透明度降到 30%（即 70% 透明），仅露出 1/3 身位，位置由 JS 内联 left 控制 */
#ltm-fab.ltm-fab-collapsed{opacity:.3;}
#ltm-fab.ltm-fab-collapsed:hover,#ltm-fab.ltm-fab-collapsed.ltm-fab-dragging{opacity:1;}
#ltm-panel-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.35);z-index:29999;opacity:0;pointer-events:none;transition:opacity .25s ease;}
#ltm-panel-overlay.ltm-open{opacity:1;pointer-events:auto;}
#ltm-panel-drawer{position:fixed;top:0;right:0;bottom:0;width:460px;max-width:92vw;height:100vh;height:100dvh;z-index:30002;background-color:var(--ltm-bg);background-image:linear-gradient(160deg,var(--ltm-bg),var(--ltm-bg2));border-left:1px solid rgba(140,28,28,.25);box-shadow:-6px 0 24px rgba(0,0,0,.25);transform:translateX(105%);transition:transform .3s cubic-bezier(.22,1,.36,1);display:flex;flex-direction:column;color:var(--ltm-text);box-sizing:border-box;overflow:hidden;font-family:'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif;max-height:100vh;max-height:100dvh;}
#ltm-panel-drawer.ltm-open{transform:translateX(0);}
.ltm-drawer-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:linear-gradient(120deg,var(--ltm-accent-dark),var(--ltm-accent));border-bottom:1px solid rgba(255,255,255,.15);color:var(--ltm-bg);flex-shrink:0;min-height:52px;}
.ltm-drawer-logo{font-weight:700;font-size:1.15rem;letter-spacing:.06em;display:flex;align-items:center;gap:8px;}
.ltm-drawer-logo i{color:var(--ltm-gold);}
.ltm-drawer-close{background:none;border:1px solid rgba(255,255,255,.3);border-radius:50%;width:30px;height:30px;color:var(--ltm-bg);cursor:pointer;display:flex;align-items:center;justify-content:center;}
.ltm-nav-tabs{display:flex;flex-wrap:wrap;gap:6px;padding:10px 16px;border-bottom:1px solid rgba(140,28,28,.2);flex-shrink:0;background:rgba(255,255,255,.25);}
.ltm-nav-tab{font-size:.8rem;font-weight:600;color:rgba(58,47,42,.7);background:transparent;border:1px solid transparent;padding:6px 13px;border-radius:999px;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;}
.ltm-nav-tab.ltm-active{background:var(--ltm-accent);color:var(--ltm-bg);border-color:var(--ltm-gold);}
.ltm-drawer-body{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding:16px 16px 80px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;-webkit-overflow-scroll-behavior:contain;touch-action:pan-y;}
.ltm-card{background:rgba(255,255,255,.55);border:1px solid rgba(140,28,28,.25);border-top:3px solid var(--ltm-accent);border-radius:12px;padding:14px;margin-bottom:14px;box-sizing:border-box;}
.ltm-card-title{font-weight:700;font-size:1rem;display:flex;align-items:center;justify-content:space-between;gap:8px;padding-bottom:10px;margin-bottom:12px;border-bottom:1px dashed rgba(140,28,28,.25);color:var(--ltm-accent-dark);}
.ltm-card-title i{color:var(--ltm-gold);}
.ltm-title-left{display:inline-flex;align-items:center;gap:8px;}
.ltm-field-label{display:block;font-size:.8rem;font-weight:600;margin:12px 0 6px;color:var(--ltm-accent-dark);}
/* 输入框独立配色：写死高对比度，不继承酒馆全局皮肤，避免不同主题下看不清 */
.ltm-input,.ltm-textarea{width:100%;box-sizing:border-box;font-size:.85rem;color:#1f1f1f;background:#ffffff;border:1px solid #b8a78c;border-radius:8px;padding:9px 12px;resize:vertical;outline:none;box-shadow:inset 0 1px 2px rgba(0,0,0,.04);}
.ltm-input::placeholder,.ltm-textarea::placeholder{color:#a39a8c;}
.ltm-input:focus,.ltm-textarea:focus{border-color:var(--ltm-accent);background:#fffefb;box-shadow:0 0 0 3px rgba(140,28,28,.12),inset 0 1px 2px rgba(0,0,0,.04);}
.ltm-input[type="password"],.ltm-input[type="number"],.ltm-input[type="text"]{background:#ffffff;color:#1f1f1f;}
.ltm-btn{font-weight:600;background:var(--ltm-accent);color:var(--ltm-bg);border:1px solid var(--ltm-accent-dark);border-radius:8px;padding:7px 16px;cursor:pointer;font-size:.82rem;white-space:nowrap;}
.ltm-btn-ghost{background:transparent;color:var(--ltm-accent-dark);border:1px solid rgba(140,28,28,.35);}
.ltm-btn-danger{background:transparent;color:var(--ltm-accent-deep);border:1px solid rgba(178,58,42,.4);}
.ltm-btn-sm{padding:3px 10px;font-size:.75rem;border-radius:6px;}
.ltm-btn-add{margin-top:10px;background:transparent;border:1px dashed var(--ltm-accent);color:var(--ltm-accent-dark);border-radius:8px;padding:7px 16px;font-size:.8rem;cursor:pointer;width:100%;}
.ltm-item{display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px dashed rgba(140,28,28,.18);}
.ltm-item-text{flex:1;word-break:break-word;font-size:.85rem;line-height:1.5;min-width:0;}
.ltm-item-text[contenteditable="true"]{outline:none;cursor:text;}
.ltm-item-actions{display:flex;gap:4px;flex-shrink:0;}
.ltm-empty{color:#a0938a;font-size:.85em;font-style:italic;padding:6px 0;}
.ltm-done .ltm-item-text{text-decoration:line-through;color:#a0938a;}
.ltm-tag-list{display:flex;flex-wrap:wrap;gap:8px;}
.ltm-tag{font-size:.8rem;background:rgba(201,168,106,.2);border:1px solid rgba(201,168,106,.5);color:#7a5c3e;border-radius:999px;padding:4px 12px;display:inline-flex;align-items:center;gap:6px;}
.ltm-tag .ltm-tag-del{cursor:pointer;color:var(--ltm-accent-deep);font-weight:700;}
.ltm-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
.ltm-char-card,.ltm-item-card{background:rgba(255,255,255,.55);border:1px solid rgba(140,28,28,.25);border-radius:12px;padding:12px;text-align:center;cursor:pointer;position:relative;}
.ltm-char-icon,.ltm-item-icon{font-size:1.5rem;color:var(--ltm-accent);margin-bottom:6px;}
.ltm-char-name{font-size:.82rem;font-weight:600;color:var(--ltm-text);}
.ltm-item-name{font-size:.82rem;font-weight:700;color:var(--ltm-accent-dark);outline:none;margin-bottom:4px;}
.ltm-item-desc{font-size:.72rem;color:#7a6a5f;outline:none;line-height:1.4;}
.ltm-card-delete{position:absolute;top:6px;right:6px;background:none;border:none;color:var(--ltm-accent-deep);cursor:pointer;font-size:.85rem;}
.ltm-add-card{display:flex;align-items:center;justify-content:center;border-style:dashed;color:var(--ltm-accent);font-size:1.4rem;cursor:pointer;min-height:70px;}
.ltm-prompt-item{margin-bottom:16px;border-bottom:1px dashed rgba(140,28,28,.2);padding-bottom:14px;}
.ltm-prompt-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.ltm-prompt-name{font-weight:700;font-size:.9rem;color:var(--ltm-accent-dark);}
.ltm-hint{font-size:.78rem;color:#7a5c3e;background:rgba(201,168,106,.16);border:1px solid rgba(201,168,106,.35);border-radius:8px;padding:8px 10px;margin:12px 0;line-height:1.5;}
.ltm-switch-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px dashed rgba(140,28,28,.15);font-size:.88rem;}
.ltm-switch{position:relative;width:44px;height:24px;flex-shrink:0;}
.ltm-switch input{opacity:0;width:0;height:0;}
.ltm-switch .ltm-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.2);border-radius:999px;transition:.25s;}
.ltm-switch .ltm-slider::before{content:"";position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.25s;}
.ltm-switch input:checked+.ltm-slider{background:var(--ltm-accent);}
.ltm-switch input:checked+.ltm-slider::before{transform:translateX(20px);}
.ltm-pill-group{display:flex;gap:8px;margin:8px 0;flex-wrap:wrap;}
.ltm-pill{flex:1;min-width:60px;font-weight:600;font-size:.85rem;background:rgba(255,255,255,.5);border:1px solid rgba(140,28,28,.25);color:var(--ltm-text);border-radius:999px;padding:7px 0;cursor:pointer;text-align:center;}
.ltm-pill.ltm-active{background:var(--ltm-accent);color:var(--ltm-bg);border-color:var(--ltm-accent-dark);}
.ltm-event-meta{display:flex;align-items:center;gap:6px;font-size:.75rem;}
.ltm-meta-label{flex-shrink:0;color:var(--ltm-accent);font-weight:700;background:rgba(201,168,106,.2);border:1px solid rgba(201,168,106,.4);border-radius:6px;padding:1px 7px;}
.ltm-meta-val{flex:1;color:#5a4a3f;outline:none;border-bottom:1px dashed rgba(140,28,28,.2);padding:1px 2px;min-width:0;word-break:break-all;}
.ltm-diary-date{font-size:.72rem;color:var(--ltm-accent);font-weight:700;outline:none;}
.ltm-affection{font-size:.75rem;color:var(--ltm-accent-deep);font-weight:600;outline:none;}
.ltm-model-row{display:flex;gap:8px;align-items:center;}
.ltm-model-row .ltm-input{flex:1;min-width:0;}
.ltm-model-row .ltm-btn{flex-shrink:0;}
.ltm-range-row{display:flex;gap:8px;align-items:center;}
.ltm-range-row .ltm-input{flex:1;min-width:0;}
.ltm-range-sep{flex-shrink:0;color:var(--ltm-accent-dark);font-weight:700;}
.ltm-theme-row{display:flex;gap:14px;align-items:center;padding:6px 0;}
.ltm-theme-dot{width:38px;height:38px;border-radius:50%;cursor:pointer;border:3px solid transparent;box-shadow:0 0 0 1px rgba(0,0,0,.15);transition:transform .15s ease,border-color .15s ease;flex-shrink:0;}
.ltm-theme-dot:hover{transform:scale(1.1);}
.ltm-theme-dot.ltm-active{border-color:var(--ltm-accent-dark);box-shadow:0 0 0 2px var(--ltm-accent),0 0 0 1px rgba(0,0,0,.15);}
.ltm-theme-name{font-size:.8rem;color:var(--ltm-text);}
/* ===== 响应式断点 ===== */
/* 平板（768px ~ 1024px）：抽屉宽度收敛，主面板/网格布局不溢出、不重叠 */
@media(min-width:768px) and (max-width:1024px){
    #ltm-panel-drawer{width:min(520px,72vw);max-width:88vw;}
    .ltm-drawer-body{padding:18px 20px 80px;}
    .ltm-grid{grid-template-columns:repeat(3,1fr);}
    .ltm-nav-tabs{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;}
    .ltm-char-card,.ltm-item-card{min-height:80px;}
    .ltm-drawer-head{padding:16px 20px;}
}
/* 手机（≤640px）：全屏抽屉 + 刘海屏/全面屏安全距离 */
@media(max-width:640px){
    #ltm-panel-drawer{width:100vw;max-width:100vw;height:100vh;height:100dvh;max-height:100vh;max-height:100dvh;}
    .ltm-grid{grid-template-columns:1fr 1fr;}
    .ltm-nav-tabs{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;}
    .ltm-drawer-body{padding-bottom:calc(80px + env(safe-area-inset-bottom,0px));}
    /* 刘海屏/全面屏：标题栏与关闭按钮下移避开状态栏，并加大点击区域 */
    .ltm-drawer-head{
        padding-top:calc(14px + env(safe-area-inset-top,0px));
        padding-left:calc(18px + env(safe-area-inset-left,0px));
        padding-right:calc(18px + env(safe-area-inset-right,0px));
        min-height:calc(52px + env(safe-area-inset-top,0px));
    }
    .ltm-drawer-close{width:40px;height:40px;font-size:1.15rem;flex-shrink:0;}
    .ltm-nav-tabs{padding-left:calc(16px + env(safe-area-inset-left,0px));padding-right:calc(16px + env(safe-area-inset-right,0px));}
}
        `;
        document.head.appendChild(style);
    }

    function mountPanelShell() {
        ensureFontAwesome();
        ensurePanelStyles();
        if (document.getElementById('ltm-panel-drawer')) return;

        const shell = document.createElement('div');
        shell.style.cssText = 'all:initial;';
        shell.innerHTML = `
        <div id="ltm-fab" class="ltm-fab-collapsed" data-side="right" title="记忆宫殿">
            <div class="ltm-fab-ball"><img class="ltm-fab-sheep" src="${FAB_SHEEP_ICON}" alt="记忆宫殿" draggable="false"></div>
            <div class="ltm-fab-label">记忆宫殿</div>
        </div>
        <div id="ltm-panel-overlay"></div>
        <aside id="ltm-panel-drawer" style="background-color:#f6f1e6;background-image:linear-gradient(160deg,#f6f1e6,#efe6d3);">
            <div class="ltm-drawer-head">
                <div class="ltm-drawer-logo"><i class="fa-solid fa-landmark"></i> 记忆宫殿 <span style="font-size:0.7em;font-weight:400;opacity:.75;">v2.5.0</span></div>
                <button class="ltm-drawer-close" id="ltm-panel-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="ltm-nav-tabs" id="ltm-nav-tabs">
                <button class="ltm-nav-tab ltm-active" data-view="memory"><i class="fa-solid fa-landmark"></i> 记忆宫殿</button>
                <button class="ltm-nav-tab" data-view="npc"><i class="fa-solid fa-user-group"></i> NPC</button>
                <button class="ltm-nav-tab" data-view="other"><i class="fa-solid fa-inbox"></i> 其他</button>
                <button class="ltm-nav-tab" data-view="prompts"><i class="fa-solid fa-terminal"></i> 提示词</button>
                <button class="ltm-nav-tab" data-view="settings"><i class="fa-solid fa-gear"></i> 设置</button>
            </div>
            <div class="ltm-drawer-body" id="ltm-drawer-body" style="flex:1 1 auto;min-height:0;overflow-y:auto;padding:16px;"></div>
        </aside>
        `;
        document.body.appendChild(shell);

        bindFabDrag();
        bindShellEvents();
    }

    function bindShellEvents() {
        const fab = document.getElementById('ltm-fab');
        const overlay = document.getElementById('ltm-panel-overlay');

        fab.addEventListener('click', openPanel);
        document.getElementById('ltm-panel-close').addEventListener('click', closePanel);
        overlay.addEventListener('click', closePanel);

        document.getElementById('ltm-nav-tabs').addEventListener('click', (e) => {
            const tab = e.target.closest('.ltm-nav-tab');
            if (!tab) return;
            switchView(tab.dataset.view);
        });
    }

    function openPanel() {
        document.getElementById('ltm-panel-drawer').classList.add('ltm-open');
        document.getElementById('ltm-panel-overlay').classList.add('ltm-open');
        document.getElementById('ltm-fab').classList.add('ltm-fab-hidden');
        renderCurrentView();
    }

    function closePanel() {
        document.getElementById('ltm-panel-drawer').classList.remove('ltm-open');
        document.getElementById('ltm-panel-overlay').classList.remove('ltm-open');
        const fab = document.getElementById('ltm-fab');
        fab.classList.remove('ltm-fab-hidden');
        // 面板关闭后，悬浮球回到缩进贴边态（与 AssistiveTouch 一致）
        if (fab._ltmSnapCollapsed) fab._ltmSnapCollapsed();
    }

    function bindFabDrag() {
        const fab = document.getElementById('ltm-fab');
        const FAB_SIZE = 56;                 // 悬浮球尺寸（与 CSS width/height 一致）
        const HOLD_MS = 220;                 // 按住此毫秒数以内松手视为「点击」，超过则视为「拖拽」
        const MOVE_THRESHOLD = 3;            // 移动超过该像素才判定为拖拽
        const EDGE_GAP = 0;                  // 展开态贴边时与屏幕边缘的间距
        let dragging = false;                // 是否正在拖拽
        let moved = false;                   // 是否产生过位移
        let startX = 0, startY = 0;          // 按下时的指针坐标
        let origLeft = 0, origTop = 0;       // 按下时球的左上角坐标
        let startTime = 0;                   // 按下时间戳（用于区分点击/拖拽）

        // 将球平滑吸附到最近边缘，可指定是否缩进
        const snapToEdge = (shouldCollapse) => {
            const side = fab.dataset.side || 'right';
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            // 读取当前（拖拽结束那一刻）球的实际位置作为「高度」锚点
            const rect = fab.getBoundingClientRect();
            let top = rect.top;
            // 上下边界夹取，保证球体始终完整可见
            top = Math.max(0, Math.min(vh - FAB_SIZE, top));
            let left;
            if (side === 'left') {
                left = shouldCollapse ? -(FAB_SIZE * 2 / 3) : EDGE_GAP;
            } else {
                left = shouldCollapse ? (vw - FAB_SIZE / 3) : (vw - FAB_SIZE - EDGE_GAP);
            }
            fab.style.left = left + 'px';
            fab.style.top = top + 'px';
            fab.style.transform = 'none';
            fab.style.right = 'auto';
            if (shouldCollapse) {
                fab.classList.add('ltm-fab-collapsed');
            } else {
                fab.classList.remove('ltm-fab-collapsed');
            }
        };

        // 让球贴到指定边缘并「完全展开」（不缩进），返回该侧边
        const expandToSide = (side) => {
            fab.dataset.side = side;
            snapToEdge(false);
        };

        // 监听窗口尺寸变化，避免缩放/旋转后球跑出屏幕
        const reflow = () => {
            if (!fab.classList.contains('ltm-fab-dragging')) {
                snapToEdge(fab.classList.contains('ltm-fab-collapsed'));
            }
        };
        window.addEventListener('resize', reflow);

        const onStart = (clientX, clientY) => {
            dragging = true;
            moved = false;
            startX = clientX;
            startY = clientY;
            startTime = Date.now();
            const rect = fab.getBoundingClientRect();
            origLeft = rect.left;
            origTop = rect.top;
            fab.classList.add('ltm-fab-dragging');
            fab.classList.remove('ltm-fab-collapsed');
            fab.style.opacity = '1';
        };

        const onMove = (clientX, clientY) => {
            if (!dragging) return;
            const dx = clientX - startX;
            const dy = clientY - startY;
            if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) moved = true;

            const vw = window.innerWidth;
            const vh = window.innerHeight;
            let left = origLeft + dx;
            let top = origTop + dy;
            left = Math.max(0, Math.min(vw - FAB_SIZE, left));
            top = Math.max(0, Math.min(vh - FAB_SIZE, top));

            fab.style.left = left + 'px';
            fab.style.top = top + 'px';
            fab.style.right = 'auto';
            fab.style.transform = 'none';
        };

        const onEnd = () => {
            if (!dragging) return;
            dragging = false;
            fab.classList.remove('ltm-fab-dragging');
            if (!moved) {
                // 无位移：视为点击，交由 click 事件处理展开/呼出，这里不改变位置
                return;
            }
            // 拖拽过：松手后贴边吸附并缩进（露出 1/3 半透明边边）
            snapToEdge(true);
        };

        fab.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            onStart(e.clientX, e.clientY);
        });
        document.addEventListener('mousemove', (e) => {
            if (dragging) onMove(e.clientX, e.clientY);
        });
        document.addEventListener('mouseup', onEnd);

        fab.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            onStart(t.clientX, t.clientY);
        }, { passive: true });
        document.addEventListener('touchmove', (e) => {
            if (dragging) onMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        document.addEventListener('touchend', onEnd);

        // 点击（非拖拽）行为：
        // - 缩进态：点击露出的边边 → 展开到当前所在侧边
        // - 展开态：点击 → 打开面板
        fab.addEventListener('click', (e) => {
            if (moved) {
                // 拖拽后的残留 click，屏蔽
                e.stopPropagation();
                e.preventDefault();
                moved = false;
                return;
            }
            if (fab.classList.contains('ltm-fab-collapsed')) {
                // 缩进态点击：仅展开，不打开面板（与 iPhone AssistiveTouch 一致）
                e.stopPropagation();
                e.preventDefault();
                expandToSide(fab.dataset.side || 'right');
            }
            // 展开态点击：不拦截，冒泡到 bindShellEvents 的 click → openPanel
        }, true);

        // 初始化：默认吸附在右侧中部，缩进态
        fab.dataset.side = 'right';
        fab.style.top = Math.max(0, Math.min(window.innerHeight - FAB_SIZE, (window.innerHeight - FAB_SIZE) / 2)) + 'px';
        snapToEdge(true);

        // 暴露给外部（closePanel 用）：面板关闭后让球回到缩进贴边态
        fab._ltmSnapCollapsed = () => snapToEdge(true);
    }

    function switchView(view) {
        currentView = view;
        document.querySelectorAll('#ltm-nav-tabs .ltm-nav-tab').forEach((t) => {
            t.classList.toggle('ltm-active', t.dataset.view === view);
        });
        renderCurrentView();
    }

    function renderCurrentView() {
        const body = document.getElementById('ltm-drawer-body');
        if (!body) return;
        switch (currentView) {
            case 'memory': body.innerHTML = renderMemoryView(); break;
            case 'npc': body.innerHTML = renderNpcView(); break;
            case 'other': body.innerHTML = renderOtherView(); break;
            case 'prompts': body.innerHTML = renderPromptsView(); break;
            case 'settings': body.innerHTML = renderSettingsView(); break;
            default: body.innerHTML = '';
        }
        bindViewEvents();
    }

    function renderMemoryView() {
        const agentId = getAgentId();
        if (!agentId) {
            return '<div class="ltm-empty">尚未选择角色卡，请先在酒馆中打开一个角色。</div>';
        }

        const groupNames = getGroupCharNames();
        const chars = groupNames.length > 1 ? groupNames : [getCharName()];

        const charCards = chars.map((name) => {
            return `<div class="ltm-char-card" data-char="${esc(name)}">
                <div class="ltm-char-icon"><i class="fa-solid fa-user-ninja"></i></div>
                <div class="ltm-char-name">${esc(name)}</div>
            </div>`;
        }).join('');

        return `
        <div class="ltm-view ltm-active">
            <div class="ltm-card">
                <div class="ltm-card-title">
                    <span class="ltm-title-left"><i class="fa-solid fa-users"></i> 选择角色</span>
                </div>
                <div class="ltm-grid">${charCards}</div>
                <p class="ltm-hint"><i class="fa-solid fa-circle-info"></i> 点击角色查看并编辑其记忆。多人卡中每个角色独立建档，互不干扰。</p>
            </div>
            <div id="ltm-memory-detail"></div>
        </div>`;
    }

    function renderMemoryDetail(agentId, charName) {
        currentNpc = null;
        currentPart = 'key_events';
        return `
        <div class="ltm-card">
            <div class="ltm-card-title">
                <span class="ltm-title-left"><i class="fa-solid fa-book-open-reader"></i> 「${esc(charName)}」记忆库</span>
                <button class="ltm-btn ltm-btn-danger ltm-btn-sm" data-act="clear-all">清空全部</button>
            </div>
            ${renderPartitionTabs()}
            <div id="ltm-part-content"></div>
        </div>`;
    }

    function renderPartitionTabs() {
        const tabs = PART_TABS.map((t) => `
            <button class="ltm-pill ${t.key === currentPart ? 'ltm-active' : ''}" data-part="${t.key}">
                <i class="fa-solid ${PART_ICONS[t.key] || 'fa-cube'}"></i> ${t.label}
            </button>`).join('');
        return `<div class="ltm-pill-group">${tabs}</div>`;
    }

    function renderPartitionContent(agentId, npcName) {
        const mem = npcName ? getNpcMemory(agentId, npcName) : getCharacterMemory(agentId);
        const arr = mem?.[currentPart] || [];
        const isTag = currentPart === 'emotional_tags';

        let body = '';
        if (isTag) {
            body = renderTags(arr, agentId, npcName);
        } else {
            body = arr.length
                ? arr.map((it, i) => renderEditableItem(currentPart, it, i, agentId, npcName)).join('')
                : '<div class="ltm-empty">（暂无内容）</div>';
        }

        const addLabel = isTag ? '添加标签' : (currentPart === 'important_items' ? '添加物品' : '添加条目');

        return `
        ${body}
        <button class="ltm-btn-add" data-act="add" data-part="${currentPart}" data-npc="${esc(npcName || '')}">
            <i class="fa-solid fa-plus"></i> ${addLabel}
        </button>`;
    }

    function renderTags(arr, agentId, npcName) {
        if (!arr.length) return '<div class="ltm-empty">（暂无标签）</div>';
        return `<div class="ltm-tag-list">
            ${arr.map((tag, i) => `
                <span class="ltm-tag">
                    <span contenteditable="true" data-editable data-part="emotional_tags" data-idx="${i}" data-npc="${esc(npcName || '')}">${esc(tag)}</span>
                    <span class="ltm-tag-del" data-act="del" data-part="emotional_tags" data-idx="${i}" data-npc="${esc(npcName || '')}">×</span>
                </span>`).join('')}
        </div>`;
    }

    function renderEditableItem(part, item, index, agentId, npcName) {
        const npcAttr = esc(npcName || '');

        if (part === 'todos') {
            const content = typeof item === 'string' ? item : item.content;
            const done = typeof item === 'object' && item.done;
            return `
            <div class="ltm-item ${done ? 'ltm-done' : ''}">
                <span class="ltm-item-text" contenteditable="true" data-editable data-part="todos" data-idx="${index}" data-npc="${npcAttr}">${esc(content)}</span>
                <div class="ltm-item-actions">
                    ${!done ? `<button class="ltm-btn ltm-btn-sm" data-act="todo-done" data-idx="${index}" data-npc="${npcAttr}">完成</button>` : ''}
                    <button class="ltm-btn ltm-btn-sm ltm-btn-danger" data-act="del" data-part="todos" data-idx="${index}" data-npc="${npcAttr}">删</button>
                </div>
            </div>`;
        }

        if (part === 'important_items') {
            const name = typeof item === 'string' ? item : item.name;
            const sig = typeof item === 'object' ? item.significance : '';
            return `
            <div class="ltm-item">
                <div class="ltm-item-text" style="flex-direction:column;display:flex;gap:2px;">
                    <b contenteditable="true" data-editable data-part="important_items" data-idx="${index}" data-field="name" data-npc="${npcAttr}">${esc(name)}</b>
                    <span style="color:#7a6a5f;font-size:0.78em;" contenteditable="true" data-editable data-part="important_items" data-idx="${index}" data-field="significance" data-npc="${npcAttr}">${esc(sig || '（点击填写意义）')}</span>
                </div>
                <div class="ltm-item-actions">
                    <button class="ltm-btn ltm-btn-sm ltm-btn-danger" data-act="del" data-part="important_items" data-idx="${index}" data-npc="${npcAttr}">删</button>
                </div>
            </div>`;
        }

        // 关键事件：对象结构，含关键词 + 情绪标签，均可编辑
        if (part === 'key_events') {
            if (typeof item === 'string') {
                // 兼容旧数据：纯字符串
                return `
                <div class="ltm-item">
                    <span class="ltm-item-text" contenteditable="true" data-editable data-part="key_events" data-idx="${index}" data-npc="${npcAttr}">${esc(item)}</span>
                    <div class="ltm-item-actions">
                        <button class="ltm-btn ltm-btn-sm ltm-btn-danger" data-act="del" data-part="key_events" data-idx="${index}" data-npc="${npcAttr}">删</button>
                    </div>
                </div>`;
            }
            const keywords = (item.keywords || []).join('、');
            const emotions = (item.emotions || []).join('、');
            const evDate = item.date || '';
            return `
            <div class="ltm-item ltm-event-item">
                <div class="ltm-item-text" style="flex-direction:column;display:flex;gap:5px;">
                    <div class="ltm-diary-date" contenteditable="true" data-editable data-part="key_events" data-idx="${index}" data-field="date" data-npc="${npcAttr}">${esc(evDate || '（点此填年月日，如 2036.4.19）')}</div>
                    <div contenteditable="true" data-editable data-part="key_events" data-idx="${index}" data-field="content" data-npc="${npcAttr}">${esc(item.content || '')}</div>
                    <div class="ltm-event-meta">
                        <span class="ltm-meta-label">关键词</span>
                        <span contenteditable="true" data-editable data-part="key_events" data-idx="${index}" data-field="keywords" data-npc="${npcAttr}" class="ltm-meta-val">${esc(keywords)}</span>
                    </div>
                    <div class="ltm-event-meta">
                        <span class="ltm-meta-label">情绪</span>
                        <span contenteditable="true" data-editable data-part="key_events" data-idx="${index}" data-field="emotions" data-npc="${npcAttr}" class="ltm-meta-val">${esc(emotions)}</span>
                    </div>
                </div>
                <div class="ltm-item-actions">
                    <button class="ltm-btn ltm-btn-sm ltm-btn-danger" data-act="del" data-part="key_events" data-idx="${index}" data-npc="${npcAttr}">删</button>
                </div>
            </div>`;
        }

        // 日记：带日期
        if (part === 'character_diary') {
            if (typeof item === 'string') {
                return `
                <div class="ltm-item">
                    <span class="ltm-item-text" contenteditable="true" data-editable data-part="character_diary" data-idx="${index}" data-npc="${npcAttr}">${esc(item)}</span>
                    <div class="ltm-item-actions">
                        <button class="ltm-btn ltm-btn-sm ltm-btn-danger" data-act="del" data-part="character_diary" data-idx="${index}" data-npc="${npcAttr}">删</button>
                    </div>
                </div>`;
            }
            const date = item.date || '';
            return `
            <div class="ltm-item">
                <div class="ltm-item-text" style="flex-direction:column;display:flex;gap:3px;">
                    <div class="ltm-diary-date" contenteditable="true" data-editable data-part="character_diary" data-idx="${index}" data-field="date" data-npc="${npcAttr}">${esc(date || '（点此填日期，如 4.19）')}</div>
                    <div contenteditable="true" data-editable data-part="character_diary" data-idx="${index}" data-field="content" data-npc="${npcAttr}">${esc(item.content || '')}</div>
                </div>
                <div class="ltm-item-actions">
                    <button class="ltm-btn ltm-btn-sm ltm-btn-danger" data-act="del" data-part="character_diary" data-idx="${index}" data-npc="${npcAttr}">删</button>
                </div>
            </div>`;
        }

        // 情感流转：含好感度
        if (part === 'emotion_flow') {
            if (typeof item === 'string') {
                return `
                <div class="ltm-item">
                    <span class="ltm-item-text" contenteditable="true" data-editable data-part="emotion_flow" data-idx="${index}" data-npc="${npcAttr}">${esc(item)}</span>
                    <div class="ltm-item-actions">
                        <button class="ltm-btn ltm-btn-sm ltm-btn-danger" data-act="del" data-part="emotion_flow" data-idx="${index}" data-npc="${npcAttr}">删</button>
                    </div>
                </div>`;
            }
            const affection = item.affection || '';
            const relationship = item.relationship || '';
            const flowDate = item.date || '';
            return `
            <div class="ltm-item">
                <div class="ltm-item-text" style="flex-direction:column;display:flex;gap:3px;">
                    <div class="ltm-diary-date" contenteditable="true" data-editable data-part="emotion_flow" data-idx="${index}" data-field="date" data-npc="${npcAttr}">${esc(flowDate || '（点此填日期区间，如 2036.4.1-2036.4.19）')}</div>
                    <div contenteditable="true" data-editable data-part="emotion_flow" data-idx="${index}" data-field="content" data-npc="${npcAttr}">${esc(item.content || '')}</div>
                    <div class="ltm-affection" contenteditable="true" data-editable data-part="emotion_flow" data-idx="${index}" data-field="affection" data-npc="${npcAttr}">${esc(affection ? '好感度：' + affection : '（点击填好感度）')}</div>
                    <div class="ltm-affection" style="color:#5e7a3e;" contenteditable="true" data-editable data-part="emotion_flow" data-idx="${index}" data-field="relationship" data-npc="${npcAttr}">${esc(relationship ? '关系：' + relationship : '（点击填关系定位）')}</div>
                </div>
                <div class="ltm-item-actions">
                    <button class="ltm-btn ltm-btn-sm ltm-btn-danger" data-act="del" data-part="emotion_flow" data-idx="${index}" data-npc="${npcAttr}">删</button>
                </div>
            </div>`;
        }

        return `
        <div class="ltm-item">
            <span class="ltm-item-text" contenteditable="true" data-editable data-part="${part}" data-idx="${index}" data-npc="${npcAttr}">${esc(item)}</span>
            <div class="ltm-item-actions">
                <button class="ltm-btn ltm-btn-sm ltm-btn-danger" data-act="del" data-part="${part}" data-idx="${index}" data-npc="${npcAttr}">删</button>
            </div>
        </div>`;
    }

    function renderNpcView() {
        const agentId = getAgentId();
        if (!agentId) return '<div class="ltm-empty">尚未选择角色卡。</div>';

        const npcs = listNpcs(agentId);
        const cards = npcs.length
            ? npcs.map((n) => {
                const npcMem = getNpcMemory(agentId, n);
                const identity = npcMem?.meta?.identity || '';
                const label = identity ? `${n} · ${identity}` : n;
                return `
                <div class="ltm-char-card" data-npc="${esc(n)}">
                    <div class="ltm-char-icon"><i class="fa-solid fa-user-secret"></i></div>
                    <div class="ltm-char-name">${esc(label)}</div>
                    <button class="ltm-card-delete" data-act="del-npc" data-npc="${esc(n)}" title="删除建档"><i class="fa-solid fa-trash"></i></button>
                </div>`;
            }).join('')
            : '<div class="ltm-empty">（暂无 NPC 建档）</div>';

        return `
        <div class="ltm-view ltm-active">
            <div class="ltm-card">
                <div class="ltm-card-title">
                    <span class="ltm-title-left"><i class="fa-solid fa-user-group"></i> NPC 动态建档库</span>
                    <button class="ltm-btn ltm-btn-sm" data-act="add-npc">+ 手动建档</button>
                </div>
                <div class="ltm-grid">${cards}</div>
                <p class="ltm-hint"><i class="fa-solid fa-circle-info"></i> NPC 按「名字-身份」建档。只有对话命中 NPC 名字或身份关键词时，才会激活发送该 NPC 的简略记忆。</p>
            </div>
            <div id="ltm-npc-detail"></div>
        </div>`;
    }

    function renderOtherView() {
        const agentId = getAgentId();
        if (!agentId) return '<div class="ltm-empty">尚未选择角色卡。</div>';
        const mem = getCharacterMemory(agentId);

        const todos = mem.todos || [];
        const todoHtml = todos.length
            ? todos.map((t, i) => {
                const content = typeof t === 'string' ? t : t.content;
                const done = typeof t === 'object' && t.done;
                return `<div class="ltm-item ${done ? 'ltm-done' : ''}">
                    <span class="ltm-item-text" contenteditable="true" data-editable data-part="todos" data-idx="${i}">${esc(content)}</span>
                    <div class="ltm-item-actions">
                        ${!done ? `<button class="ltm-btn ltm-btn-sm" data-act="todo-done" data-idx="${i}">完成</button>` : ''}
                        <button class="ltm-btn ltm-btn-sm ltm-btn-danger" data-act="del" data-part="todos" data-idx="${i}">删</button>
                    </div>
                </div>`;
            }).join('')
            : '<div class="ltm-empty">（暂无待办）</div>';

        const items = mem.important_items || [];
        const itemHtml = items.length
            ? `<div class="ltm-grid">
                ${items.map((it, i) => {
                    const name = typeof it === 'string' ? it : it.name;
                    const sig = typeof it === 'object' ? it.significance : '';
                    return `<div class="ltm-item-card">
                        <button class="ltm-card-delete" data-act="del" data-part="important_items" data-idx="${i}" title="删除"><i class="fa-solid fa-trash"></i></button>
                        <div class="ltm-item-icon"><i class="fa-solid fa-gem"></i></div>
                        <div class="ltm-item-name" contenteditable="true" data-editable data-part="important_items" data-idx="${i}" data-field="name">${esc(name)}</div>
                        <div class="ltm-item-desc" contenteditable="true" data-editable data-part="important_items" data-idx="${i}" data-field="significance">${esc(sig || '（点击填写意义）')}</div>
                    </div>`;
                }).join('')}
                <div class="ltm-item-card ltm-add-card" data-act="add" data-part="important_items"><i class="fa-solid fa-plus"></i></div>
            </div>`
            : `<div class="ltm-empty">（暂无物品）</div><div class="ltm-grid"><div class="ltm-item-card ltm-add-card" data-act="add" data-part="important_items"><i class="fa-solid fa-plus"></i></div></div>`;

        return `
        <div class="ltm-view ltm-active">
            <div class="ltm-card">
                <div class="ltm-card-title">
                    <span class="ltm-title-left"><i class="fa-solid fa-list-check"></i> 待办事项 / 约定</span>
                </div>
                ${todoHtml}
                <button class="ltm-btn-add" data-act="add" data-part="todos"><i class="fa-solid fa-plus"></i> 新增事项</button>
            </div>
            <div class="ltm-card">
                <div class="ltm-card-title">
                    <span class="ltm-title-left"><i class="fa-solid fa-box-archive"></i> 重要物品库</span>
                </div>
                ${itemHtml}
            </div>
        </div>`;
    }

    function renderPromptsView() {
        const prompts = getAllPrompts();
        const items = Object.keys(prompts).map((key) => {
            const p = prompts[key];
            return `
            <div class="ltm-prompt-item" data-prompt-key="${esc(key)}">
                <div class="ltm-prompt-head">
                    <span class="ltm-prompt-name"><i class="fa-solid fa-terminal"></i> ${esc(p.name)}</span>
                    <button class="ltm-btn ltm-btn-sm ltm-btn-ghost" data-act="reset-prompt" data-key="${esc(key)}">恢复默认</button>
                </div>
                <label class="ltm-field-label">系统提示词（System）</label>
                <textarea class="ltm-textarea ltm-prompt-system" rows="6" data-key="${esc(key)}">${esc(p.system)}</textarea>
                <label class="ltm-field-label">用户指令（User）</label>
                <textarea class="ltm-textarea ltm-prompt-user" rows="2" data-key="${esc(key)}">${esc(p.user)}</textarea>
            </div>`;
        }).join('');

        return `
        <div class="ltm-view ltm-active">
            <div class="ltm-card">
                <div class="ltm-card-title">
                    <span class="ltm-title-left"><i class="fa-solid fa-terminal"></i> 提示词配置</span>
                    <button class="ltm-btn ltm-btn-sm" data-act="save-all-prompts">保存全部</button>
                </div>
                ${items}
                <p class="ltm-hint"><i class="fa-solid fa-circle-info"></i> 修改后点击「保存全部」写回服务端，对所有设备生效。支持 {{char}} {{chunk}} {{history}} {{json_schema}} 等占位符。</p>
            </div>
        </div>`;
    }

    function renderSettingsView() {
        const s = getSettings();

        return `
        <div class="ltm-view ltm-active">
            <div class="ltm-card">
                <div class="ltm-card-title"><span class="ltm-title-left"><i class="fa-solid fa-gear"></i> 插件设置</span></div>

                <div class="ltm-switch-row">
                    <span>启用长期记忆（总开关）</span>
                    <label class="ltm-switch"><input type="checkbox" data-setting="enabled" ${s.enabled ? 'checked' : ''}><span class="ltm-slider"></span></label>
                </div>
                <div class="ltm-switch-row">
                    <span>注入记忆到提示词</span>
                    <label class="ltm-switch"><input type="checkbox" data-setting="injectPrompt" ${s.injectPrompt ? 'checked' : ''}><span class="ltm-slider"></span></label>
                </div>
                <div class="ltm-switch-row">
                    <span>调试日志</span>
                    <label class="ltm-switch"><input type="checkbox" data-setting="debug" ${s.debug ? 'checked' : ''}><span class="ltm-slider"></span></label>
                </div>

                <label class="ltm-field-label">总结触发阈值（楼层数）</label>
                <input type="number" class="ltm-input" data-setting="summaryThreshold" value="${s.summaryThreshold}" min="5">
                <p class="ltm-hint" style="margin-top:6px;"><i class="fa-solid fa-circle-info"></i> 建议填写 10-50</p>

                <label class="ltm-field-label">保留最近活跃楼层数</label>
                <input type="number" class="ltm-input" data-setting="keepActiveFloors" value="${s.keepActiveFloors}" min="1">

                <label class="ltm-field-label">待办检查频率（每 N 轮）</label>
                <input type="number" class="ltm-input" data-setting="todoCheckInterval" value="${s.todoCheckInterval}" min="1">

                <label class="ltm-field-label">分批次总结大小（每批楼层数）</label>
                <input type="number" class="ltm-input" data-setting="batchSize" value="${s.batchSize}" min="10">
            </div>

            <div class="ltm-card">
                <div class="ltm-card-title"><span class="ltm-title-left"><i class="fa-solid fa-wand-magic-sparkles"></i> 一键总结</span></div>
                <p class="ltm-hint"><i class="fa-solid fa-circle-info"></i> 立即总结当前角色的对话，提炼关键事件（含关键词/情绪）、日记、情感流转等，并写入记忆库。超过 50 层会自动分批次总结。</p>
                <label class="ltm-field-label">自定义总结范围（楼层区间，可选）</label>
                <div class="ltm-range-row">
                    <input type="number" class="ltm-input" data-setting="summaryStartFloor" value="${esc(String(s.summaryStartFloor ?? ''))}" min="1" placeholder="起始楼层，如 26">
                    <span class="ltm-range-sep">~</span>
                    <input type="number" class="ltm-input" data-setting="summaryEndFloor" value="${esc(String(s.summaryEndFloor ?? ''))}" min="1" placeholder="结束楼层，如 48">
                </div>
                <p class="ltm-hint" style="margin-top:6px;"><i class="fa-solid fa-circle-info"></i> 留空则总结全部楼层；填写区间（如 26~48）则只总结对应楼层。当前共 ${esc(String((getSTContext()?.chat || []).length))} 层。</p>
                <button class="ltm-btn" data-act="summarize-now" style="width:100%;padding:12px;">
                    <i class="fa-solid fa-bolt"></i> 立即总结
                </button>
                <p class="ltm-hint" id="ltm-summarize-status" style="display:none;margin-top:10px;"></p>
            </div>

            <div class="ltm-card">
                <div class="ltm-card-title"><span class="ltm-title-left"><i class="fa-solid fa-palette"></i> 主题换肤</span></div>
                <p class="ltm-hint" style="margin-top:0;"><i class="fa-solid fa-circle-info"></i> 点击圆形色块切换面板主题色。</p>
                ${Object.keys(THEMES).map((key) => {
                    const t = THEMES[key];
                    const active = (s.theme || 'default') === key ? 'ltm-active' : '';
                    return `
                    <div class="ltm-theme-row">
                        <div class="ltm-theme-dot ${active}" data-act="set-theme" data-theme="${key}" title="${esc(t.name)}" style="background:linear-gradient(135deg,${t.accent},${t.bg});"></div>
                        <span class="ltm-theme-name">${esc(t.name)}</span>
                    </div>`;
                }).join('')}
            </div>

            <div class="ltm-card">
                <div class="ltm-card-title"><span class="ltm-title-left"><i class="fa-solid fa-database"></i> 记忆备份</span></div>
                <p class="ltm-hint" style="margin-top:0;"><i class="fa-solid fa-circle-info"></i> 一键导出当前角色的完整记忆为 JSON，或将之前导出的 JSON 重新导入。分区归属正确、不乱码、不串台。</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="ltm-btn" data-act="export-memory" style="flex:1;"><i class="fa-solid fa-download"></i> 导出记忆</button>
                    <button class="ltm-btn ltm-btn-ghost" data-act="import-memory" style="flex:1;"><i class="fa-solid fa-upload"></i> 导入记忆</button>
                </div>
            </div>

            <div class="ltm-card">
                <div class="ltm-card-title"><span class="ltm-title-left"><i class="fa-solid fa-plug"></i> 独立 API（可选）</span></div>
                <p class="ltm-hint"><i class="fa-solid fa-circle-info"></i> 默认复用酒馆主模型，无需配置。如需用独立的 API 专门做总结，可在此开启并填写。</p>

                <div class="ltm-switch-row">
                    <span>启用独立 API</span>
                    <label class="ltm-switch"><input type="checkbox" data-setting="externalApiEnabled" ${s.externalApiEnabled ? 'checked' : ''}><span class="ltm-slider"></span></label>
                </div>

                <label class="ltm-field-label">API 地址（完整 URL）</label>
                <input type="text" class="ltm-input" data-setting="externalApiUrl" value="${esc(s.externalApiUrl || '')}" placeholder="https://api.openai.com/v1/chat/completions">

                <label class="ltm-field-label">API Key</label>
                <input type="password" class="ltm-input" data-setting="externalApiKey" value="${esc(s.externalApiKey || '')}" placeholder="sk-...">

                <label class="ltm-field-label">模型名称</label>
                <div class="ltm-model-row">
                    <input type="text" class="ltm-input" id="ltm-external-model-input" data-setting="externalApiModel" value="${esc(s.externalApiModel || '')}" placeholder="gpt-4o-mini 或 claude-3-5-sonnet 等">
                    <button class="ltm-btn ltm-btn-ghost" data-act="fetch-models"><i class="fa-solid fa-cloud-arrow-down"></i> 拉取模型</button>
                </div>
                <select class="ltm-input" id="ltm-external-model-select" style="margin-top:6px;display:none;"></select>
                <p class="ltm-hint" id="ltm-model-status" style="display:none;"></p>
            </div>

            <div class="ltm-card">
                <p class="ltm-hint" style="margin:0;"><i class="fa-solid fa-shield-halved"></i> 所有记忆数据自动落盘到酒馆服务端（data/ 目录），本地与云酒馆通用，换设备、清缓存均不丢失。</p>
            </div>
        </div>`;
    }

    function renderNpcDetail(npcName) {
        return `
        <div class="ltm-card">
            <div class="ltm-card-title">
                <span class="ltm-title-left"><i class="fa-solid fa-id-card"></i> 「${esc(npcName)}」独立档案</span>
            </div>
            ${renderPartitionTabs()}
            <div id="ltm-part-content"></div>
        </div>`;
    }

    function renderPartContentOnly() {
        const agentId = getAgentId();
        if (!agentId) return;
        const container = document.getElementById('ltm-part-content');
        if (container) {
            container.innerHTML = renderPartitionContent(agentId, currentNpc);
        } else {
            // 兜底：「其他」页（待办/重要物品）等视图没有 #ltm-part-content 容器，
            // 之前在这里静默返回，导致增删后界面毫无反应、必须切页才能看到更新。
            // renderCurrentView 按 currentView 原地重渲当前界面，不会跳转到别的视图。
            renderCurrentView();
        }
    }

    function bindViewEvents() {
        const body = document.getElementById('ltm-drawer-body');
        if (!body || body.dataset.bound) return;
        body.dataset.bound = '1';

        body.addEventListener('click', handleClick);
        body.addEventListener('change', handleChange);
        // 实时保存文本类设置（API 地址/Key/模型名），避免「改完未失焦」导致旧值仍被调用
        body.addEventListener('input', handleInput);
        body.addEventListener('focusout', handleBlur);
    }

    // 输入即保存：对 text/password 类型的设置项，实时写回 settings，杜绝缓存/未生效问题
    function handleInput(e) {
        const el = e.target;
        if (!el.matches('[data-setting]')) return;
        const key = el.dataset.setting;
        if (el.type === 'password' || el.type === 'text') {
            setSetting(key, el.value);
        }
    }

    function handleClick(e) {
        const agentId = getAgentId();
        const btn = e.target.closest('[data-act]');
        if (btn) {
            const act = btn.dataset.act;
            const part = btn.dataset.part;
            const idx = parseInt(btn.dataset.idx, 10);
            // 关键：操作目标一律以按钮上的 data-npc 为准（渲染时已绑定盖章）。
            // 空串/缺失 = 主角色记忆，非空 = 对应 NPC 专属分区。
            // 不再依赖 currentNpc 交叉判断，杜绝残留状态导致 NPC 条目误写进主角色库。
            const npc = btn.dataset.npc || null;
            const npcName = npc;

            switch (act) {
                case 'del':
                    removePartitionItem(agentId, part, idx, npcName);
                    // 只局部刷新当前分区内容，保持停留在当前编辑界面，不跳回主界面
                    renderPartContentOnly();
                    break;
                case 'todo-done':
                    markTodoDone(agentId, idx, npcName);
                    renderPartContentOnly();
                    break;
                case 'clear-all':
                    if (confirm(`确定清空「${getCharName()}」的全部记忆吗？此操作不可恢复。`)) {
                        clearMemory(agentId);
                        renderCurrentView();
                    }
                    break;
                case 'del-npc':
                    if (confirm(`确定删除 NPC「${npc}」的独立记忆库吗？`)) {
                        removeNpc(agentId, npc);
                        renderCurrentView();
                    }
                    break;
                case 'add-npc': {
                    const name = prompt('请输入 NPC 名字与身份，格式「名字-身份」，例如「张三-客栈掌柜」：');
                    if (name && name.trim()) {
                        const raw = name.trim();
                        // 解析「名字-身份」：用第一个分隔符拆开
                        const sepIdx = raw.search(/[-—–_·]/);
                        let npcName = raw;
                        let identity = '';
                        if (sepIdx > 0) {
                            npcName = raw.slice(0, sepIdx).trim();
                            identity = raw.slice(sepIdx + 1).trim();
                        }
                        ensureNpcMemory(agentId, npcName, identity);
                        renderCurrentView();
                    }
                    break;
                }
                case 'add': {
                    // 关键修复：必须把 npcName 传给 addToPartition，
                    // 否则在 NPC 详情里手动添加的条目会全部写进主角色（char）记忆库。
                    if (part === 'important_items') {
                        addToPartition(agentId, part, { name: '新物品', significance: '物品描述……' }, npcName);
                    } else if (part === 'emotional_tags') {
                        addToPartition(agentId, part, '新标签', npcName);
                    } else if (part === 'todos') {
                        addToPartition(agentId, part, { content: '新的待办事项', done: false }, npcName);
                    } else if (part === 'key_events') {
                        addToPartition(agentId, part, { date: '', content: '新事件', keywords: [], emotions: [] }, npcName);
                    } else if (part === 'character_diary') {
                        addToPartition(agentId, part, { date: '', content: '新日记' }, npcName);
                    } else if (part === 'emotion_flow') {
                        addToPartition(agentId, part, { content: '新情感流转', affection: '' }, npcName);
                    } else {
                        addToPartition(agentId, part, '新条目', npcName);
                    }
                    // 只局部刷新当前分区内容，保持停留在当前编辑界面，绝不跳转
                    renderPartContentOnly();
                    break;
                }
                case 'reset-prompt': {
                    resetPrompt(btn.dataset.key);
                    renderCurrentView();
                    break;
                }
                case 'save-all-prompts': {
                    saveAllPrompts();
                    renderCurrentView();
                    break;
                }
                case 'summarize-now': {
                    if (!agentId) {
                        showToast('请先选择角色卡');
                        break;
                    }
                    manualSummarizeAll(agentId);
                    break;
                }
                case 'fetch-models': {
                    handleFetchModels();
                    break;
                }
                case 'set-theme': {
                    applyTheme(btn.dataset.theme);
                    renderCurrentView();
                    break;
                }
                case 'export-memory': {
                    exportMemory();
                    break;
                }
                case 'import-memory': {
                    triggerImport();
                    break;
                }
            }
            return;
        }

        const pill = e.target.closest('[data-part].ltm-pill');
        if (pill) {
            currentPart = pill.dataset.part;
            document.querySelectorAll('#ltm-drawer-body .ltm-pill[data-part]').forEach((p) => {
                p.classList.toggle('ltm-active', p.dataset.part === currentPart);
            });
            renderPartContentOnly();
            return;
        }

        const charCard = e.target.closest('.ltm-char-card[data-char]');
        if (charCard) {
            const name = charCard.dataset.char;
            const detail = document.getElementById('ltm-memory-detail');
            if (detail) {
                detail.innerHTML = renderMemoryDetail(agentId, name);
                renderPartContentOnly();
            }
            return;
        }

        const npcCard = e.target.closest('.ltm-char-card[data-npc]');
        if (npcCard && !e.target.closest('[data-act]')) {
            const name = npcCard.dataset.npc;
            currentNpc = name;
            currentPart = 'key_events';
            const detail = document.getElementById('ltm-npc-detail');
            if (detail) {
                detail.innerHTML = renderNpcDetail(name);
                renderPartContentOnly();
            }
            return;
        }
    }

    function handleChange(e) {
        const el = e.target;
        if (el.matches('[data-setting]')) {
            const key = el.dataset.setting;
            if (el.type === 'checkbox') {
                setSetting(key, el.checked);
            } else if (el.type === 'password' || el.type === 'text') {
                // 文本类设置（API 地址/Key/模型名）
                setSetting(key, el.value);
            } else if (key === 'summaryStartFloor' || key === 'summaryEndFloor') {
                // 自定义总结区间：保留字符串，允许留空（留空 = 总结全部楼层）
                setSetting(key, el.value.trim());
            } else if (el.dataset.value !== undefined) {
                setSetting(key, parseInt(el.dataset.value, 10) || 0);
            } else {
                setSetting(key, parseInt(el.value, 10) || 0);
            }
        }
    }

    async function handleFetchModels() {
        const statusEl = document.getElementById('ltm-model-status');
        const selectEl = document.getElementById('ltm-external-model-select');
        const inputEl = document.getElementById('ltm-external-model-input');
        const setStatus = (msg, isErr = false) => {
            if (statusEl) {
                statusEl.style.display = 'block';
                statusEl.style.color = isErr ? '#b23a2a' : '#5e7a3e';
                statusEl.innerHTML = msg;
            }
        };

        setStatus('<i class="fa-solid fa-spinner fa-spin"></i> 正在拉取模型列表……');

        try {
            const models = await fetchExternalModels();
            if (!models || !models.length) {
                setStatus('<i class="fa-solid fa-triangle-exclamation"></i> 未获取到模型，请检查 API 地址与 Key。', true);
                toastr?.warning?.('记忆宫殿：未获取到模型列表');
                return;
            }

            // 填充下拉框
            if (selectEl) {
                selectEl.innerHTML = '<option value="">— 选择模型 —</option>' + models.map((m) => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
                selectEl.style.display = 'block';
                selectEl.onchange = () => {
                    if (selectEl.value && inputEl) {
                        inputEl.value = selectEl.value;
                        setSetting('externalApiModel', selectEl.value);
                    }
                };
            }

            setStatus(`<i class="fa-solid fa-circle-check"></i> 共拉取到 ${models.length} 个模型，请在下拉框选择。`);
            toastr?.success?.(`记忆宫殿：拉取到 ${models.length} 个模型`);
        } catch (err) {
            console.warn('[记忆宫殿] 拉取模型失败：', err);
            setStatus(`<i class="fa-solid fa-triangle-exclamation"></i> 拉取失败：${err?.message || '请检查 API 地址与 Key'}。`, true);
            toastr?.error?.('记忆宫殿：拉取模型失败，' + (err?.message || '请检查 API 地址与 Key'));
        }
    }

    function handleBlur(e) {
        const el = e.target;
        if (!el.matches('[data-editable]')) return;
        const agentId = getAgentId();
        if (!agentId) return;

        const part = el.dataset.part;
        const idx = parseInt(el.dataset.idx, 10);
        const field = el.dataset.field || null;
        // 与 handleClick 保持一致：以元素上的 data-npc 为准（渲染时已绑定盖章）
        const npcName = el.dataset.npc || null;

        const mem = npcName ? getNpcMemory(agentId, npcName) : getCharacterMemory(agentId);
        const arr = mem?.[part];
        if (!arr || idx < 0 || idx >= arr.length) return;

        const newText = el.innerText.trim();

        if (field === 'name' || field === 'significance') {
            let item = arr[idx];
            if (typeof item === 'string') item = { name: item, significance: '' };
            item[field] = newText;
            updatePartitionItem(agentId, part, idx, item, npcName);
        } else if (field === 'keywords' || field === 'emotions') {
            // 逗号/顿号分隔的词 → 数组
            let item = arr[idx];
            if (typeof item === 'string') item = { content: item, keywords: [], emotions: [] };
            item[field] = newText
                ? newText.split(/[,，、]/).map((s) => s.trim()).filter(Boolean)
                : [];
            updatePartitionItem(agentId, part, idx, item, npcName);
        } else if (field === 'date' || field === 'content') {
            // 日期/内容字段：保留原对象结构（key_events / diary / emotion_flow 通用）
            let item = arr[idx];
            if (typeof item === 'string') {
                item = { content: item, date: '', keywords: [], emotions: [], affection: '', relationship: '' };
            }
            item[field] = newText;
            updatePartitionItem(agentId, part, idx, item, npcName);
        } else if (field === 'affection' || field === 'relationship') {
            let item = arr[idx];
            if (typeof item === 'string') item = { content: item, date: '', affection: '', relationship: '' };
            item[field] = newText;
            updatePartitionItem(agentId, part, idx, item, npcName);
        } else if (typeof arr[idx] === 'string' && field === null) {
            updatePartitionItem(agentId, part, idx, newText, npcName);
        } else if (typeof arr[idx] === 'object' && !field) {
            arr[idx].content = newText;
            updatePartitionItem(agentId, part, idx, arr[idx], npcName);
        }
    }

    function saveAllPrompts() {
        const items = document.querySelectorAll('#ltm-drawer-body .ltm-prompt-item');
        items.forEach((item) => {
            const key = item.dataset.promptKey;
            const system = item.querySelector('.ltm-prompt-system').value;
            const user = item.querySelector('.ltm-prompt-user').value;
            const nameEl = item.querySelector('.ltm-prompt-name');
            const name = nameEl ? nameEl.textContent.replace(/^\s*[^\s]+\s*/, '').trim() : '';
            savePrompt(key, { name, system, user });
        });
        showToast('提示词已保存到服务端');
    }

    function showToast(msg) {
        let t = document.getElementById('ltm-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'ltm-toast';
            t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(94,16,16,0.95);color:#f6f1e6;padding:10px 20px;border-radius:8px;z-index:40000;font-size:0.85rem;transition:opacity 0.3s;';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.opacity = '1';
        clearTimeout(t._timer);
        t._timer = setTimeout(() => { t.style.opacity = '0'; }, 1800);
    }

    // =============================================================
    // 插件入口（事件绑定 + 注入逻辑）
    // =============================================================
    let pendingInjection = '';

    async function onMessageSent() {
        const settings = getSettings();
        if (!settings.enabled) return;
        const agentId = getAgentId();
        if (!agentId) return;

        const context = getSTContext();
        const chat = context?.chat || [];
        const lastUser = [...chat].reverse().find((m) => m.is_user);
        if (!lastUser) return;

        try {
            pendingInjection = await processUserMessage(String(lastUser.mes));
            log('注入提示词已就绪，长度：', pendingInjection.length);
        } catch (err) {
            console.warn('[LTM] 记忆处理失败：', err);
            pendingInjection = '';
        }
    }

    function injectPrompt(eventData) {
        const settings = getSettings();
        if (!settings.enabled || !settings.injectPrompt) return;
        if (!pendingInjection) return;

        const injection = pendingInjection;
        pendingInjection = '';

        const chat = eventData?.chat;
        if (!Array.isArray(chat)) return;

        chat.push({
            role: 'system',
            content: injection,
            is_system: true,
            force_avatar: false,
        });
    }

    function buildSettingsHtml() {
        const s = getSettings();
        return `
        <div class="ltm-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>记忆宫殿插件</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
                </div>
                <div class="inline-drawer-content">
                    <label class="checkbox_label">
                        <input type="checkbox" id="ltm_enabled" ${s.enabled ? 'checked' : ''}>
                        启用长期记忆（总开关）
                    </label>
                    <label class="checkbox_label">
                        <input type="checkbox" id="ltm_inject" ${s.injectPrompt ? 'checked' : ''}>
                        注入记忆到提示词
                    </label>
                    <label>总结触发阈值（楼层数）
                        <input type="number" id="ltm_threshold" class="text_pole" min="5" value="${s.summaryThreshold}">
                    </label>
                    <label>保留最近活跃楼层数
                        <input type="number" id="ltm_keep" class="text_pole" min="1" value="${s.keepActiveFloors}">
                    </label>
                    <label>待办检查频率（每 N 轮）
                        <input type="number" id="ltm_todo" class="text_pole" min="1" value="${s.todoCheckInterval}">
                    </label>
                    <label class="checkbox_label">
                        <input type="checkbox" id="ltm_debug" ${s.debug ? 'checked' : ''}>
                        调试日志
                    </label>
                    <div class="ltm-hint">
                        记忆数据自动保存到酒馆服务端，本地/云酒馆通用，无需本地存储。
                    </div>
                </div>
            </div>
        </div>`;
    }

    function bindSettingsEvents() {
        $('#ltm_enabled').on('change', function () { setSetting('enabled', this.checked); });
        $('#ltm_inject').on('change', function () { setSetting('injectPrompt', this.checked); });
        $('#ltm_threshold').on('input', function () { setSetting('summaryThreshold', parseInt(this.value) || 25); });
        $('#ltm_keep').on('input', function () { setSetting('keepActiveFloors', parseInt(this.value) || 5); });
        $('#ltm_todo').on('input', function () { setSetting('todoCheckInterval', parseInt(this.value) || 10); });
        $('#ltm_debug').on('change', function () { setSetting('debug', this.checked); });
    }

    function init() {
        getSettings();
        // 应用已保存的主题配色
        applyTheme(getSettings().theme);

        const context = getSTContext();
        const eventSource = context?.eventSource;
        const event_types = context?.event_types;

        // 设置面板
        if (typeof jQuery !== 'undefined' && typeof $('#extensions_settings') !== 'undefined') {
            $('#extensions_settings').append(buildSettingsHtml());
            bindSettingsEvents();
        }

        // 悬浮球管理面板
        mountPanelShell();

        // 事件绑定
        if (eventSource && event_types?.MESSAGE_SENT) {
            eventSource.on(event_types.MESSAGE_SENT, onMessageSent);
        }
        if (eventSource && event_types?.CHAT_COMPLETION_PROMPT_READY) {
            eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, injectPrompt);
        }
        if (eventSource && event_types?.CHAT_CHANGED) {
            // 切换聊天（含新对话/分支）时：重置编辑状态并刷新面板。
            // 记忆存储键已绑定 chatId，切换后自动指向独立存档。
            eventSource.on(event_types.CHAT_CHANGED, () => {
                currentNpc = null;
                currentPart = 'key_events';
                pendingInjection = '';
                renderCurrentView();
            });
        }
        // 新消息落库后（AI 回复完成）再次检查自动总结阈值，更可靠地触发
        if (eventSource && event_types?.MESSAGE_RECEIVED) {
            eventSource.on(event_types.MESSAGE_RECEIVED, () => {
                maybeAutoSummarize();
            });
        }

        console.log('[记忆宫殿] 插件已加载（纯前端方案，服务端持久化，按聊天 ID 隔离存档）');
    }

    // ---------------------------------------------------------------------
    // 启动：SillyTavern 插件加载完成后 jQuery ready 时执行
    // ---------------------------------------------------------------------
    if (typeof jQuery !== 'undefined') {
        jQuery(init);
    } else {
        // 极端情况兜底：DOM 就绪后执行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

    // 暴露到全局，便于调试
    global.LTM = {
        PLUGIN_ID,
        PARTITIONS,
        getContext: getSTContext,
        getSettings,
        setSetting,
        getAgentId,
        getCharName,
        getCharacterMemory,
        getPartition,
        addToPartition,
        updatePartitionItem,
        removePartitionItem,
        clearMemory,
        markTodoDone,
        ensureNpcMemory,
        listNpcs,
        removeNpc,
        getNpcMemory,
        getAllPrompts,
        savePrompt,
        resetPrompt,
        processUserMessage,
        manualSummarizeAll,
        doFullSummarize,
        summarizeInBatches,
        applySummaryData,
        retrieveRelevantEvents,
        buildInjectionPrompt,
        retrieveRelevantDiary,
        generateViaExternalApi,
        fetchExternalModels,
        hideFloorsExceptRecent,
        markFlowInjectionPending,
        exportMemory,
        importMemory,
        triggerImport,
        applyTheme,
        getTheme,
        THEMES,
        collectMainCharacterNames,
        isMainCharacter,
        refreshPanel: renderCurrentView,
    };
})(typeof window !== 'undefined' ? window : globalThis);

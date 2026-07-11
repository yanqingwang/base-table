

---

# nf-vaultgen 测试 Vault 生成器规范

> 版本：v1.0-draft | 隶属：NoteForge 需求设计文档 附录 A
> 定位：`crates/nf-vaultgen`（独立 crate + CLI，**不得依赖** nf-markdown / nf-index 等被测 crate）

---

## 1. 目标与非目标

### 1.1 目标

1. **可复现**：给定 `(生成器版本, profile, seed)` 三元组，在三平台生成**字节级完全一致**的 Vault
2. **带真值**：每次生成同时输出 Ground Truth Manifest，包含全部链接/标签/标题/位置的预期值，供正确性断言
3. **可伸缩**：覆盖从 50 文件冒烟测试到 100k 文件压力测试的全部规模档位
4. **场景化**：为主文档中每条依赖数据集的 AC/NFR 提供专用 profile（见 §9 追溯矩阵）
5. **可演化**：支持"变更模拟"（churn），为文件监听、冲突处理、崩溃安全测试提供外部驱动

### 1.2 非目标

- 不生成 CommonMark spec 合规测试用例（直接使用官方测试集，见 AC-MD-01）
- 不做真实用户 Vault 的匿名化采样（V2 可考虑）
- 不负责在被测应用内执行操作（那是 e2e 框架的职责，本工具只扮演"外部世界"）

---

## 2. 总体设计

### 2.1 组件

```
nf-vaultgen/
├── src/
│   ├── ir.rs          # 文档中间表示（元素级 IR）
│   ├── corpus/        # 内嵌词库（中文/英文词频表、句式模板）
│   ├── topology.rs    # 链接图拓扑生成（BA 优先连接模型等）
│   ├── serialize.rs   # IR → Markdown 字节序列化（同时记录 span）
│   ├── manifest.rs    # Ground Truth 输出
│   ├── profiles/      # 内置 profile 定义（TOML，编译期嵌入）
│   ├── churn.rs       # 变更模拟驱动
│   └── verify.rs      # 自校验
└── fixtures/edge-corpus/   # 手工构造的边界用例（版本化提交到仓库）
```

### 2.2 生成流水线

```
seed ──► PRNG(ChaCha20) ──► ① 目录结构与文件名规划
                            ② 每文件分配原型(archetype)与目标大小
                            ③ 全局链接拓扑生成（图先行）
                            ④ 逐文件构造 IR（把拓扑分配的链接嵌入内容）
                            ⑤ 序列化为字节流（记录每个元素的 byte span）
                            ⑥ 写盘（可配置 LF/CRLF/BOM）
                            ⑦ 输出 Manifest（含全 Vault 校验和）
```

**关键规则**：

- R-01：随机源必须使用种子化的 `ChaCha20Rng`，禁止 `thread_rng()`、系统时间、HashMap 迭代序等不确定源
- R-02：文件遍历/写入顺序按路径字典序排序，保证跨平台一致
- R-03：链接拓扑在内容生成**之前**确定（"图先行"），保证图结构指标可精确控制
- R-04：序列化器是唯一产生字节的地方，span 在此处记录，**保证 manifest 中的 offset 可通过直接切片文件字节验证**
- R-05：生成器自身版本号写入 manifest；生成逻辑任何变更必须升版本

---

## 3. 内容生成模型

### 3.1 笔记原型（Archetype）

真实 Vault 不是均匀的。按比例混合五种原型（各 profile 可调）：

| 原型 | 默认占比 | 特征 |
|------|---------|------|
| `zettel` 卡片 | 55% | 1-5KB，2-8 个出链，1-3 个标签，有 frontmatter |
| `moc` 枢纽/索引 | 5% | 以链接列表为主体，20-100 个出链（图中的 hub 节点） |
| `journal` 日记 | 15% | 文件名为日期格式 `YYYY-MM-DD.md`，任务列表密集，链接较少 |
| `literature` 文献 | 15% | 较长（5-20KB），引用块、脚注、代码块密集，frontmatter 字段丰富 |
| `stub` 占位 | 10% | < 200B 或空文件，无链接（孤儿节点候选） |

### 3.2 文本语料

- 内嵌词库：中文常用词表（≥ 20,000 词，带词频）+ 英文词表（≥ 10,000 词），编译期嵌入，**无网络依赖**
- 句子生成：基于句式模板 + Zipf 采样填词，保证生成文本对分词器"看起来像自然语言"（连续汉字、正常标点分布）
- 中英混排比例可配置（默认中文 70% / 英文 25% / emoji 与符号 5%）
- **禁止**使用会全网重复的固定 lorem ipsum，防止全文搜索测试因海量重复文档退化

### 3.3 Markdown 元素分布（每千行期望密度，statistical 模式）

| 元素 | 密度 | 备注 |
|------|------|------|
| 标题 H1-H6 | 40（层级递减分布） | 标题文本入 manifest，供 `[[笔记#标题]]` 解析验证 |
| 无序/有序列表 | 120 行 | 嵌套深度几何分布，p=0.35，最大 6 层 |
| 任务列表 | 30 行 | 完成率 ~40% |
| 代码块 | 8 个 | 语言标签从 30 种语言轮转；内容含 Markdown 语法干扰片段（验证解析器不误判） |
| 表格 | 4 个 | 2-8 列，含对齐标记 |
| Callout | 6 个 | 覆盖全部 13 种类型 + 可折叠变体，允许嵌套 1 层 |
| 数学公式 | 5（行内）+ 2（块级） | 从固定公式池采样 |
| 脚注 | 3 组 | |
| `%%注释%%` | 2 个 | |
| `==高亮==` | 4 个 | |
| 引用块 | 15 行 | |
| 水平线 | 1 个 | |
| 块 ID `^xxxxxx` | 3 个 | 全 Vault 唯一，入 manifest 供块引用解析验证 |

### 3.4 文件大小分布

- 对数正态分布：中位数 2.5KB，σ 使 P95 ≈ 12KB，长尾截断于 100KB
- 校准约束：standard-10k profile 全 Vault 均值 3KB ± 5%（对齐 NFR 基准定义）

### 3.5 目录结构

- 深度分布：根目录 15%，1 层 35%，2 层 30%，3 层 15%，4-6 层 5%
- 目录名混合：英文（`Projects/`）、中文（`领域笔记/`）、带空格（`Reading Notes/`）
- 附件集中目录 `assets/` + 部分就近存放（两种用户习惯都覆盖）

### 3.6 文件名生成

默认档位（所有 profile 通用）：

- 中文名 40%、英文名 40%、中英混合 15%、含日期格式 5%
- 必含字符类型：空格、连字符、下划线、圆括号、中文标点（全角括号）
- **平台安全**：默认规避 Windows 保留名（CON/PRN/AUX…）、`<>:"/\|?*`、结尾句点/空格；路径总长 < 240 字节

激进档位（仅 `unicode-hell` profile，见 §5）额外包含 NFC/NFD 变体、emoji 文件名、RTL 字符等。

### 3.7 Frontmatter

- 覆盖率 60%（可配）；字段池：`tags`（与行内标签共享标签池）、`aliases`（0-3 个，供 AC-EDIT-05 别名补全验证）、`created`/`modified` 日期、`cssclasses`、自定义字段（字符串/数字/布尔/列表/嵌套 map 各类型至少覆盖）
- 全部值入 manifest（结构化 JSON）

### 3.8 标签

- 标签池大小 = 笔记数 × 0.05（10k Vault ≈ 500 个标签）
- 频次服从 Zipf(s=1.1)；嵌套标签占 30%，最大 3 层（`#领域/AI/NLP`）
- 每文件标签数服从 Poisson(λ=2)，行内与 frontmatter 三七分

### 3.9 附件

- 数量 = 笔记数 × 0.15；类型：PNG 70%（程序化生成的有效图片，尺寸 100×100 至 1920×1080）、JPEG 15%、PDF 10%（最小有效 PDF）、MP3 5%（有效头 + 静音数据）
- 大小分布：4KB - 2MB；每个附件至少被一个 `![[...]]` 引用（另保留 5% 孤儿附件，供"未引用附件"功能测试）

---

## 4. 链接拓扑规范

### 4.1 图模型

- 基础拓扑：**Barabási–Albert 优先连接**变体，产生幂律度分布（少数 hub + 大量低度节点），符合真实知识库形态
- moc 原型强制为高出度节点；stub 原型为孤儿候选

### 4.2 可控参数（statistical 模式默认值）

| 参数 | 默认 | 说明 |
|------|------|------|
| `links.total` | 笔记数 × 5 | 总出链数（standard-10k = 50,000，对齐 NFR） |
| `links.orphan_ratio` | 10% | 无入链且无出链的笔记比例 |
| `links.broken_ratio` | 2% | 指向不存在文件的链接（供 FR-404 断链测试） |
| `links.bidirectional_pairs` | 笔记数 × 0.3 | 互链对数量（反链面板测试素材） |
| `links.self_loop` | 5 个（固定） | 自引用边界用例 |

### 4.3 链接形态分布

| 形态 | 占比 | 备注 |
|------|------|------|
| `[[目标]]` | 55% | |
| `[[目标\|别名]]` | 15% | |
| `[[目标#标题]]` | 10% | 目标标题必须真实存在（从目标文件 IR 中选取），另设 1% 指向不存在标题的负例 |
| `[[目标#^块ID]]` | 5% | 同上，块 ID 真实存在 + 负例 |
| `![[目标]]` 嵌入 | 8% | 嵌入深度受控 ≤ 3（循环嵌入仅在 edge-corpus 出现） |
| 标准 MD 链接 `[文](路径.md)` | 5% | 含相对路径 `../` 形态 |
| 裸 URL / 外部链接 | 2% | 不计入内部图 |

**路径歧义用例**：每个 Vault 固定注入 10 组同名文件（不同目录下的 `同名笔记.md`），并生成短形态 `[[同名笔记]]` 与全路径形态两种引用——manifest 中记录**按 Obsidian 最短路径规则**的预期解析结果，验证链接解析器歧义处理。

---

## 5. 内置 Profile 定义

| Profile | 规模 | 模式 | 用途（追溯见 §9） |
|---------|------|------|------|
| `smoke` | 50 笔记 / 10 附件 | exact | CI 快速回归、开发自测 |
| `standard-10k` | 10,000 笔记 / 50,000 链接 / 1,500 附件，均值 3KB | statistical | NFR-01/03/04/06/07 基准官方数据集 |
| `large-100k` | 100,000 笔记 / 500,000 链接 | statistical | NFR-05 内存、索引伸缩性 |
| `graph-bench` | **恰好** 10,000 节点 / 30,000 边，连通 | exact | AC-GRAPH-01 |
| `bigfile` | 4 个文件：1MB / 5MB / 10MB / 5MB纯中文 | exact | P0-3、AC-EDIT-04、NFR-08（内容为真实元素混合，非重复行填充） |
| `rename-sync` | 101 文件：1 个目标 + 100 个引用方，**恰好** 500 处引用，覆盖全部 7 种链接形态 + frontmatter alias 引用 | exact | AC-LINK-01 |
| `search-oracle` | 2,000 笔记 + 种植词条 | exact | AC-SEARCH-01/03（详见 §7） |
| `edge-corpus` | ~200 个手工文件（版本化提交，非生成） | fixture | 解析器边界（详见 §6） |
| `unicode-hell` | 500 笔记 | exact | 文件名/内容 Unicode 压力（NFC/NFD 各半、emoji 文件名、RTL 文本、零宽字符、组合变音符） |
| `deep-nest` | 100 笔记 | exact | 解析器栈安全：列表嵌套 64 层、引用嵌套 32 层、callout 嵌套 16 层、10,000 连续 `*` 等病理输入，**要求不崩溃不超时** |
| `churn-base` | 1,000 笔记 | statistical | §8 变更模拟的基底 Vault |

**exact 模式**：所有计数精确命中，manifest 给出绝对断言值。
**statistical 模式**：目标值 ±2% 容差，manifest 给出实际生成的精确值（测试断言用 manifest 值而非目标值）。

---

## 6. edge-corpus 固定用例清单（手工构造，仓库版本化）

每个文件配一个同名 `.expected.json`（预期解析结果或预期行为标注）：

| 分组 | 用例 |
|------|------|
| **编码与换行** | UTF-8 BOM 文件；CRLF 文件；LF/CRLF 混合单文件；无末尾换行；仅含 `\n` 的空文件；0 字节文件 |
| **Frontmatter 病理** | 非法 YAML（缩进错误/未闭合引号）；仅有 frontmatter 无正文；正文中出现第二个 `---` 块；frontmatter 前有空行（应不识别为 FM）；超长 FM（10,000 行） |
| **链接病理** | `[[]]` 空链接；`[[a|b|c]]` 多管道；`[[目标|]]` 空别名；未闭合 `[[目标`；链接内含 `#` `^` `|` 转义组合；跨行 wikilink（应不解析） |
| **循环嵌入** | A↔B 直接循环；A→B→C→A 三级循环；自嵌入 `![[自己]]`（AC-MD-04） |
| **Unicode** | NFC 与 NFD 编码的同名链接与文件（验证归一化匹配策略）；零宽连接符嵌入词中；RTL 混排段落；代理对边界处的 span 验证 |
| **大小写碰撞** | `Note.md` 与 `note.md` 的链接解析（**此用例默认不落盘**为两个文件——case-insensitive 文件系统无法共存——而是提供单文件 + 两种大小写链接，验证解析策略） |
| **语法干扰** | 代码块内的 `[[伪链接]]` 与 `#伪标签`（不应索引）；行内代码中的 `**`；数学公式内的 `_` 与 `#`；HTML 注释中的 wikilink |
| **标签边界** | `#123` 纯数字（Obsidian 规则：非法）；`#tag。`中文标点截断；行首 `#` 与标题歧义；`#a/b/c/d/e` 超深嵌套 |
| **块 ID 边界** | 重复块 ID（同文件/跨文件）；块 ID 后有尾随空格；列表项与表格上的块 ID |

`.expected.json` 是解析器测试的断言来源，其 schema 与 manifest 的 per-file 记录（§7.2）一致。

---

## 7. Ground Truth Manifest 规范

### 7.1 输出结构

```
manifest/
├── summary.json        # Vault 级汇总
├── files.jsonl         # 每文件一行（100k 规模可流式消费）
├── graph.jsonl         # 边表：每条内部链接一行
├── oracle.json         # 搜索预言机（仅 search-oracle profile）
└── checksums.txt       # 每文件 SHA-256 + Vault 总校验和
```

### 7.2 files.jsonl 单条记录 Schema

```json
{
  "path": "领域笔记/机器学习.md",
  "size": 3241,
  "sha256": "…",
  "archetype": "zettel",
  "line_ending": "lf",
  "frontmatter": { "tags": ["AI"], "aliases": ["ML"] },
  "headings": [
    { "level": 2, "text": "监督学习", "span": [120, 132], "line": 8 }
  ],
  "tags_inline": [ { "tag": "领域/AI", "span": [200, 208] } ],
  "block_ids": [ { "id": "a1b2c3", "span": [560, 567] } ],
  "links_out": [
    {
      "raw": "[[深度学习|DL]]",
      "kind": "wikilink",          // wikilink|embed|mdlink|external
      "target": "深度学习",
      "subpath": null,              // "#标题" 或 "#^块ID"
      "display": "DL",
      "span": [88, 103],
      "resolves_to": "领域笔记/深度学习.md",  // null = 断链
      "ambiguous": false
    }
  ],
  "planted_terms": ["量子纠缠速率"]   // 仅 oracle profile
}
```

**span 一律为 byte offset 半开区间 `[start, end)`**，指向包含定界符的完整原始文本（如 `[[…]]` 整体）。

### 7.3 summary.json 关键字段

```json
{
  "generator_version": "1.0.0",
  "profile": "standard-10k",
  "seed": 42,
  "mode": "statistical",
  "counts": {
    "notes": 10000, "attachments": 1500, "dirs": 214,
    "links_total": 50012, "links_resolved": 49011,
    "links_broken": 1001, "embeds": 4003,
    "orphan_notes": 1002, "tags_unique": 498, "block_ids": 8112
  },
  "graph": { "max_out_degree": 97, "connected_components": 1017 },
  "vault_sha256": "…"
}
```

### 7.4 一致性不变量（生成器出厂自检必须满足）

- I-01：`graph.jsonl` 边数 = 所有 files 的 `links_out` 中 `resolves_to != null` 且非 external 的条目总和
- I-02：反链可由 graph.jsonl 反转精确导出（测试 AC-LINK-02 时以此为预期值）
- I-03：每个 span 切片文件字节后与 `raw` 字段完全相等
- I-04：`counts.*` 与逐文件累加一致
- I-05：checksums 与实际文件一致

---

## 8. 变更模拟器（Churn Driver）

为 AC-VAULT-01/02/03、FR-103、索引增量更新测试提供"外部世界"驱动。

### 8.1 命令与脚本

```bash
nf-vaultgen churn --vault ./vault --script churn.toml --seed 7 --journal ops.jsonl
```

```toml
[churn]
duration_s = 60
ops_per_sec = 5                    # 支持突发模式 burst = { size = 50, interval_s = 10 }
op_weights = { modify = 60, create = 15, delete = 10, rename = 10, move = 5 }

[write_style]
atomic_ratio = 0.5                 # 50% temp+rename（模拟规范编辑器），50% 直接截断写入（模拟粗暴程序）
partial_write = false              # true 时注入"写一半停顿 200ms 再续写"的撕裂写（AC-VAULT-01 素材）

[conflict]
target_files = ["指定文件.md"]     # 定向修改被测应用当前打开的文件（配合 e2e 制造冲突）
```

### 8.2 操作日志（ops.jsonl）

每个操作一行：`{ "ts_ms": …, "op": "modify", "path": …, "sha256_before": …, "sha256_after": …, "bytes_changed": … }`。

测试框架据此断言：被测应用的索引最终状态 = 基底 manifest + 操作日志重放的期望状态（收敛时限 500ms/文件，对齐 FR-401）。

### 8.3 确定性要求

操作序列由 seed 完全决定；但**时间戳不要求确定**（涉及真实 IO 调度）。日志记录实际时间供性能分析。

---

## 9. 搜索预言机（search-oracle profile 专属）

### 9.1 种植规则

- 从**生成词库外**挑选 50 个人造词条（如 `量子纠缠速率仪`、`zxqvwtest7`），保证背景语料零污染
- 每个词条按预设文档频率种植：精确出现在 N 个指定文件的指定位置（N ∈ {1, 5, 50, 500}）
- 种植分词陷阱对：文档含 `机器学习`，oracle 声明查询 `器学` 的预期命中集为**空**（词级匹配）或全集（子串匹配）——按主文档最终确定的分词语义标注
- 短语与布尔真值集：如 `"量子纠缠" AND 速率` 的精确命中文件列表
- 正则目标：种植符合特定 pattern 的字符串及其精确位置

### 9.2 oracle.json Schema

```json
{
  "queries": [
    {
      "query": "量子纠缠速率仪",
      "type": "term",
      "expected_files": ["a.md", "b.md"],
      "expected_positions": { "a.md": [[120, 141]] }
    },
    {
      "query": "tag:#领域/AI path:领域笔记",
      "type": "qualified",
      "expected_files": ["…"]
    }
  ]
}
```

AC-SEARCH-01/03 的断言直接消费此文件：召回必须 = expected_files（全查准 + 全查全），高亮位置与 expected_positions 一致。

---

## 10. CLI 参考

```bash
# 生成
nf-vaultgen generate --profile standard-10k --seed 42 \
    --out ./bench-vault --manifest ./bench-vault-manifest \
    [--line-ending lf|crlf|mixed] [--override links.total=60000]

# 自定义 profile
nf-vaultgen generate --config my-profile.toml --seed 1 --out ./v

# 校验（Vault 与 manifest 互证：checksums、span 切片、不变量 I-01~I-05）
nf-vaultgen verify --vault ./bench-vault --manifest ./bench-vault-manifest

# 变更模拟
nf-vaultgen churn --vault ./v --script churn.toml --seed 7 --journal ops.jsonl

# 列出内置 profile 及其参数
nf-vaultgen list-profiles [--json]
```

退出码：0 成功；2 参数错误；3 verify 失败（输出首个不一致项详情）。

同时提供 **library API**（`nf_vaultgen::generate_in_memory()`），供单元测试在 tmpdir/内存中直接构造小型 Vault，不经 CLI。

---

## 11. 生成器自身的验收标准

```
AC-GEN-01 [int] 确定性
  Given 同一 (版本, profile, seed)
  When  在 Windows / macOS / Linux 各生成一次
  Then  三平台 vault_sha256 与 manifest 内容完全一致（CI 三平台矩阵验证）

AC-GEN-02 [unit] Span 正确性
  Given 任意生成的 Vault
  When  对 files.jsonl 全部 span 执行字节切片
  Then  100% 与 raw 字段相等（不变量 I-03）

AC-GEN-03 [unit] 不变量自检
  Then  I-01 ~ I-05 全部通过；`verify` 命令对刚生成的 Vault 返回 0

AC-GEN-04 [bench] 生成性能
  Then  standard-10k < 10s；large-100k < 90s；峰值内存 < 1GB（流式写盘，不整体驻留）

AC-GEN-05 [int] exact 模式精确性
  Given rename-sync profile
  Then  引用总数恰好 500，7 种链接形态每种至少 20 处，与 manifest 声明逐项相符

AC-GEN-06 [unit] statistical 模式容差
  Given standard-10k，任意 10 个不同 seed
  Then  links_total 均落在 50,000 ± 2% 内；文件均值 3KB ± 5%

AC-GEN-07 [int] churn 日志忠实性
  Given 任意 churn 运行
  Then  按 ops.jsonl 重放 sha256_after 序列，与磁盘最终状态一致

AC-GEN-08 [manual] 语料质量抽检
  Then  随机抽 20 个文件人工检查：文本可读似自然语言、元素分布符合 §3.3、无乱码
```

---

## 12. CI 集成与版本策略

1. **缓存键**：`hash(generator_version + profile + seed)` → 生成的 Vault 在 CI 缓存/制品库中复用，避免每次基准前重新生成（large-100k 尤其必要）
2. **固定 seed 约定**：官方基准一律 `seed=42`；属性测试类（AC-MD-03 语料）每晚轮换 seed 并在失败时打印 seed 供复现
3. **仓库内只提交** `fixtures/edge-corpus/`（手工用例）；生成类 Vault 一律不入库
4. **版本纪律**：manifest schema 变更 → minor 升级；生成字节序列变更（哪怕语料微调）→ minor 升级并使 CI 缓存失效；基准历史趋势图按 `(generator_version, profile)` 分轨，避免跨版本误比
5. **与主文档的联动**：主文档 NFR 表中所有"10k 标准 Vault"字样正式定义为 `standard-10k @ seed=42`，写入基准测试代码常量

---

## 13. 追溯矩阵（Profile → 主文档验收项）

| 主文档条目                      | 依赖 Profile                   | 消费的真值                       |
| -------------------------- | ---------------------------- | --------------------------- |
| NFR-01/03/04/06/07         | standard-10k                 | summary.counts（规模确认）        |
| NFR-05                     | large-100k                   | 同上                          |
| NFR-08 / AC-EDIT-04 / P0-3 | bigfile                      | 文件路径与大小                     |
| AC-GRAPH-01                | graph-bench                  | graph.jsonl 精确 10k/30k      |
| AC-LINK-01                 | rename-sync                  | files.jsonl 全部 500 处引用 span |
| AC-LINK-02                 | standard-10k                 | graph.jsonl 反转导出反链预期        |
| AC-SEARCH-01/02/03         | search-oracle                | oracle.json                 |
| AC-MD-02/04                | edge-corpus                  | .expected.json              |
| AC-MD-03                   | library API 随机文档             | 生成端 IR 即预期 AST 骨架           |
| AC-VAULT-01/02/03 / FR-103 | churn-base + churn driver    | ops.jsonl                   |
| FR-404 断链                  | standard-10k                 | links_broken 清单             |
| 分词/IME 相关                  | unicode-hell / search-oracle | 文件名与种植词位置                   |

---

## 14. 开放问题（需在实现前确定）

1. **链接解析歧义规则**：同名文件的最短路径解析、大小写敏感性、NFC/NFD 归一化策略——manifest 的 `resolves_to` 必须与主应用规则**同源**。建议：将解析规则写成独立的纯函数规范（无 IO 伪代码）放入主文档 §4.4，生成器与 nf-index 各自实现后用 manifest 交叉验证
2. **分词语义**：`器学` 是否应命中 `机器学习` 取决于 tantivy 分词策略（词级 vs 子串），oracle 标注需等主文档定稿
3. **块 ID 与标签的合法字符集**：需主文档给出精确文法（建议直接附 EBNF），生成器按文法生成正/负例

---
## 15. 完成任务后更新工作日志
工作日志需要及时更新。
最后再比较和obsidian实现之间的差距，然后确认其中的优劣对比，并且就其中关键地方进行研究学习，并且开发改笔记软件相关的关键插件。

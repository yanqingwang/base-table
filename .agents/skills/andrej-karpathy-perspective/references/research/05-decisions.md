# Andrej Karpathy 重大决策、转折点与争议行为

> 综述：Karpathy 的职业路径呈现清晰的"摆动模式"——在学术/工业界、前沿实验室/独立创作之间反复切换。他自称这是一种"进进出出"（back and forth）的策略，每次"进入"获得前沿技术直觉，每次"退出"获得言论自由和创作空间。

---

## 1. 学术决策：从量子计算到深度学习

### 1.1 多伦多大学本科：物理 + 计算机双专业（2005-2009）

- **决策**：选择双专业，最初志向是量子计算
- **他亲口说的原因**：最初想从事量子计算，"看到计算应用将彻底改变世界，我想帮助创造最高效的计算设备……这意味着尽可能深入到量子层面"。但量子力学课程让他觉得"离太远、限制太多，无法真正动手"
- **转折点**：在图书馆漫步时意识到，自己无法读完所有书，但"如果我不能学到所有知识，也许我可以建造一个能学的东西"——转向AI
- **机缘**：在多大选修 Geoff Hinton 的课程和阅读小组，首次进入深度学习领域
- **来源**：[DataScienceWeekly 采访](https://www.datascienceweekly.org/data-scientist-interviews/training-deep-learning-models-browser-andrej-karpathy-interview) — 可信度：高（本人亲述）

### 1.2 UBC 硕士（2009-2011）：物理仿真与运动控制

- **决策**：选择物理仿真动画方向，导师 Michiel van de Panne
- **背景**：研究"课程学习"（curriculum learning）用于模拟四足机器人运动技能
- **意义**：这段经历塑造了他对"渐进式学习"的理解，后来影响了他的教育理念
- **来源**：[UBC 论文](https://open.library.ubc.ca/media/stream/pdf/24/1.0051435/2) — 可信度：高

### 1.3 斯坦福博士（2011-2016）：师从 Fei-Fei Li

- **决策**：选择计算机视觉与自然语言处理的交叉方向
- **他亲口说的原因**：Fei-Fei Li 的"激情、远见、雄心和追求完美的热情具有感染力"；在 2000+ 封邮件和无数次会议中，"将我从一个热切但基本上困惑的学生雕琢成一个有能力的研究者"
- **关键产出**：Deep Visual-Semantic Alignments（图像描述生成）、ImageNet 挑战赛参与
- **3次实习**：Google Brain（2011，无监督视频学习）、Google Research（2013，大规模有监督YouTube视频学习）、DeepMind（2015，深度强化学习团队）
- **来源**：[斯坦福博士论文致谢](https://cs.stanford.edu/people/karpathy/main.pdf) — 可信度：高（本人书面）

---

## 2. CS231n：教育者的诞生（2015）

### 2.1 决策：设计并主讲斯坦福第一门深度学习课

- **决策**：与 Fei-Fei Li 共同设计 CS231n: Convolutional Neural Networks for Visual Recognition
- **背景**：这是斯坦福第一门深度学习课程
- **增长数据**：150人（2015）→ 330人（2016）→ 750人（2017），成为斯坦福最大的课程之一
- **动机**：Karpathy 自己说，他对教学的热情可以追溯到 YouTube 上的魔方教程；CS231n 是他将复杂概念通俗化的第一次大规模实践
- **工具创新**：开发了 ConvNetJS、RecurrentJS 等 JavaScript 深度学习库，因为"热爱web"
- **来源**：[karpathy.ai](https://karpathy.ai/) — 可信度：高

### 2.2 决策影响

- **关键疑问（外界推测）**：CS231n 的成功是否使他选择教育作为终身副业而非主业？
- **已知事实**：他在此后始终将教育作为"side quest"，直到2024年才全职投入 Eureka Labs。这说明他长期将教育视为"兼职热爱"，而非放弃工业界的前沿工作
- **来源**：综合多个采访 — 可信度：中

---

## 3. 加入 OpenAI（2015）：从学术界到工业界

### 3.1 决策：成为 OpenAI 创始成员

- **背景**：2015年底，Elon Musk、Sam Altman、Greg Brockman 等人创立 OpenAI（非营利组织）
- **他亲口说的原因**：OpenAI 的使命是"确保通用人工智能造福全人类"；他被"进行开放、透明的AI研究"的使命所吸引
- **角色**：研究科学家，从事深度强化学习（World of Bits项目——让神经网络操控键盘鼠标）和生成模型（PixelCNN++）
- **他还做了**："作为创始成员之一，我帮助了很多早期招聘和架构工作"
- **来源**：
  - [LinkedIn](https://linkedin.com/in/andrej-karpathy-9a650716) — 可信度：高
  - [Wikipedia](https://en.wikipedia.org/wiki/Andrej_Karpathy) — 可信度：高

### 3.2 外界推测 vs 他亲口说的

- **他亲口说的**：被开放研究使命吸引
- **外界推测**：作为刚毕业的 PhD，加入一个由硅谷顶级人物背书的新实验室，是当时最理想的职业选择。而且当时 OpenAI 的开放研究环境与他的教育者性格吻合
- **一致性检查**：一致。他对"开放"的偏好后来一再出现（开源 nanoGPT、公开教学）
- **来源**：综合推断 — 可信度：中

---

## 4. 离开 OpenAI 加入 Tesla（2017）：从研究到产品

### 4.1 决策背景

- **时间**：2017年6月
- **内容**：离开 OpenAI（仅1年半），加入 Tesla 担任 AI 高级总监（后为 Director of AI），直接向 Elon Musk 汇报
- **背景**：Tesla 刚终止与 Mobileye 的合作，需要自建计算机视觉团队。Musk 此前已经换过6任 Autopilot 负责人，每人平均任职约6个月
- **来源**：[Quartz/QZ](https://qz.com/1011376/elon-musk-poached-andrej-karpathy-from-openai-to-be-teslas-tsla-director-of-artificial-intelligence) — 可信度：高

### 4.2 动机分析

- **他亲口说的（事后）**：
  - 加入时 Tesla "几乎没有计算机视觉团队"——"我加入时只有两个人正在训练深度神经网络"
  - 他看到了从零构建一个真实世界 AI 系统的机会
  - AI 在真实世界中的大规模应用——与纯粹的研究不同
- **外界推测**：
  - Musk 亲自挖角，Tesla 给出了极具竞争力的 offer
  - 2017年正值自动驾驶热潮，这是当时工业界最具挑战性的 AI 应用场景
  - 作为被Musk直接挖走的OpenAI创始成员，这一决定实质上建立了从OpenAI到Tesla的人才输送通道

### 4.3 矛盾/争议

- **人说 vs 人做**：Karpathy 加入 Tesla 时 OpenAI 仍是开放的非营利组织。而 Tesla 是高度保密的商业公司。从"开放研究"到"闭源产品"的转变，与他公开推崇的开放理念存在张力
- **Karpathy 的解释**：他在 Tesla 做的事是"应用AI"，与 OpenAI 的"通用AI研究"不同，两者可以兼顾
- **来源**：[Lex Fridman Podcast](https://lexfridman.com/andrej-karpathy/) — 可信度：高

---

## 5. Tesla 五年（2017-2022）：从构建到疲惫

### 5.1 "Software 2.0" 理论的诞生（2017）

- **决策**：2017年11月（入职Tesla仅2个月后），发表博客 "Software 2.0"
- **核心主张**：编程正在从手写代码转变为"通过数据集和神经网络权重来编程"
- **事后反思**：9年后（2026），这篇博客被评价为"更像路线图而非论文"；预测了AI辅助编程的完全普及
- **来源**：[Software 2.0 博客](https://karpathy.medium.com/software-2-0-641d7a5553b7) — 可信度：高

### 5.2 Tesla 成就

- **他亲口说的**：领导计算机视觉团队，负责"所有内部数据标注、神经网络训练和在 Tesla 定制推理芯片上的部署"
- **关键贡献**：从零建立起 Tesla 的计算机视觉团队；推动"纯视觉"（Vision-only）方案；建立数据引擎（Data Engine）——通过影子模式持续收集数据、识别失败案例、重新训练的闭环
- **来源**：[CVPR 2021 演讲](https://davidsilver.blog/2021/07/05/andrej-karpathys-cvpr-talk-annotated/) — 可信度：高

### 5.3 离开 Tesla（2022年7月）

- **方式**：先休了4个月长假（sabbatical），然后宣布离开
- **他亲口说的原因**（Lex Fridman 播客，2022年10月）：
  - "在5年时间里，我逐渐把自己放到了一个管理职位上。我的大部分日子是开会、壮大组织、做出高层战略决策……这是一个企业高管角色"
  - "我能做，我想我也还行，但这根本不是我喜欢的"
  - 他想回到技术工作、开源和教育
- **未明说的原因（外界推测）**：
  - 与 Elon Musk 在"纯视觉"方案上可能存在的分歧（Tesla 2021年移除雷达，完全依赖摄像头；而 Waymo 使用激光雷达+摄像头融合方案被证明更成功）
  - 工作强度过大导致 burnout
  - Musk "喜欢小规模高能力团队"的管理风格可能在后期变得难以承受

- **矛盾记录**：
  - 在 Lex 播客中说："我真的很感兴趣在某个时间点回来，在 Optimus 和 AGI 上工作……Tesla 将会做出不可思议的事"——表示会考虑 "Act 2"
  - Musk 回应："Andrej 在 Tesla 永远受欢迎"
  - 但截至2026年并未回去

- **来源**：
  - [Lex Fridman Podcast #333](https://lexfridman.com/andrej-karpathy/) — 可信度：高（本人亲述）
  - [Drive Tesla Canada](https://driveteslacanada.ca/news/andrej-karpathy-return-to-tesla/) — 可信度：高

### 5.4 事后反思：自动驾驶的教训

- **核心反思（多次演讲）**：从完美 Demo 到真正产品的差距是"十年量级"
  - 2014年体验 Waymo 完美试驾→以为自动驾驶即将到来→12年后仍在解决
  - "每增加一个9，都需要等量工作"（90% → 99% → 99.9%）
  - "所有 Demo 都给我留下极其不深刻的印象"
  - 警示：不要被演示蒙蔽
- **对于 AI Agent 的推断**：2025-2026年是"Agent的十年"，而非"Agent的元年"
- **来源**：
  - [Electrek 2025](https://electrek.co/2025/06/21/tesla-former-head-ai-warns-against-believing-self-driving-solved/) — 可信度：高
  - [Dwarkesh Patel 播客 2025](https://www.youtube.com/watch?v=lXUZvyajciY) — 可信度：高

---

## 6. 回归 OpenAI（2023年2月）：ChatGPT 后的重新卷入

### 6.1 决策：在 ChatGPT 爆红后回归

- **时间**：2023年2月9日
- **背景**：
  - 2022年10月：在 Lex Fridman 播客中没有任何重返 OpenAI 的暗示，反而在讨论 Tesla "Act 2" 的可能性
  - 2022年11月30日：ChatGPT 发布，引发全球 AI 热潮
  - 2023年2月9日：宣布重返 OpenAI
- **他亲口说的原因**：
  - "像 AI 圈内外许多人一样，我非常受他们工作的影响，我个人也从中大大受益。未来的潜力尤其令人兴奋；很高兴能跳回去建设！"
  - 具体角色：建立新团队，专注于"midtraining and synthetic data generation"
- **来源**：
  - [Twitter/X @karpathy](https://twitter.com/karpathy/status/1623663087829041152) — 可信度：高
  - [karpathy.ai](https://karpathy.ai/) — 可信度：高

### 6.2 外界推测 vs 他亲口说的

- **他亲口说的**：被 OpenAI 的工作震撼和激励
- **外界推测**：
  - ChatGPT 的成功让他意识到自己可能"错过"了时代浪潮
  - OpenAI 的估值和技术进展让他想重新参与前沿
  - 他在 Lex 播客中表现的"浪漫主义者"姿态（把神经网络当作与人类认知共存的智能形式）暗示他其实从未真正离开AI圈
- **一致性检查**：模糊。他2022年10月还在讨论 Tesla Act 2，4个月后就加入了 OpenAI。这说明他的决策可能更多受 ChatGPT 发布影响，而非经过长期规划

---

## 7. 再次离开 OpenAI（2024年2月）：最短的回归

### 7.1 决策：仅回归1年后再次离开

- **时间**：2024年2月13日
- **背景**：这次回归仅持续约1年。期间 OpenAI 经历了 Sam Altman 被董事会解雇又复职的动荡（2023年11月）
- **他明确说的话**：
  - "我昨天离开了 OpenAI。首先，没有发生任何'事件'，不是任何特定事件、问题或戏剧的结果"
  - "请继续让阴谋论来，它们非常有趣 :)"
  - "在 OpenAI 的过去一年真的很棒——团队非常强大，人们很棒，路线图很令人兴奋"
  - "我的近期计划是做个人项目，看看会发生什么。关注我的人可能知道那会是什么样子"
- **来源**：[TechCrunch](https://techcrunch.com/2024/02/13/andrej-karpathy-is-leaving-openai-again-but-he-says-there-was-no-drama/) — 可信度：高

### 7.2 外界推测（矛盾点）

- **他说的 vs 普遍推测**：
  - 他说"没有发生任何事件"，但这是在 Sam Altman 被解雇后仅3个月
  - 业界普遍认为 OpenAI 的内部治理混乱（Altman 被解雇→95%员工威胁辞职→Altman回归→董事会重组）是主因
  - Ilya Sutskever（另一位联合创始人）也在不久后离开创办 SSI
- **矛盾线索**：
  - Karpathy 在 OpenAI 的 X bio 写着"在 @OpenAI 造 J.A.R.V.I.S."——暗示他在做一个 AI 助手项目
  - 但他的角色从宣传的"宏大愿景"（J.A.R.V.I.S.）变成了更务实的"midtraining and synthetic data"
  - 这可能暗示实际工作内容与期望不符

### 7.3 对 OpenAI 治理的态度

- **他公开说的**：从未直接评论 OpenAI 董事会事件
- **他行动暗示的**：2024年2月离开，恰逢 Altman 复职和董事会重组后。这被多数观察者解读为对 OpenAI 新方向（更商业化、更封闭）的沉默退出
- **事后佐证**：2025年3月，他说自己"更与人类一致……在 Frontier Lab 之外"，因为对能说什么/不能说什么有压力
- **来源**：[The Algorithmic Bridge 2026](https://www.thealgorithmicbridge.com/p/andrej-karpathy-joins-anthropic-what) — 可信度：中

---

## 8. Eureka Labs（2024年7月）：教育创业

### 8.1 决策：创办 AI 原生学校

- **时间**：2024年7月16日
- **公司**：Eureka Labs（2024年6月21日在特拉华注册为 LLC）
- **定位**："一种AI原生的新型学校"
- **他亲口说的动机**：
  - "Eureka Labs 是我在 AI 和教育两方面约20年热情的结晶"
  - "我对教育的兴趣让我从 YouTube 魔方教程→到斯坦福的 CS231n→到最近的 Zero-to-Hero AI 系列"
  - "我在 AI 方面的工作从斯坦福的学术研究→到 Tesla 的真实产品→到 OpenAI 的 AGI 研究"
  - "所有这些将两者结合的工作以前只是兼职，是'真正工作'的支线任务"
  - "现在我很兴奋能全职投入，专业地打造一些伟大的东西"
- **愿景**：教师设计教材，AI 教学助手为每个学生提供个性化指导——"Teacher + AI symbiosis"
- **首款产品**：LLM101n——本科生级课程，教学生训练自己的 AI
- **来源**：
  - [Eureka Labs 官网](https://eurekalabs.ai/) — 可信度：高
  - [TechCrunch](https://techcrunch.com/2024/07/16/after-tesla-and-openai-andrej-karpathys-startup-aims-to-apply-ai-assistants-to-education/) — 可信度：高

### 8.2 外界推测 vs 他亲口说的

- **外界推测**：
  - Eureka Labs 是 Karpathy 意识到"在 OpenAI 内部无法做想做的教育创新"后的出路
  - 也反映了他对"做自己的产品"胜过"在大组织内做贡献"的偏好
  - 选择创业而非再回 Tesla，说明他决心走自己的路
- **争议点**：
  - Wikipedia 指出，Eureka Labs 倡导的 AI 教学助手概念"因数据隐私问题和师生之间个人联系的消除而受到批评"
- **进展**：截至2026年，Eureka Labs 仍在建设 LLM101n，同时 Karpathy 加入了 Anthropic——说明 Eureka Labs 可能仍处于早期阶段，他再次回到"前沿实验室+副业教育"的模式
- **来源**：[Wikipedia](https://en.wikipedia.org/wiki/Andrej_Karpathy) — 可信度：高

---

## 9. 加入 Anthropic（2026年5月）：最新的摆动

### 9.1 决策：加入 Anthropic 预训练团队

- **时间**：2026年5月19日
- **角色**：在预训练团队下"使用 Claude 加速预训练研究"，向 Nick Joseph 汇报
- **他亲口说的原因**：
  - "我认为 LLM 前沿的下几年将特别具有塑造性"
  - "我很兴奋加入团队，回到研发"
  - 同时确认："我仍然对教育怀有深厚热情，计划在适当时恢复教育工作"
- **来源**：[Wikipedia](https://en.wikipedia.org/wiki/Andrej_Karpathy) — 可信度：高

### 9.2 关键矛盾：自由 vs 前沿的张力

- **2025年3月的言论**：
  - 他说自己"更与人类一致……在 Frontier Lab 之外"
  - 理由：在 lab 内部有些话不能说（如"前沿模型有点粗糙"），有些话会被迫说（如"闭源模型更安全"）
  - 他也承认不回到前沿实验室的代价："你的判断会不可避免地开始漂移"
- **2026年5月的行动**：加入 Anthropic
- **矛盾**：他明确说过在 lab 之外更能自由发言，但又因怕落后而回去了。这被他本人描述为一种有意识的"来回摆动"策略
- **他的解释**：理想状态是"进进出出"（go back and forth）——进入前沿实验室重建技术直觉，退出获得言论自由
- **外界解读**：AI Twitter 戏称这是"KD 加入勇士队"（对懂线性代数的人来说）
- **来源**：
  - [The Algorithmic Bridge](https://www.thealgorithmicbridge.com/p/andrej-karpathy-joins-anthropic-what) — 可信度：高
  - [explainx.ai](https://explainx.ai/blog/andrej-karpathy-joins-anthropic-pre-training-2026) — 可信度：中

---

## 10. 言行一致性分析：争议决策与立场变化

### 10.1 AI 安全立场：渐进主义者

| 时间 | 言论/行动 | 来源 |
|------|-----------|------|
| 2022 | 在 Lex 播客中表达"浪漫的 AI 观"，不急于 AGI 也不质疑，仅探讨可能性 | Lex Fridman #333 |
| 2025 | 称 AGI 约"十年后"——不是末日预言家也不是加速主义者 | Dwarkesh Patel 播客 |
| 2025 | 强调"保持 AI 在 leash 上"，警告"不要过早释放无监督 agent" | Y Combinator 活动 |
| 2026 | 加入 Anthropic（以安全为使命的实验室）做预训练 | 官方公告 |

- **一致性**：基本一致。Karpathy 从未表达过极端安全立场，也从未彻底否定 AI 风险。他的立场是"务实渐进主义"——相信 AI 会持续进步，但认为公开讨论和实际部署中的谨慎是必要的
- **矛盾点**：他公开支持开源模型（认为行业需要共享基础设施），但 Anthropic 的主要策略之一就是闭源前沿模型。他加盟 Anthropic 在某种程度上与他的开源立场存在张力

### 10.2 开源 vs 闭源：理论开放，实践混合

- **他说**（2024-2026年间）：
  - AI 模型应该成为"共享基础设施"——类似互联网或 Linux
  - 行业应该采用"分层方法"：成熟模型开源成为公共品，前沿研究继续推进
  - 担心"五家大型科技公司"垄断 AI
- **他做**：
  - 在 OpenAI 时，参与开发了 GPT-4（完全闭源的商业产品）
  - 在 Anthropic 时，加入的是另一个闭源前沿实验室
  - 但同时开源了大量教育工具（nanoGPT、Zero to Hero 代码）
- **矛盾**：他的理想（开源作为权力平衡机制）与他的雇主（闭源商业实验室）之间存在结构性矛盾。他自己承认这种 tension，选择了"进进出出"来缓解
- **来源**：[FrontierNews.ai](https://www.frontiernews.ai/news/article/andrej-karpathys-vision-for-open-source-ai-could-r-a127530f) — 可信度：中

### 10.3 Scaling Law 立场变化

- **早期（2017-2022）**：Scaling 的坚定信徒——在 Tesla 大规模扩展神经网络；在 OpenAI 参与大规模语言模型
- **中期（2023-2024）**：开始注意到边际效益递减。在 "State of GPT" 演讲中讨论数据质量 vs 数据规模的平衡
- **近期（2025-2026）**：
  - 认为"模型的参数规模先增长后下降，最先进模型现在更小了"
  - 提出"认知核心"概念——可能在10亿参数级别就能达到极强的推理能力
  - "大部分压缩是记忆工作，不是认知工作。我们真正想要的是认知部分；删除记忆"
  - "数据集将变得好得多。目前它们太糟糕了，任何东西能工作都是奇迹"
- **转变性质**：不是推翻 Scaling Law，而是细化——从"越大越好"到"更好的数据 + 更好的算法 + 中等规模模型 = 最优"
- **来源**：[Dwarkesh Patel 播客 2025](https://www.dwarkesh.com/p/andrej-karpathy) — 可信度：高

### 10.4 "Vibe Coding" → "Agentic Engineering" 的概念演化

- **2025年2月**：在 X 上随手发了一条推文，创造了"Vibe Coding"——"完全沉浸在氛围中，拥抱指数级增长，忘记代码的存在"
  - 成为 Collins 词典 2025 年度词汇
  - 被 MIT Technology Review 评为 2026 年十大突破性技术之一
- **2026年初**：宣布 vibe coding "过时"，用"Agentic Engineering"取代
  - 因为他认为专业开发者需要的不只是"轻松编码"，而是"协调有缺陷的agent同时保持正确、安全、品味和可维护性"
- **变化含义**：从"降低门槛"到"提高天花板"——反映了他对AI编程从消费者工具到专业工程实践的认知演进
- **他本人反思**："Vibe coding 现在被写在我的 Wikipedia 上作为一个重大的模因'贡献'"——带有些许讽刺地承认自己的影响力
- **来源**：
  - [Observer](https://observer.com/2026/02/andrej-karpathy-new-term-ai-coding/) — 可信度：高
  - [Y Combinator 演讲 2025](https://www.ycombinator.com/library/MW-andrej-karpathy-software-is-changing-again) — 可信度：高

---

## 11. 宏观模式总结

### 11.1 "摆动"模式（The Pendulum）

| 阶段 | 位置 | 领域 | 持续时间 |
|------|------|------|---------|
| 1 | 学术界（斯坦福 PhD） | 研究 | 5年 |
| 2 | 前沿实验室（OpenAI） | AGI 研究 | 1.5年 |
| 3 | 产品公司（Tesla） | 应用 AI | 5年 |
| 4 | 独立（Youtube/nanoGPT） | 教育 | 7个月 |
| 5 | 前沿实验室（OpenAI 2） | AGI 研发 | 1年 |
| 6 | 创业/独立（Eureka Labs） | AI 教育 | 2年+ |
| 7 | 前沿实验室（Anthropic） | 预训练 | 至今 |

### 11.2 核心张力

- **独立 vs 前沿**：想自由表达/创造 vs 想接触最前沿技术
- **教育 vs 研究**：想教世界 vs 想做最硬核的技术
- **开放 vs 闭源**：信仰开源理念 vs 雇主是闭源商业实验室
- **他承认的解决方案**："进进出出"——来回切换，每次"进入"充电技术直觉，每次"退出"获得创作自由

### 11.3 一致性得分

| 维度 | 评分 | 说明 |
|------|------|------|
| 教育热情 | ⭐⭐⭐⭐⭐ | 20年如一日，从魔方教程到CS231n到Eureka Labs |
| 技术能力优先 | ⭐⭐⭐⭐⭐ | 始终回到"做技术"而非"做管理" |
| 开源理念 | ⭐⭐⭐ | 嘴上支持开源，但多次为闭源实验室工作 |
| 对AI风险的坦诚 | ⭐⭐⭐⭐ | 务实渐进，既不大惊小怪也不漠不关心 |
| 职业决策一致性 | ⭐⭐⭐ | 摆动模式本身是一种一致性，但各步动机有时受外部事件驱动（如ChatGPT发布） |

---

## 原始来源索引

| 编号 | 来源 | URL | 可信度 |
|------|------|-----|--------|
| S1 | Karpathy 个人官网 | https://karpathy.ai/ | 高（第一手） |
| S2 | Wikipedia | https://en.wikipedia.org/wiki/Andrej_Karpathy | 高 |
| S3 | TechCrunch 2024离职报道 | https://techcrunch.com/2024/02/13/andrej-karpathy-is-leaving-openai-again/ | 高 |
| S4 | Eureka Labs 官网 | https://eurekalabs.ai/ | 高（第一手） |
| S5 | TechCrunch Eureka Labs 报道 | https://techcrunch.com/2024/07/16/after-tesla-and-openai-andrej-karpathys-startup/ | 高 |
| S6 | Lex Fridman Podcast #333 | https://lexfridman.com/andrej-karpathy/ | 高（本人亲述） |
| S7 | Quartz 2017离职报道 | https://qz.com/1011376/elon-musk-poached-andrej-karpathy-from-openai/ | 高 |
| S8 | Electrek 2025自动驾驶反思 | https://electrek.co/2025/06/21/tesla-former-head-ai-warns-against-believing-self-driving-solved/ | 高 |
| S9 | Dwarkesh Patel 播客 2025 | https://www.dwarkesh.com/p/andrej-karpathy | 高 |
| S10 | The Algorithmic Bridge 2026 | https://www.thealgorithmicbridge.com/p/andrej-karpathy-joins-anthropic-what | 中 |
| S11 | Linkedin | https://linkedin.com/in/andrej-karpathy-9a650716 | 高 |
| S12 | DatascienceWeekly 采访 | https://www.datascienceweekly.org/data-scientist-interviews/ | 高（本人亲述） |
| S13 | Sequoia AI Ascent 2026 | https://sozai.app/transcript/andrej-karpathy-vibe-coding-agentic-engineering/ | 中 |
| S14 | Observer "Agentic Engineering" | https://observer.com/2026/02/andrej-karpathy-new-term-ai-coding/ | 高 |
| S15 | FrontierNews 开源立场 | https://www.frontiernews.ai/news/article/andrej-karpathys-vision-for-open-source-ai/ | 中 |

---

*生成日期：2026-06-14*
*本文件是 Andrej Karpathy Perspective Skill 的研究参考资料*

#!/usr/bin/env python3
"""《小豹子的成长之旅》—— 系列童话故事 HTML 生成器"""

import pypinyin
import html
import asyncio
import os
import subprocess
from pathlib import Path

# ─── 故事数据 ───

STORIES = [
    {
        "id": "01-courage",
        "theme": "勇敢",
        "theme_en": "Courage",
        "title": "小豹子说「不」",
        "illustration_hint": "小豹子站在墙下摇头说不",
        "svg_name": "courage",
        "text": [
            "下午放学后，小豹子和小伙伴们在村口的大樟树下玩耍。",
            "阿牛指着隔壁院子的枇杷树说：「枇杷熟了！我们翻墙摘几个吧！」",
            "小豹子抬头看，金黄的枇杷挂满了枝头，像一颗颗小太阳。她咽了咽口水。",
            "「快上来！」阿牛已经爬上了墙头。",
            "小豹子忽然想起妈妈说过的话——「别人的东西，不能拿。」",
            "她摇摇头，小声说：「妈妈说不能拿别人的东西……」",
            "「胆小鬼！」阿牛跳下墙头，朝她做鬼脸。其他孩子也跟着笑起来。",
            "小豹子的脸一下子红了。她低下头，眼眶有点热。",
            "但她没有哭。她握紧小拳头，大声说：",
            "「我不是胆小鬼！我只是不想做错事！」",
            "说完，她转身大步往家走。咪咪跟在她脚边，喵喵地叫着，好像在说：「小豹子说得对！」",
            "那天晚上，妈妈听完这件事，紧紧抱住小豹子：",
            "「你说得对，宝贝。勇敢不是什么都敢做，而是知道什么不该做，还能坚持住。」",
        ]
    },
    {
        "id": "02-resilience",
        "theme": "坚强",
        "theme_en": "Resilience",
        "title": "风筝飞起来了",
        "illustration_hint": "小豹子拿着风筝在田野奔跑",
        "svg_name": "kite",
        "text": [
            "春天到了，小豹子和爸爸一起扎了一个蝴蝶风筝。",
            "风筝有漂亮的蓝色翅膀，尾巴上系着两条长长的红绸带。",
            "小豹子跑到田野上，举着风筝飞快地跑。可风筝刚飞起来一点，就一头栽进了草地。",
            "她捡起来继续跑。又掉了。再跑。又掉了。",
            "风筝的翅膀破了，竹子骨架也松了。小豹子抱着破风筝，鼻子酸酸的。",
            "「不哭不哭，」她对自己说，「坚强的人不怕失败。」",
            "她跑回家，找来胶水和竹签，一点一点地修补。咪咪蹲在旁边，用爪子帮她把胶水按住。",
            "修好了！她又跑回田野。风来了，她松开手——",
            "风筝摇摇晃晃地升上去，越飞越高，越飞越高！蓝色的蝴蝶在天空中翩翩起舞。",
            "小豹子仰着头看，笑得眼睛弯成了月牙。",
            "原来，坚强不是一次就成功，而是摔倒了，还能笑着站起来。",
        ]
    },
    {
        "id": "03-decisiveness",
        "theme": "果断",
        "theme_en": "Decisiveness",
        "title": "小豹子的选择",
        "illustration_hint": "集市上小豹子在两个摊位前犹豫",
        "svg_name": "choice",
        "text": [
            "今天是镇上赶集的日子。外婆给了小豹子十元钱，让她自己买喜欢的东西。",
            "集市上可真热闹！卖糖葫芦的、卖泥人的、卖发卡的……",
            "小豹子东看看西看看，眼睛都快不够用了。",
            "忽然，她在一个摊位上看到一只陶瓷小猫，雪白雪白的，笑眯眯的，像极了她的咪咪。",
            "而另一个摊位上，有一本漂亮的画册，里面的荷花画得跟真的一样。",
            "她看看小猫，又看看画册。两个都想要，可钱只够买一个。",
            "她站在两个摊位中间，左走走，右走走，就是下不了决心。",
            "这时她想起爸爸说过的话——「有时候不是选对的，而是选了之后，让它变成对的。」",
            "小豹子深深吸了一口气，走到陶瓷小猫的摊位前，把钱递了过去。",
            "「我选小猫！」她大声说。说完，她笑了——原来做决定也没有那么难。",
            "回到家，她把小猫放在床头。每天晚上看到它，她都会想起：自己也可以很果断。",
        ]
    },
    {
        "id": "04-persistence",
        "theme": "坚持",
        "theme_en": "Persistence",
        "title": "笛声悠扬",
        "illustration_hint": "小豹子拿着笛子，音符飘出来",
        "svg_name": "flute",
        "text": [
            "爷爷有一根祖传的竹笛，吹出来的声音像山谷里的风。",
            "小豹子也想学。爷爷把笛子递给她：「每天练一点点，总有一天会吹好的。」",
            "小豹子鼓起腮帮子使劲吹——「呜——」像一只受伤的大鹅在叫。",
            "她又吹——「噗——」像放了一个大屁。咪咪吓得从椅子上滚了下来。",
            "小豹子沮丧极了：「太难了！我不学了！」",
            "爷爷笑着说：「第一天就放弃的话，笛子永远也不会唱歌哦。」",
            "小豹子想了想，又把笛子拿起来。",
            "第一天，她吹了五分钟。第二天，十分钟。第三天，她可以吹出一个音阶了。",
            "一个星期后的傍晚，小豹子站在院子里，吹了一首完整的《小星星》。",
            "爷爷在藤椅上閉着眼睛听，嘴角慢慢扬了起来。",
            "邻居家的孩子们都跑过来趴在墙头听。咪咪蹲在她脚边，尾巴一动一动的。",
            "坚持，就是把「太难了」变成「我可以」。",
        ]
    },
    {
        "id": "05-honesty",
        "theme": "诚实",
        "theme_en": "Honesty",
        "title": "花瓶碎了",
        "illustration_hint": "地上有碎花瓶，小豹子站在旁边",
        "svg_name": "vase",
        "text": [
            "那天下午，小豹子在邻居李奶奶家里玩。",
            "李奶奶去厨房端点心，小豹子一个人在客厅里追着咪咪跑。",
            "「别跑——」她伸手一扑，袖子带倒了柜子上的青花瓷瓶。",
            "「啪！」花瓶摔成了好几瓣。",
            "小豹子吓呆了。李奶奶听到声音跑出来，看到地上的碎片，愣住了。",
            "「对不起对不起对不起……」小豹子的声音越来越小。",
            "「没关系，孩子，不是故意的。」李奶奶摸着她的头说。",
            "可小豹子心里还是很难过。她回到家，一个人坐在院子里发呆。",
            "爸爸发现了，坐在她旁边问：「怎么了？」",
            "小豹子憋了一下午的眼泪终于流了出来。她断断续续地讲了整件事。",
            "爸爸擦掉她的眼泪说：「打碎花瓶不是错，但不说实话才是错。你全都告诉我了，这就是诚实。」",
            "第二天，小豹子用自己存的钱买了一个新花瓶送给李奶奶。",
            "李奶奶接过花瓶，笑呵呵地说：「诚实的孩子，比花瓶更珍贵。」",
        ]
    },
    {
        "id": "06-confidence",
        "theme": "自信",
        "theme_en": "Confidence",
        "title": "一周之约",
        "illustration_hint": "小豹子在镜子前练习朗诵",
        "svg_name": "confidence",
        "text": [
            "学校要举办朗诵比赛了。小豹子非常想参加，但她不敢报名。",
            "「我的声音不好听……」她小声对爸爸说。",
            "爸爸想了想，说：「想参加可以。但我们约好——先认真练习整整一个星期，好不好？」",
            "「一个星期？！」小豹子瞪大了眼睛。",
            "「嗯。」爸爸伸出小拇指，「拉钩！」",
            "第一天，小豹子对着镜子念，声音像蚊子哼哼。",
            "第二天，她稍微大声了一点，但还是磕磕巴巴的。",
            "第三天，第四天，第五天……她的声音一天比一天大，一天比一天稳。",
            "第六天晚上，小豹子站在院子里，对着满天的星星，大声朗诵了一遍。",
            "声音清亮亮的，在夜空中传得很远很远。咪咪蹲在她脚边，安静地听着。",
            "第七天，她站上了讲台。台下黑压压的全是人。",
            "她深吸一口气，想起了这一个星期的每一天。她开口了——",
            "她的声音在教室里回荡，那么稳，那么亮。",
            "比赛结束后，爸爸抱了抱她：「你看，你做到了。」",
            "小豹子笑了。她知道了——自信不是天生的，是每一天的坚持堆起来的。",
        ]
    },
    {
        "id": "07-kindness",
        "theme": "善良",
        "theme_en": "Kindness",
        "title": "小鸟回家",
        "illustration_hint": "小豹子给受伤的小鸟包扎",
        "svg_name": "bird",
        "text": [
            "放学的路上，小豹子在石板缝里发现了一只小麻雀。",
            "它蜷缩在地上，翅膀耷拉着，眼睛里满是害怕。",
            "「好可怜……」小豹子轻轻捧起小鸟，发现它的翅膀受伤了。",
            "她本来约好了和小伙伴们去河边捞小鱼。可现在——",
            "「不行，不能丢下你不管。」她把小鸟小心地放进衣兜里，往家跑去。",
            "回到家，她找来了棉花和纱布，笨手笨脚地给小鸟包扎。小鸟疼得叽叽叫，",
            "小豹子轻轻吹着它的羽毛说：「不怕不怕，很快就不疼了。」",
            "接下来的几天，小豹子每天给小鸟喂水和米粒，换纱布。",
            "小伙伴们来找她去玩，她摇摇头：「我得照顾它，它还没有好。」",
            "一个星期后，小鸟的翅膀好了。它在院子里试着飞了一圈，落在小豹子的手心上。",
            "小豹子虽然舍不得，但还是打开了窗户。",
            "「去吧，回家去吧。」",
            "小鸟在窗口停了一下，拍拍翅膀飞走了。",
            "小豹子看着它消失在天边，心里暖暖的。",
            "善良，就是看见别人需要帮助的时候，愿意停下自己的脚步。",
        ]
    },
    {
        "id": "08-acceptance",
        "theme": "包容",
        "theme_en": "Acceptance",
        "title": "新朋友阿依古丽",
        "illustration_hint": "小豹子和新同学手拉手",
        "svg_name": "friendship",
        "text": [
            "新学期，班里来了一位新同学。她的名字叫阿依古丽。",
            "阿依古丽是从新疆来的，她有一头卷卷的头发，大大的眼睛，说话带着好听的西北口音。",
            "「她的名字好奇怪。」「她的衣服跟我们不一样。」有几个同学在悄悄议论。",
            "下课了，阿依古丽一个人坐在座位上，低着头翻书。",
            "小豹子想起了自己刚上一年级时，第一天也不敢说话。",
            "她走过去，笑着问：「你要不要一起去跳房子？」",
            "阿依古丽抬起头，眼睛亮了一下。她轻轻点了点头。",
            "两个小女孩在操场的方格里蹦蹦跳跳。阿依古丽跳得很好，小豹子拍手叫好。",
            "阿依古丽也笑了，从书包里拿出一块馕饼递给小豹子：「这是妈妈做的，可好吃了。」",
            "小豹子咬了一大口：「哇！好香啊！」",
            "她拉着阿依古丽的手说：「以后我们一起玩，好不好？」",
            "阿依古丽用力地点了点头，两个小女孩笑得像两朵花。",
            "包容不是同情，是张开双臂，说一声「欢迎你」。",
        ]
    },
    {
        "id": "09-responsibility",
        "theme": "责任",
        "theme_en": "Responsibility",
        "title": "责任测试",
        "illustration_hint": "小豹子在喂金鱼和叠被子",
        "svg_name": "responsibility",
        "text": [
            "小豹子一直想要一只小狗。她缠着爸爸妈妈喊了大半年。",
            "这天，爸爸妈妈认真地对她说：「养小狗要每天喂食、遛弯、打扫。你能做到吗？」",
            "「能！能！我能！」小豹子跳了起来。",
            "爸爸妈妈对视了一眼，说：「那我们做一个『责任测试』。",
            "连续一个月，你每天自己叠被子、按时喂金鱼。一天都不能漏。",
            "如果能做到，我们就养小狗。」",
            "「一个月？！」小豹子张大嘴巴。但她还是点了点头。",
            "第一周，小豹子每天都记得。早上闹钟一响就爬起来叠被子，放学赶紧喂金鱼。",
            "第二周，有一天早上太冷了，她躲在被窝里不想出来。",
            "可是她想到小狗亮晶晶的眼睛，一咬牙爬了起来。",
            "第三周，有一天她玩得太累了，忘了喂金鱼。晚上躺在床上突然想起来，",
            "她穿着睡衣就冲到客厅去喂。妈妈看到，偷偷笑了。",
            "一个月后，爸爸妈妈站在她面前，手里抱着一个纸箱。",
            "「你做到了。」爸爸说。",
            "纸箱里探出一个小狗脑袋，毛茸茸的，小黑豆一样的眼睛望着小豹子。",
            "小豹子抱起来，眼泪和笑容一起涌了出来。",
            "责任，就是答应的事，再难也要做到。",
        ]
    },
    {
        "id": "10-wisdom",
        "theme": "智慧",
        "theme_en": "Wisdom",
        "title": "三个小罐子",
        "illustration_hint": "三个罐子分别写着花、存、帮",
        "svg_name": "jars",
        "text": [
            "过年的时候，小豹子收到了好多压岁钱。她高兴极了，想全部用来买那个最贵的玩具城堡。",
            "爸爸妈妈没有说「不行」。他们拿出了三个小罐子。",
            "「这三个罐子，一个叫『花』，一个叫『存』，一个叫『帮』。」妈妈说。",
            "爸爸接着说：「每一分钱分成三份——一份可以花、一份存起来、一份去帮助别人。」",
            "「啊？」小豹子撅起了嘴，「凭什么呀？」",
            "但她还是撅着嘴，把钱分成了三份。",
            "很快，「花」罐子里的钱买了一个小风筝，她开心极了。",
            "几个月后，妈妈的生日快到了。小豹子打开「存」罐子——里面有好多硬币了！",
            "她用这些钱给妈妈买了一条温暖的围巾。妈妈围上围巾，眼睛红了，抱了她好久。",
            "又过了不久，学校组织给山区小朋友捐书。小豹子打开了「帮」罐子。",
            "她用里面的钱买了两本图画书。她还在书的扉页上写了：「祝你快乐！——小豹子」",
            "那天晚上，小豹子看着三个越来越满的罐子，忽然明白了爸爸妈妈的用意。",
            "会花钱是本事，会存钱是聪明，会帮别人是幸福。",
            "智慧，不是知道怎么得到，而是知道怎么用。",
        ]
    },
]


# ─── 辅助函数 ───

def text_with_ruby(text):
    """将中文文本转换为带 ruby 拼音标注的 HTML"""
    result = []
    # pypinyin 返回类似 [['xià'], ['wǔ']] 的结构
    pinyin_result = pypinyin.pinyin(text, style=pypinyin.Style.TONE3, neutral_tone_with_five=True)
    # pypinyin 按字符返回拼音列表，与 text 一一对应
    for i, ch in enumerate(text):
        if '\u4e00' <= ch <= '\u9fff' or '\u3400' <= ch <= '\u4dbf':
            # 中文汉字
            if i < len(pinyin_result):
                py = pinyin_result[i][0]
                # 把 tone3 转成带声调符号（用 pypinyin 自己的 Style.TONE）
                pass
        # 先直接用 Style.TONE 重新做
    return None

def get_pinyin_syllable(char):
    """获取单个汉字的拼音（带声调）"""
    if not ('\u4e00' <= char <= '\u9fff' or '\u3400' <= char <= '\u4dbf'):
        return None
    result = pypinyin.pinyin(char, style=pypinyin.Style.TONE)
    if result and result[0]:
        return result[0][0]
    return None

def to_ruby_html(text):
    """将中文文本转为带 ruby 拼音标注的 HTML"""
    parts = []
    for char in text:
        if '\u4e00' <= char <= '\u9fff' or '\u3400' <= char <= '\u4dbf':
            py = get_pinyin_syllable(char)
            if py:
                parts.append(f'<ruby>{char}<rt>{py}</rt></ruby>')
            else:
                parts.append(html.escape(char))
        else:
            parts.append(html.escape(char))
    return ''.join(parts)


# ─── SVG 插画生成 ───

SVG_WIDTH = 450
SVG_HEIGHT = 300

def _svg_wrap(content, viewbox="0 0 450 300"):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" width="100%" height="100%" style="display:block;max-width:450px;margin:0 auto;">\n{content}\n</svg>'

def svg_courage():
    """勇敢 - 小豹子摇头说不"""
    return _svg_wrap(f"""
  <defs>
    <style>@import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&amp;display=swap');</style>
  </defs>
  <!-- 背景天空 -->
  <rect x="0" y="0" width="450" height="300" fill="#fef8e7" rx="8"/>
  <!-- 远处房屋 -->
  <rect x="20" y="180" width="80" height="70" fill="#e8d5b0" stroke="#8b7355" stroke-width="1.5" rx="3"/>
  <polygon points="20,180 60,140 100,180" fill="#c45a3c" stroke="#8b7355" stroke-width="1.5"/>
  <rect x="45" y="215" width="20" height="35" fill="#6b5b45" rx="2"/>
  <!-- 枇杷树 -->
  <line x1="320" y1="280" x2="320" y2="120" stroke="#5a7a4a" stroke-width="4"/>
  <ellipse cx="320" cy="100" rx="60" ry="70" fill="#7a9a5a" opacity="0.7"/>
  <circle cx="295" cy="85" r="6" fill="#e8a030"/>
  <circle cx="310" cy="75" r="5" fill="#e8a030"/>
  <circle cx="335" cy="80" r="6" fill="#e8a030"/>
  <circle cx="320" cy="95" r="5" fill="#e8a030"/>
  <circle cx="345" cy="98" r="4" fill="#e8a030"/>
  <circle cx="290" cy="100" r="4" fill="#e8a030"/>
  <!-- 围墙 -->
  <rect x="230" y="150" width="10" height="130" fill="#c4a882" stroke="#8b7355" stroke-width="1.5"/>
  <rect x="240" y="170" width="100" height="8" fill="#c4a882" stroke="#8b7355" stroke-width="1.5"/>
  <!-- 小豹子 -->
  <!-- 身体 -->
  <circle cx="140" cy="200" r="25" fill="#f0c8a0"/>
  <!-- 头 -->
  <circle cx="140" cy="170" r="22" fill="#f5d8b8"/>
  <!-- 头发 -->
  <path d="M118,165 Q125,145 140,142 Q155,145 162,165" fill="#3a2a1a"/>
  <path d="M118,165 Q120,155 125,150" fill="none" stroke="#3a2a1a" stroke-width="3"/>
  <!-- 辫子 -->
  <path d="M118,168 Q105,175 108,195 Q110,210 115,215" fill="none" stroke="#3a2a1a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="115" cy="217" r="3" fill="#e06060"/>
  <!-- 眼睛 -->
  <circle cx="133" cy="168" r="3.5" fill="#3a2a1a"/>
  <circle cx="147" cy="168" r="3.5" fill="#3a2a1a"/>
  <!-- 嘴巴 - 坚定的表情 -->
  <path d="M135,178 Q140,176 145,178" fill="none" stroke="#b06060" stroke-width="2" stroke-linecap="round"/>
  <!-- 眉毛 - 坚定的 -->
  <path d="M128,161 Q133,158 137,160" fill="none" stroke="#3a2a1a" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M143,160 Q147,158 152,161" fill="none" stroke="#3a2a1a" stroke-width="1.8" stroke-linecap="round"/>
  <!-- 衣服 -->
  <path d="M120,195 L125,220 L155,220 L160,195" fill="#e888a0" stroke="#c06070" stroke-width="1.5"/>
  <!-- 手臂 - 交叉表示拒绝 -->
  <path d="M120,198 Q115,205 125,210" fill="none" stroke="#f0c8a0" stroke-width="6" stroke-linecap="round"/>
  <path d="M160,198 Q165,205 155,210" fill="none" stroke="#f0c8a0" stroke-width="6" stroke-linecap="round"/>
  <!-- 腿 -->
  <rect x="130" y="220" width="8" height="30" fill="#5a7a9a" rx="3"/>
  <rect x="142" y="220" width="8" height="30" fill="#5a7a9a" rx="3"/>
  <!-- 鞋子 -->
  <ellipse cx="134" cy="252" rx="10" ry="5" fill="#4a3a2a"/>
  <ellipse cx="146" cy="252" rx="10" ry="5" fill="#4a3a2a"/>
  <!-- 对话框 -->
  <path d="M175,155 Q210,145 215,155 Q220,165 210,170 L205,180 L195,172 Q180,175 175,165 Z" fill="white" stroke="#8b7355" stroke-width="1.2"/>
  <text x="190" y="165" font-size="11" fill="#c45a3c" text-anchor="middle" font-family="sans-serif">我不去！</text>
  <!-- 咪咪 -->
  <ellipse cx="90" cy="248" rx="18" ry="10" fill="#e8a040"/>
  <circle cx="90" cy="235" r="12" fill="#e8a040"/>
  <ellipse cx="81" cy="232" rx="4" ry="3" fill="white"/>
  <ellipse cx="81" cy="232" rx="2" ry="2" fill="#3a2a1a"/>
  <ellipse cx="99" cy="232" rx="4" ry="3" fill="white"/>
  <ellipse cx="99" cy="232" rx="2" ry="2" fill="#3a2a1a"/>
  <ellipse cx="90" cy="239" rx="2" ry="1.5" fill="#e07070"/>
  <!-- 猫条纹 -->
  <path d="M84,225 Q90,222 96,225" fill="none" stroke="#c08030" stroke-width="1.5"/>
  <path d="M86,230 Q90,228 94,230" fill="none" stroke="#c08030" stroke-width="1.5"/>
  <!-- 猫尾巴 -->
  <path d="M72,245 Q55,235 60,220 Q62,213 65,215" fill="none" stroke="#e8a040" stroke-width="4" stroke-linecap="round"/>
  <line x1="65" y1="215" x2="68" y2="213" stroke="#c08030" stroke-width="2.5" stroke-linecap="round"/>
""")

def svg_kite():
    """坚强 - 风筝飞起来"""
    return _svg_wrap(f"""
  <rect x="0" y="0" width="450" height="300" fill="#e8f4f8" rx="8"/>
  <!-- 天空云朵 -->
  <ellipse cx="80" cy="50" rx="40" ry="20" fill="white" opacity="0.8"/>
  <ellipse cx="120" cy="40" rx="30" ry="18" fill="white" opacity="0.8"/>
  <ellipse cx="350" cy="60" rx="45" ry="22" fill="white" opacity="0.7"/>
  <!-- 地面 -->
  <rect x="0" y="240" width="450" height="60" fill="#8ab87a"/>
  <path d="M0,240 Q50,230 100,240 Q150,250 200,240 Q250,230 300,240 Q350,250 400,240 Q430,233 450,240" fill="none" stroke="#7aaa6a" stroke-width="2"/>
  <!-- 小花 -->
  <circle cx="50" cy="255" r="4" fill="#f0e060"/>
  <circle cx="380" cy="250" r="4" fill="#f09090"/>
  <circle cx="300" cy="260" r="3" fill="#f0e060"/>
  <!-- 飞得很高的风筝 -->
  <g transform="translate(250,55) rotate(-15)">
    <polygon points="0,-20 -25,10 0,25 25,10" fill="#68a8d0" stroke="#4a7a9a" stroke-width="1.5"/>
    <polygon points="0,-20 -25,10 0,25 25,10" fill="none" stroke="#4a7a9a" stroke-width="0.5" stroke-dasharray="3,3"/>
    <polygon points="-12,0 0,-10 12,0" fill="#e888a0" opacity="0.6"/>
    <!-- 蝴蝶结装饰 -->
    <circle cx="0" cy="-5" r="3" fill="#e06060"/>
    <!-- 尾巴 -->
    <path d="M0,25 Q-8,40 0,50 Q8,60 0,70" fill="none" stroke="#e888a0" stroke-width="2"/>
    <path d="M0,70 Q-5,78 3,84" fill="none" stroke="#e06060" stroke-width="2.5"/>
  </g>
  <!-- 风筝线 -->
  <path d="M250,55 Q280,140 300,200 Q310,225 320,240" fill="none" stroke="#8b7355" stroke-width="0.8" stroke-dasharray="4,3"/>
  <!-- 小豹子 -->
  <circle cx="325" cy="248" r="22" fill="#f5d8b8"/>
  <path d="M303,243 Q310,223 325,220 Q340,223 347,243" fill="#3a2a1a"/>
  <path d="M303,243 Q305,233 310,228" fill="none" stroke="#3a2a1a" stroke-width="3"/>
  <path d="M303,246 Q290,252 293,272 Q295,285 300,290" fill="none" stroke="#3a2a1a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="300" cy="292" r="3" fill="#e06060"/>
  <circle cx="318" cy="246" r="3" fill="#3a2a1a"/>
  <circle cx="332" cy="246" r="3" fill="#3a2a1a"/>
  <path d="M320,255 Q325,258 330,255" fill="none" stroke="#b06060" stroke-width="2" stroke-linecap="round"/>
  <!-- 衣服 -->
  <path d="M305,260 L310,285 L340,285 L345,260" fill="#f0d060" stroke="#c0a040" stroke-width="1.5"/>
  <rect x="315" y="285" width="8" height="25" fill="#5a7a9a" rx="3"/>
  <rect x="327" y="285" width="8" height="25" fill="#5a7a9a" rx="3"/>
  <ellipse cx="319" cy="312" rx="9" ry="4" fill="#4a3a2a"/>
  <ellipse cx="331" cy="312" rx="9" ry="4" fill="#4a3a2a"/>
  <!-- 绳子上的补丁标记 -->
  <rect x="288" y="165" width="12" height="8" fill="#e8a040" rx="2" transform="rotate(8,294,169)" opacity="0.7"/>
  <line x1="290" y1="167" x2="298" y2="167" stroke="#c08030" stroke-width="0.8" transform="rotate(8,294,169)"/>
  <line x1="294" y1="165" x2="294" y2="173" stroke="#c08030" stroke-width="0.8" transform="rotate(8,294,169)"/>
""")

def svg_choice():
    """果断 - 小豹子的选择"""
    return _svg_wrap(f"""
  <rect x="0" y="0" width="450" height="300" fill="#fef8e7" rx="8"/>
  <!-- 背景 - 集市氛围 -->
  <rect x="0" y="0" width="450" height="35" fill="#e8d5b0"/>
  <text x="225" y="24" font-size="16" fill="#6b5b45" text-anchor="middle" font-family="sans-serif" font-weight="bold">热闹的集市</text>
  <!-- 小豹子站在中间 -->
  <circle cx="225" cy="210" r="22" fill="#f5d8b8"/>
  <path d="M203,205 Q210,185 225,182 Q240,185 247,205" fill="#3a2a1a"/>
  <path d="M203,205 Q205,195 210,190" fill="none" stroke="#3a2a1a" stroke-width="3"/>
  <path d="M203,208 Q190,214 193,234 Q195,247 200,252" fill="none" stroke="#3a2a1a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="200" cy="254" r="3" fill="#e06060"/>
  <circle cx="218" cy="208" r="3.5" fill="#3a2a1a"/>
  <circle cx="232" cy="208" r="3.5" fill="#3a2a1a"/>
  <!-- 纠结的眉毛 -->
  <path d="M213,200 Q216,198 220,200" fill="none" stroke="#3a2a1a" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M230,200 Q234,198 237,200" fill="none" stroke="#3a2a1a" stroke-width="1.8" stroke-linecap="round"/>
  <!-- 纠结的嘴巴 -->
  <ellipse cx="225" cy="220" rx="5" ry="4" fill="none" stroke="#b06060" stroke-width="1.5"/>
  <!-- 举起的一根手指 -->
  <path d="M245,205 Q255,195 258,188" fill="none" stroke="#f0c8a0" stroke-width="6" stroke-linecap="round"/>
  <!-- ? 符号 -->
  <text x="265" y="185" font-size="22" fill="#e8a030" font-family="sans-serif" font-weight="bold">?</text>
  <text x="275" y="175" font-size="18" fill="#e8a030" font-family="sans-serif" font-weight="bold">?</text>
  <text x="260" y="200" font-size="16" fill="#e8a030" font-family="sans-serif" font-weight="bold">?</text>
  <!-- 衣服 -->
  <path d="M205,220 L210,245 L240,245 L245,220" fill="#68a8d0" stroke="#4a7a9a" stroke-width="1.5"/>
  <rect x="215" y="245" width="8" height="25" fill="#5a7a9a" rx="3"/>
  <rect x="227" y="245" width="8" height="25" fill="#5a7a9a" rx="3"/>
  <ellipse cx="219" cy="272" rx="9" ry="4" fill="#4a3a2a"/>
  <ellipse cx="231" cy="272" rx="9" ry="4" fill="#4a3a2a"/>
  <!-- 左边 - 陶瓷小猫 -->
  <g transform="translate(80, 170)">
    <ellipse cx="0" cy="25" rx="18" ry="8" fill="#f0f0f0" stroke="#aaa" stroke-width="1"/>
    <circle cx="0" cy="5" r="14" fill="#f0f0f0" stroke="#aaa" stroke-width="1"/>
    <ellipse cx="-5" cy="3" rx="3" ry="2.5" fill="#3a2a1a"/>
    <ellipse cx="5" cy="3" rx="3" ry="2.5" fill="#3a2a1a"/>
    <ellipse cx="0" cy="8" rx="2" ry="1.5" fill="#e07070"/>
    <path d="M-8,-3 L-12,-10" stroke="#aaa" stroke-width="1.5"/>
    <path d="M8,-3 L12,-10" stroke="#aaa" stroke-width="1.5"/>
    <path d="M-14,20 Q-22,22 -25,18" fill="none" stroke="#f0f0f0" stroke-width="3" stroke-linecap="round"/>
    <rect x="-10" y="23" width="20" height="12" fill="#f0f0f0" stroke="#aaa" stroke-width="0.8" rx="2"/>
  </g>
  <text x="80" y="215" font-size="10" fill="#6b5b45" text-anchor="middle" font-family="sans-serif">陶瓷小猫</text>
  <text x="80" y="228" font-size="9" fill="#c45a3c" text-anchor="middle" font-family="sans-serif">5元</text>
  <!-- 右边 - 画册 -->
  <g transform="translate(350, 160)">
    <rect x="-20" y="-15" width="40" height="50" fill="#f8f0e0" stroke="#8b7355" stroke-width="1.5" rx="2"/>
    <rect x="-16" y="-11" width="32" height="42" fill="white" rx="1"/>
    <!-- 画册上的荷花图案 -->
    <ellipse cx="4" cy="10" rx="8" ry="6" fill="#e8a0b0"/>
    <ellipse cx="4" cy="10" rx="5" ry="3.5" fill="#f0c0c8"/>
    <g transform="translate(0,18)">
      <ellipse cx="-5" cy="0" rx="7" ry="3" fill="#5a8a5a"/>
      <ellipse cx="5" cy="0" rx="6" ry="3" fill="#5a8a5a"/>
      <ellipse cx="10" cy="-1" rx="5" ry="2" fill="#5a8a5a"/>
    </g>
  </g>
  <text x="350" y="230" font-size="10" fill="#6b5b45" text-anchor="middle" font-family="sans-serif">荷花画册</text>
  <text x="350" y="243" font-size="9" fill="#c45a3c" text-anchor="middle" font-family="sans-serif">5元</text>
  <!-- 上方思路 -->
  <path d="M180,160 Q200,145 220,155" fill="none" stroke="#e8a030" stroke-width="1.5" stroke-dasharray="3,3"/>
  <path d="M270,160 Q250,145 230,155" fill="none" stroke="#e8a030" stroke-width="1.5" stroke-dasharray="3,3"/>
""")

def svg_flute():
    """坚持 - 笛声悠扬"""
    return _svg_wrap(f"""
  <rect x="0" y="0" width="450" height="300" fill="#fefce8" rx="8"/>
  <!-- 院子场景 -->
  <rect x="0" y="220" width="450" height="80" fill="#d0b890"/>
  <rect x="0" y="215" width="450" height="10" fill="#b8a070"/>
  <!-- 竹篱笆 -->
  <line x1="20" y1="215" x2="20" y2="120" stroke="#8a7a50" stroke-width="3"/>
  <line x1="35" y1="215" x2="35" y2="130" stroke="#8a7a50" stroke-width="2.5"/>
  <line x1="50" y1="215" x2="50" y2="125" stroke="#8a7a50" stroke-width="2.5"/>
  <line x1="30" y1="160" x2="55" y2="160" stroke="#8a7a50" stroke-width="1.5"/>
  <line x1="25" y1="190" x2="55" y2="190" stroke="#8a7a50" stroke-width="1.5"/>
  <!-- 小豹子 -->
  <circle cx="240" cy="180" r="22" fill="#f5d8b8"/>
  <path d="M218,175 Q225,155 240,152 Q255,155 262,175" fill="#3a2a1a"/>
  <path d="M218,175 Q220,165 225,160" fill="none" stroke="#3a2a1a" stroke-width="3"/>
  <path d="M218,178 Q205,184 208,204 Q210,217 215,222" fill="none" stroke="#3a2a1a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="215" cy="224" r="3" fill="#e06060"/>
  <circle cx="233" cy="178" r="3" fill="#3a2a1a"/>
  <circle cx="247" cy="178" r="3" fill="#3a2a1a"/>
  <path d="M235,188 Q240,190 245,188" fill="none" stroke="#b06060" stroke-width="2" stroke-linecap="round"/>
  <!-- 闭眼陶醉 -->
  <path d="M233,178 Q233,182 233,182" fill="none" stroke="#3a2a1a" stroke-width="0"/>
  <path d="M247,178 L247,182" fill="none" stroke="#3a2a1a" stroke-width="1.5"/>
  <!-- 衣服 -->
  <path d="M218,195 L224,220 L256,220 L262,195" fill="#e888a0" stroke="#c06070" stroke-width="1.5"/>
  <!-- 拿笛子的双手 -->
  <path d="M240,195 L240,210" fill="none" stroke="#f0c8a0" stroke-width="5" stroke-linecap="round"/>
  <path d="M255,200 Q265,205 268,210" fill="none" stroke="#f0c8a0" stroke-width="5" stroke-linecap="round"/>
  <!-- 竹笛 -->
  <rect x="236" y="190" width="4" height="60" fill="#c8a050" stroke="#8a7030" stroke-width="1" rx="2" transform="rotate(15,238,215)"/>
  <line x1="240" y1="200" x2="242" y2="200" stroke="#8a7030" stroke-width="0.8" transform="rotate(15,238,215)"/>
  <line x1="241" y1="210" x2="243" y2="210" stroke="#8a7030" stroke-width="0.8" transform="rotate(15,238,215)"/>
  <line x1="242" y1="220" x2="244" y2="220" stroke="#8a7030" stroke-width="0.8" transform="rotate(15,238,215)"/>
  <line x1="243" y1="230" x2="245" y2="230" stroke="#8a7030" stroke-width="0.8" transform="rotate(15,238,215)"/>
  <!-- 腿 -->
  <rect x="228" y="220" width="8" height="25" fill="#5a7a9a" rx="3"/>
  <rect x="240" y="220" width="8" height="25" fill="#5a7a9a" rx="3"/>
  <ellipse cx="232" cy="247" rx="9" ry="4" fill="#4a3a2a"/>
  <ellipse cx="244" cy="247" rx="9" ry="4" fill="#4a3a2a"/>
  <!-- 音符 -->
  <g fill="#e06060" opacity="0.8">
    <text x="280" y="160" font-size="24" font-family="serif">♪</text>
    <text x="310" y="140" font-size="20" font-family="serif">♫</text>
    <text x="340" y="155" font-size="22" font-family="serif">♪</text>
    <text x="300" y="180" font-size="18" font-family="serif">♩</text>
    <text x="360" y="135" font-size="16" font-family="serif">♬</text>
  </g>
  <!-- 咪咪在地上打滚 -->
  <ellipse cx="140" cy="248" rx="16" ry="9" fill="#e8a040"/>
  <circle cx="140" cy="235" r="10" fill="#e8a040"/>
  <ellipse cx="134" cy="233" rx="3.5" ry="2.5" fill="white"/>
  <ellipse cx="134" cy="233" rx="1.8" ry="1.8" fill="#3a2a1a"/>
  <ellipse cx="146" cy="233" rx="3.5" ry="2.5" fill="white"/>
  <ellipse cx="146" cy="233" rx="1.8" ry="1.8" fill="#3a2a1a"/>
  <ellipse cx="140" cy="239" rx="1.8" ry="1.2" fill="#e07070"/>
  <path d="M134,226 Q140,223 146,226" fill="none" stroke="#c08030" stroke-width="1.5"/>
  <path d="M128,245 Q115,238 110,225 Q108,218 112,218" fill="none" stroke="#e8a040" stroke-width="3.5" stroke-linecap="round"/>
  <!-- 爷爷的藤椅 -->
  <rect x="55" y="178" width="5" height="40" fill="#8a7a50" rx="2"/>
  <rect x="95" y="178" width="5" height="40" fill="#8a7a50" rx="2"/>
  <path d="M55,180 Q75,170 95,180" fill="none" stroke="#8a7a50" stroke-width="2.5"/>
  <path d="M55,190 Q75,185 95,190" fill="none" stroke="#8a7a50" stroke-width="2"/>
  <ellipse cx="75" cy="178" rx="10" ry="6" fill="#e0d0b0" stroke="#8a7a50" stroke-width="1">
    <animateTransform attributeName="transform" type="rotate" values="-3,75,178;3,75,178;-3,75,178" dur="2s" repeatCount="indefinite"/>
  </ellipse>
  <!-- 爷爷闭眼 -->
  <circle cx="80" cy="170" r="10" fill="#f0d8c0" opacity="0.6"/>
""")

def svg_vase():
    """诚实 - 花瓶碎了"""
    return _svg_wrap(f"""
  <rect x="0" y="0" width="450" height="300" fill="#faf5ee" rx="8"/>
  <!-- 背景房间 -->
  <rect x="0" y="180" width="450" height="120" fill="#d8c8a8"/>
  <rect x="0" y="175" width="450" height="10" fill="#c8b898"/>
  <!-- 窗户 -->
  <rect x="30" y="60" width="80" height="100" fill="#b0d8f0" stroke="#8b7355" stroke-width="3" rx="3"/>
  <line x1="70" y1="60" x2="70" y2="160" stroke="#8b7355" stroke-width="2"/>
  <line x1="30" y1="110" x2="110" y2="110" stroke="#8b7355" stroke-width="2"/>
  <!-- 柜子 -->
  <rect x="150" y="150" width="100" height="60" fill="#a08060" stroke="#8b7355" stroke-width="2" rx="2"/>
  <!-- 碎花瓶 -->
  <path d="M180,180 L190,155 L200,148 L210,155 L215,180" fill="#4a7a9a" stroke="#3a5a7a" stroke-width="1.5" opacity="0.6"/>
  <!-- 碎片 -->
  <polygon points="170,190 175,182 180,188" fill="#4a7a9a" stroke="#3a5a7a" stroke-width="1" opacity="0.6"/>
  <polygon points="195,185 200,178 208,183 202,190" fill="#4a7a9a" stroke="#3a5a7a" stroke-width="1" opacity="0.6"/>
  <polygon points="185,195 190,190 195,196" fill="#4a7a9a" stroke="#3a5a7a" stroke-width="1" opacity="0.6"/>
  <polygon points="175,175 178,170 182,173" fill="#4a7a9a" stroke="#3a5a7a" stroke-width="1" opacity="0.6"/>
  <polygon points="210,182 214,176 218,180" fill="#4a7a9a" stroke="#3a5a7a" stroke-width="1" opacity="0.6"/>
  <!-- 小豹子 -->
  <circle cx="300" cy="190" r="22" fill="#f5d8b8"/>
  <path d="M278,185 Q285,165 300,162 Q315,165 322,185" fill="#3a2a1a"/>
  <path d="M278,185 Q280,175 285,170" fill="none" stroke="#3a2a1a" stroke-width="3"/>
  <path d="M278,188 Q265,194 268,214 Q270,227 275,232" fill="none" stroke="#3a2a1a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="275" cy="234" r="3" fill="#e06060"/>
  <circle cx="293" cy="188" r="3.5" fill="#3a2a1a"/>
  <circle cx="307" cy="188" r="3.5" fill="#3a2a1a"/>
  <!-- 害怕的眼睛 - 瞳孔缩小 -->
  <circle cx="293" cy="188" r="2" fill="white"/>
  <circle cx="307" cy="188" r="2" fill="white"/>
  <!-- 难过的嘴巴 -->
  <path d="M295,200 Q300,203 305,200" fill="none" stroke="#b06060" stroke-width="2" stroke-linecap="round"/>
  <!-- 眉头紧皱 -->
  <path d="M288,181 Q293,179 296,182" fill="none" stroke="#3a2a1a" stroke-width="2" stroke-linecap="round"/>
  <path d="M304,182 Q307,179 312,181" fill="none" stroke="#3a2a1a" stroke-width="2" stroke-linecap="round"/>
  <!-- 眼泪 -->
  <circle cx="290" cy="196" r="1.5" fill="#68a8d0" opacity="0.6"/>
  <circle cx="310" cy="196" r="1.5" fill="#68a8d0" opacity="0.6"/>
  <!-- 衣服 -->
  <path d="M278,205 L283,230 L317,230 L322,205" fill="#f0d060" stroke="#c0a040" stroke-width="1.5"/>
  <!-- 手 - 捂着脸 -->
  <path d="M285,198 Q280,192 286,186" fill="none" stroke="#f0c8a0" stroke-width="6" stroke-linecap="round"/>
  <!-- 腿 -->
  <rect x="290" y="230" width="8" height="25" fill="#5a7a9a" rx="3"/>
  <rect x="302" y="230" width="8" height="25" fill="#5a7a9a" rx="3"/>
  <ellipse cx="294" cy="257" rx="9" ry="4" fill="#4a3a2a"/>
  <ellipse cx="306" cy="257" rx="9" ry="4" fill="#4a3a2a"/>
  <!-- 咪咪躲在一边 -->
  <ellipse cx="370" cy="255" rx="14" ry="8" fill="#e8a040"/>
  <circle cx="370" cy="244" r="9" fill="#e8a040"/>
  <ellipse cx="366" cy="242" rx="3" ry="2" fill="white"/>
  <ellipse cx="366" cy="242" rx="1.5" ry="1.5" fill="#3a2a1a"/>
  <ellipse cx="374" cy="242" rx="3" ry="2" fill="white"/>
  <ellipse cx="374" cy="242" rx="1.5" ry="1.5" fill="#3a2a1a"/>
  <ellipse cx="370" cy="247" rx="1.5" ry="1" fill="#e07070"/>
  <path d="M362,253 Q355,250 352,242 Q351,238 354,237" fill="none" stroke="#e8a040" stroke-width="3" stroke-linecap="round"/>
""")

def svg_confidence():
    """自信 - 一周之约"""
    return _svg_wrap(f"""
  <rect x="0" y="0" width="450" height="300" fill="#f8f0f8" rx="8"/>
  <!-- 讲台场景 -->
  <rect x="150" y="210" width="150" height="20" fill="#c8b898" stroke="#8b7355" stroke-width="1.5" rx="3"/>
  <!-- 背景幕布 -->
  <rect x="40" y="30" width="370" height="180" fill="#d06070" opacity="0.8" rx="5"/>
  <path d="M40,30 Q60,60 80,30" fill="#c05060"/>
  <path d="M370,30 Q390,60 410,30" fill="#c05060"/>
  <path d="M40,210 Q60,180 80,210" fill="#c05060"/>
  <path d="M370,210 Q390,180 410,210" fill="#c05060"/>
  <!-- 小豹子在讲台上 -->
  <circle cx="225" cy="170" r="22" fill="#f5d8b8"/>
  <path d="M203,165 Q210,145 225,142 Q240,145 247,165" fill="#3a2a1a"/>
  <path d="M203,165 Q205,155 210,150" fill="none" stroke="#3a2a1a" stroke-width="3"/>
  <path d="M203,168 Q190,174 193,194 Q195,207 200,212" fill="none" stroke="#3a2a1a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="200" cy="214" r="3" fill="#e06060"/>
  <circle cx="218" cy="168" r="3" fill="#3a2a1a"/>
  <circle cx="232" cy="168" r="3" fill="#3a2a1a"/>
  <!-- 自信的表情 -->
  <path d="M220,178 Q225,181 230,178" fill="none" stroke="#c06060" stroke-width="2" stroke-linecap="round"/>
  <path d="M213,161 Q216,158 220,160" fill="none" stroke="#3a2a1a" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M230,160 Q234,158 237,161" fill="none" stroke="#3a2a1a" stroke-width="1.8" stroke-linecap="round"/>
  <!-- 衣服（演出服） -->
  <path d="M205,180 L210,205 L240,205 L245,180" fill="#e888a0" stroke="#c06070" stroke-width="1.5"/>
  <circle cx="225" cy="190" r="4" fill="#f0d060" stroke="#c0a040" stroke-width="0.8"/>
  <!-- 手 - 张开 -->
  <path d="M205,185 Q190,190 185,195" fill="none" stroke="#f0c8a0" stroke-width="5" stroke-linecap="round"/>
  <path d="M245,185 Q260,190 265,195" fill="none" stroke="#f0c8a0" stroke-width="5" stroke-linecap="round"/>
  <!-- 腿 -->
  <rect x="216" y="205" width="7" height="22" fill="#5a7a9a" rx="3"/>
  <rect x="227" y="205" width="7" height="22" fill="#5a7a9a" rx="3"/>
  <ellipse cx="220" cy="229" rx="8" ry="3.5" fill="#4a3a2a"/>
  <ellipse cx="230" cy="229" rx="8" ry="3.5" fill="#4a3a2a"/>
  <!-- 舞台灯光 -->
  <g opacity="0.3">
    <polygon points="225,30 180,170 270,170" fill="#f8e880"/>
  </g>
  <!-- 星空背景效果 -->
  <circle cx="100" cy="70" r="2" fill="white" opacity="0.7"/>
  <circle cx="350" cy="55" r="2" fill="white" opacity="0.7"/>
  <circle cx="280" cy="45" r="1.5" fill="white" opacity="0.5"/>
  <circle cx="150" cy="50" r="1.5" fill="white" opacity="0.5"/>
  <!-- 台下的爸爸妈妈 -->
  <!-- 爸爸 -->
  <circle cx="100" cy="260" r="15" fill="#f0d8b8"/>
  <rect x="88" y="268" width="24" height="25" fill="#5a7a9a" rx="2"/>
  <circle cx="95" cy="258" r="2.5" fill="#3a2a1a"/>
  <circle cx="105" cy="258" r="2.5" fill="#3a2a1a"/>
  <path d="M96,265 Q100,267 104,265" fill="none" stroke="#b06060" stroke-width="1.5" stroke-linecap="round"/>
  <!-- 妈妈 -->
  <circle cx="350" cy="260" r="14" fill="#f5d8b8"/>
  <rect x="338" y="267" width="24" height="23" fill="#e888a0" rx="2"/>
  <circle cx="345" cy="258" r="2.5" fill="#3a2a1a"/>
  <circle cx="355" cy="258" r="2.5" fill="#3a2a1a"/>
  <path d="M346,265 Q350,267 354,265" fill="none" stroke="#c06060" stroke-width="1.5" stroke-linecap="round"/>
  <!-- 鼓掌的手 -->
  <path d="M112,272 Q118,268 122,272" fill="none" stroke="#f0d8b8" stroke-width="4" stroke-linecap="round"/>
  <path d="M362,272 Q365,270 368,272" fill="none" stroke="#f5d8b8" stroke-width="4" stroke-linecap="round"/>
""")

def svg_bird():
    """善良 - 小鸟回家"""
    return _svg_wrap(f"""
  <rect x="0" y="0" width="450" height="300" fill="#f0f8e8" rx="8"/>
  <!-- 窗外天空 -->
  <rect x="200" y="10" width="240" height="180" fill="#b8d8f0" rx="3"/>
  <!-- 窗框 -->
  <rect x="195" y="5" width="250" height="190" fill="none" stroke="#8a7a50" stroke-width="4" rx="4"/>
  <line x1="320" y1="5" x2="320" y2="195" stroke="#8a7a50" stroke-width="3"/>
  <line x1="195" y1="100" x2="445" y2="100" stroke="#8a7a50" stroke-width="3"/>
  <!-- 窗外有蓝天白云 -->
  <ellipse cx="370" cy="40" rx="35" ry="15" fill="white" opacity="0.8"/>
  <ellipse cx="260" cy="30" rx="25" ry="12" fill="white" opacity="0.6"/>
  <!-- 窗外飞走的小鸟（远处） -->
  <g transform="translate(380, 55)">
    <ellipse cx="0" cy="0" rx="8" ry="5" fill="#8a6a40"/>
    <path d="M-5,0 Q-10,-8 -15,-12" fill="none" stroke="#8a6a40" stroke-width="2"/>
    <path d="M-5,0 Q-10,5 -15,8" fill="none" stroke="#8a6a40" stroke-width="2"/>
  </g>
  <!-- 室内 -->
  <rect x="0" y="195" width="450" height="105" fill="#e8d8b8"/>
  <!-- 桌子 -->
  <rect x="120" y="240" width="180" height="8" fill="#a08060" stroke="#8b7355" stroke-width="1.5" rx="2"/>
  <rect x="135" y="248" width="6" height="30" fill="#8b7355"/>
  <rect x="280" y="248" width="6" height="30" fill="#8b7355"/>
  <!-- 小豹子 -->
  <circle cx="200" cy="205" r="22" fill="#f5d8b8"/>
  <path d="M178,200 Q185,180 200,177 Q215,180 222,200" fill="#3a2a1a"/>
  <path d="M178,200 Q180,190 185,185" fill="none" stroke="#3a2a1a" stroke-width="3"/>
  <path d="M178,203 Q165,209 168,229 Q170,242 175,247" fill="none" stroke="#3a2a1a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="175" cy="249" r="3" fill="#e06060"/>
  <circle cx="193" cy="203" r="3" fill="#3a2a1a"/>
  <circle cx="207" cy="203" r="3" fill="#3a2a1a"/>
  <!-- 温柔的笑眼 -->
  <path d="M190,201 Q193,199 196,201" fill="none" stroke="#3a2a1a" stroke-width="1.5"/>
  <path d="M204,201 Q207,199 210,201" fill="none" stroke="#3a2a1a" stroke-width="1.5"/>
  <!-- 微笑 -->
  <path d="M195,210 Q200,213 205,210" fill="none" stroke="#b06060" stroke-width="1.8" stroke-linecap="round"/>
  <!-- 衣服 -->
  <path d="M178,215 L183,240 L217,240 L222,215" fill="#68a8d0" stroke="#4a7a9a" stroke-width="1.5"/>
  <!-- 双手捧着鸟 -->
  <path d="M190,220 Q185,228 190,235" fill="none" stroke="#f0c8a0" stroke-width="5" stroke-linecap="round"/>
  <path d="M210,220 Q215,228 210,235" fill="none" stroke="#f0c8a0" stroke-width="5" stroke-linecap="round"/>
  <!-- 手中的小鸟 -->
  <g transform="translate(200, 228)">
    <ellipse cx="0" cy="0" rx="10" ry="7" fill="#c8a060"/>
    <circle cx="-5" cy="-3" r="4" fill="#c8a060"/>
    <circle cx="-6.5" cy="-4.5" r="1.5" fill="#3a2a1a"/>
    <path d="M-4,-2 L-2,-4" fill="none" stroke="#e8a030" stroke-width="0.8"/>
    <path d="M8,3 L14,0" fill="none" stroke="#c8a060" stroke-width="2.5"/>
    <path d="M8,3 L14,6" fill="none" stroke="#c8a060" stroke-width="2.5"/>
    <!-- 翅膀上的绷带 -->
    <rect x="-2" y="-2" width="6" height="3" fill="white" rx="1" opacity="0.8"/>
    <line x1="0" y1="-2" x2="0" y2="1" stroke="#ccc" stroke-width="0.5"/>
  </g>
  <!-- 腿 -->
  <rect x="190" y="240" width="7" height="22" fill="#5a7a9a" rx="3"/>
  <rect x="202" y="240" width="7" height="22" fill="#5a7a9a" rx="3"/>
  <ellipse cx="193" cy="264" rx="8" ry="3.5" fill="#4a3a2a"/>
  <ellipse cx="205" cy="264" rx="8" ry="3.5" fill="#4a3a2a"/>
  <!-- 打开的窗户 -->
  <rect x="290" y="240" width="10" height="50" fill="#c8b898" rx="2"/>
  <rect x="300" y="240" width="70" height="10" fill="#c8b898" rx="2"/>
  <!-- 咪咪坐在地上看 -->
  <ellipse cx="300" cy="275" rx="14" ry="8" fill="#e8a040"/>
  <circle cx="300" cy="264" r="9" fill="#e8a040"/>
  <ellipse cx="296" cy="262" rx="3" ry="2" fill="white"/>
  <ellipse cx="296" cy="262" rx="1.5" ry="1.5" fill="#3a2a1a"/>
  <ellipse cx="304" cy="262" rx="3" ry="2" fill="white"/>
  <ellipse cx="304" cy="262" rx="1.5" ry="1.5" fill="#3a2a1a"/>
  <ellipse cx="300" cy="268" rx="1.5" ry="1" fill="#e07070"/>
  <!-- 金鱼缸 -->
  <g transform="translate(350, 250)">
    <ellipse cx="0" cy="15" rx="18" ry="8" fill="#b0d8f0" opacity="0.5" stroke="#8ab8d0" stroke-width="1"/>
    <rect x="-18" y="-10" width="36" height="25" fill="none" stroke="#8ab8d0" stroke-width="1" rx="3"/>
    <ellipse cx="0" cy="-10" rx="18" ry="6" fill="#b0d8f0" opacity="0.3" stroke="#8ab8d0" stroke-width="1"/>
    <ellipse cx="3" cy="5" rx="5" ry="3" fill="#e88840" opacity="0.8"/>
    <circle cx="5" cy="3" r="1" fill="#3a2a1a"/>
  </g>
""")

def svg_friendship():
    """包容 - 新朋友"""
    return _svg_wrap(f"""
  <rect x="0" y="0" width="450" height="300" fill="#e8f8e8" rx="8"/>
  <!-- 操场 -->
  <rect x="0" y="220" width="450" height="80" fill="#8ab87a"/>
  <!-- 方格（跳房子） -->
  <g transform="translate(170, 195)" fill="none" stroke="#f0e8d0" stroke-width="2" opacity="0.6">
    <rect x="0" y="0" width="25" height="25"/>
    <rect x="25" y="0" width="25" height="25"/>
    <rect x="12" y="25" width="25" height="25"/>
    <rect x="0" y="50" width="25" height="25"/>
    <rect x="25" y="50" width="25" height="25"/>
    <rect x="12" y="75" width="25" height="25"/>
  </g>
  <!-- 太阳 -->
  <circle cx="50" cy="45" r="30" fill="#f8e060" opacity="0.7"/>
  <g stroke="#f8e060" stroke-width="2" opacity="0.5">
    <line x1="50" y1="5" x2="50" y2="-5"/>
    <line x1="85" y1="25" x2="95" y2="18"/>
    <line x1="90" y1="50" x2="100" y2="50"/>
    <line x1="85" y1="70" x2="93" y2="78"/>
    <line x1="15" y1="25" x2="5" y2="18"/>
    <line x1="10" y1="50" x2="0" y2="50"/>
    <line x1="15" y1="70" x2="7" y2="78"/>
  </g>
  <!-- 云朵 -->
  <ellipse cx="380" cy="55" rx="40" ry="18" fill="white" opacity="0.7"/>
  <!-- 小豹子（左） -->
  <circle cx="185" cy="185" r="20" fill="#f5d8b8"/>
  <path d="M165,180 Q172,162 185,160 Q198,162 205,180" fill="#3a2a1a"/>
  <path d="M165,180 Q167,172 171,167" fill="none" stroke="#3a2a1a" stroke-width="3"/>
  <path d="M165,183 Q153,188 156,205 Q158,216 162,220" fill="none" stroke="#3a2a1a" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="162" cy="222" r="2.5" fill="#e06060"/>
  <circle cx="178" cy="183" r="2.8" fill="#3a2a1a"/>
  <circle cx="192" cy="183" r="2.8" fill="#3a2a1a"/>
  <path d="M180,191 Q185,193 190,191" fill="none" stroke="#b06060" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M185,175 L195,175 L195,180 L185,180" fill="#e888a0" rx="2"/>
  <!-- 衣服 -->
  <path d="M165,195 L170,218 L200,218 L205,195" fill="#e888a0" stroke="#c06070" stroke-width="1.5"/>
  <rect x="178" y="218" width="6" height="20" fill="#5a7a9a" rx="2"/>
  <rect x="186" y="218" width="6" height="20" fill="#5a7a9a" rx="2"/>
  <ellipse cx="181" cy="240" rx="7" ry="3" fill="#4a3a2a"/>
  <ellipse cx="189" cy="240" rx="7" ry="3" fill="#4a3a2a"/>
  <!-- 牵手 -->
  <path d="M205,192 Q218,190 230,192" fill="none" stroke="#f0c8a0" stroke-width="5" stroke-linecap="round"/>
  <!-- 阿依古丽（右） -->
  <circle cx="270" cy="185" r="20" fill="#e8c8a8"/>
  <path d="M250,180 Q257,160 270,158 Q283,160 290,180" fill="#2a1a0a"/>
  <path d="M250,180 Q252,172 256,167" fill="none" stroke="#2a1a0a" stroke-width="3"/>
  <!-- 卷卷的头发 -->
  <circle cx="255" cy="163" r="4" fill="#2a1a0a"/>
  <circle cx="262" cy="158" r="4" fill="#2a1a0a"/>
  <circle cx="270" cy="156" r="4" fill="#2a1a0a"/>
  <circle cx="278" cy="158" r="4" fill="#2a1a0a"/>
  <circle cx="285" cy="163" r="4" fill="#2a1a0a"/>
  <circle cx="248" cy="170" r="3" fill="#2a1a0a"/>
  <circle cx="292" cy="170" r="3" fill="#2a1a0a"/>
  <!-- 辫子 -->
  <path d="M252,170 Q245,178 248,192 Q250,200 253,205" fill="none" stroke="#2a1a0a" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M288,170 Q295,178 292,192 Q290,200 287,205" fill="none" stroke="#2a1a0a" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="263" cy="183" r="2.8" fill="#3a2a1a"/>
  <circle cx="277" cy="183" r="2.8" fill="#3a2a1a"/>
  <path d="M265,191 Q270,193 275,191" fill="none" stroke="#c08060" stroke-width="1.8" stroke-linecap="round"/>
  <!-- 衣服（新疆风格） -->
  <path d="M250,195 L255,218 L285,218 L290,195" fill="#e06080" stroke="#c05060" stroke-width="1.5"/>
  <!-- 衣服上的装饰花纹 -->
  <circle cx="265" cy="205" r="2" fill="#f0d060"/>
  <circle cx="275" cy="205" r="2" fill="#f0d060"/>
  <rect x="262" y="218" width="6" height="20" fill="#3a5a3a" rx="2"/>
  <rect x="272" y="218" width="6" height="20" fill="#3a5a3a" rx="2"/>
  <ellipse cx="265" cy="240" rx="7" ry="3" fill="#4a3a2a"/>
  <ellipse cx="273" cy="240" rx="7" ry="3" fill="#4a3a2a"/>
  <!-- 爱心 -->
  <g transform="translate(240, 165) scale(0.3)">
    <path d="M0,10 A10,10 0 0,1 20,10 A10,10 0 0,1 40,10 Q40,25 20,40 Q0,25 0,10 Z" fill="#e06060" opacity="0.7"/>
  </g>
""")

def svg_responsibility():
    """责任 - 责任测试"""
    return _svg_wrap(f"""
  <rect x="0" y="0" width="450" height="300" fill="#fefce8" rx="8"/>
  <!-- 房间场景 -->
  <rect x="0" y="200" width="450" height="100" fill="#e8d8b8"/>
  <!-- 墙壁 -->
  <rect x="0" y="40" width="450" height="160" fill="#f8f0e0"/>
  <!-- 闹钟 -->
  <g transform="translate(60, 80)">
    <circle cx="0" cy="0" r="18" fill="#e06060" stroke="#c05050" stroke-width="2"/>
    <circle cx="0" cy="0" r="14" fill="white"/>
    <line x1="0" y1="0" x2="0" y2="-10" stroke="#3a2a1a" stroke-width="2"/>
    <line x1="0" y1="0" x2="6" y2="4" stroke="#3a2a1a" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="2" fill="#3a2a1a"/>
    <rect x="-3" y="15" width="6" height="5" fill="#c05050" rx="1"/>
  </g>
  <!-- 日历 -->
  <g transform="translate(350, 65)">
    <rect x="-22" y="-25" width="44" height="55" fill="white" stroke="#8b7355" stroke-width="1.5" rx="2"/>
    <rect x="-22" y="-25" width="44" height="14" fill="#e06060" rx="2"/>
    <text x="0" y="-15" font-size="8" fill="white" text-anchor="middle" font-family="sans-serif" font-weight="bold">X月</text>
    <!-- 打勾的格子 -->
    <text x="-10" y="-2" font-size="7" fill="#3a2a1a" font-family="sans-serif">1</text><text x="3" y="-2" font-size="7" fill="#3a2a1a">2</text><text x="14" y="-2" font-size="7" fill="#3a2a1a">3</text>
    <text x="-10" y="8" font-size="7" fill="#3a2a1a">4</text><text x="3" y="8" font-size="7" fill="#3a2a1a">5</text><text x="14" y="8" font-size="7" fill="#3a2a1a">6</text>
    <text x="-10" y="18" font-size="7" fill="#3a2a1a">7</text><text x="3" y="18" font-size="7" fill="#3a2a1a">8</text><text x="14" y="18" font-size="7" fill="#3a2a1a">9</text>
    <!-- 红勾 -->
    <path d="M-10,2 L-8,5 L-4,0" fill="none" stroke="#e03030" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3,2 L5,5 L9,0" fill="none" stroke="#e03030" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14,2 L16,5 L20,0" fill="none" stroke="#e03030" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <!-- 金鱼缸 -->
  <g transform="translate(120, 200)">
    <ellipse cx="0" cy="12" rx="20" ry="8" fill="#b0d8f0" opacity="0.5" stroke="#8ab8d0" stroke-width="1.5"/>
    <rect x="-20" y="-15" width="40" height="27" fill="none" stroke="#8ab8d0" stroke-width="1.5" rx="4"/>
    <ellipse cx="0" cy="-15" rx="20" ry="7" fill="#b0d8f0" opacity="0.3" stroke="#8ab8d0" stroke-width="1.5"/>
    <!-- 小金鱼 -->
    <ellipse cx="3" cy="2" rx="7" ry="4" fill="#e88840" opacity="0.8"/>
    <circle cx="6" cy="0" r="1.2" fill="#3a2a1a"/>
    <path d="M-4,2 Q-8,0 -10,4" fill="none" stroke="#e88840" stroke-width="1.5"/>
    <ellipse cx="-5" cy="5" rx="6" ry="2" fill="#e8a040" opacity="0.6"/>
  </g>
  <!-- 鱼食罐子 -->
  <rect x="100" y="170" width="12" height="15" fill="#8a7a50" rx="2"/>
  <circle cx="106" cy="170" r="6" fill="#a08060"/>
  <!-- 小豹子在叠被子 -->
  <!-- 床 -->
  <rect x="200" y="215" width="90" height="10" fill="#a08060" stroke="#8b7355" stroke-width="1" rx="2"/>
  <rect x="200" y="180" width="90" height="35" fill="white" stroke="#d0d0d0" stroke-width="1" rx="2"/>
  <!-- 被子（正在叠） -->
  <path d="M205,195 L230,195 L230,215 L205,215 Z" fill="#e888a0" stroke="#c06070" stroke-width="1"/>
  <path d="M230,195 L285,180 L285,215 L230,215 Z" fill="#f0a0b0" stroke="#c06070" stroke-width="1"/>
  <!-- 小豹子 -->
  <circle cx="250" cy="185" r="20" fill="#f5d8b8"/>
  <path d="M230,180 Q237,162 250,160 Q263,162 270,180" fill="#3a2a1a"/>
  <path d="M230,180 Q232,172 236,167" fill="none" stroke="#3a2a1a" stroke-width="3"/>
  <path d="M230,183 Q218,188 221,208 Q223,218 227,222" fill="none" stroke="#3a2a1a" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="227" cy="224" r="2.5" fill="#e06060"/>
  <circle cx="243" cy="183" r="2.8" fill="#3a2a1a"/>
  <circle cx="257" cy="183" r="2.8" fill="#3a2a1a"/>
  <!-- 认真的表情 -->
  <path d="M245,191 Q250,193 255,191" fill="none" stroke="#b06060" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M238,177 Q241,175 245,177" fill="none" stroke="#3a2a1a" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M255,177 Q259,175 262,177" fill="none" stroke="#3a2a1a" stroke-width="1.5" stroke-linecap="round"/>
  <!-- 衣服 -->
  <path d="M230,195 L235,218 L265,218 L270,195" fill="#68a8d0" stroke="#4a7a9a" stroke-width="1.5"/>
  <!-- 叠被子的手 -->
  <path d="M235,198 Q225,205 228,210" fill="none" stroke="#f0c8a0" stroke-width="4" stroke-linecap="round"/>
  <path d="M265,195 Q272,202 270,210" fill="none" stroke="#f0c8a0" stroke-width="4" stroke-linecap="round"/>
  <!-- 腿 -->
  <rect x="240" y="218" width="6" height="18" fill="#5a7a9a" rx="2"/>
  <rect x="250" y="218" width="6" height="18" fill="#5a7a9a" rx="2"/>
  <ellipse cx="243" cy="238" rx="7" ry="3" fill="#4a3a2a"/>
  <ellipse cx="253" cy="238" rx="7" ry="3" fill="#4a3a2a"/>
  <!-- 咪咪旁边蹲着 -->
  <ellipse cx="310" cy="255" r="12" ry="7" fill="#e8a040"/>
  <circle cx="310" cy="246" r="8" fill="#e8a040"/>
  <ellipse cx="307" cy="244" rx="2.5" ry="2" fill="white"/>
  <ellipse cx="307" cy="244" rx="1.3" ry="1.3" fill="#3a2a1a"/>
  <ellipse cx="313" cy="244" rx="2.5" ry="2" fill="white"/>
  <ellipse cx="313" cy="244" rx="1.3" ry="1.3" fill="#3a2a1a"/>
  <ellipse cx="310" cy="249" rx="1.2" ry="0.8" fill="#e07070"/>
  <path d="M304,239 Q310,237 316,239" fill="none" stroke="#c08030" stroke-width="1.2"/>
  <!-- 地上的小狗纸箱（右上角等待） -->
  <g transform="translate(380, 215)">
    <rect x="-20" y="5" width="40" height="30" fill="#d0b880" stroke="#8b7355" stroke-width="1.5" rx="2"/>
    <rect x="-20" y="0" width="40" height="8" fill="#c8a870" stroke="#8b7355" stroke-width="1.5" rx="2"/>
    <circle cx="0" cy="8" r="7" fill="#8a6a40"/>
    <circle cx="-2" cy="6" r="2" fill="#3a2a1a"/>
    <circle cx="2" cy="6" r="2" fill="#3a2a1a"/>
    <ellipse cx="0" cy="10" rx="2" ry="1" fill="#e07070"/>
    <!-- 垂下来的耳朵 -->
    <ellipse cx="-5" cy="8" rx="4" ry="5" fill="#6a4a20"/>
    <ellipse cx="5" cy="8" rx="4" ry="5" fill="#6a4a20"/>
  </g>
""")

def svg_jars():
    """智慧 - 三个罐子"""
    return _svg_wrap(f"""
  <rect x="0" y="0" width="450" height="300" fill="#fefce8" rx="8"/>
  <!-- 房间 -->
  <rect x="0" y="200" width="450" height="100" fill="#e8d8b8"/>
  <!-- 桌子 -->
  <rect x="50" y="180" width="350" height="12" fill="#a08060" stroke="#8b7355" stroke-width="1.5" rx="3"/>
  <rect x="70" y="192" width="8" height="35" fill="#8b7355"/>
  <rect x="372" y="192" width="8" height="35" fill="#8b7355"/>
  <!-- 三个罐子 -->
  # 罐子1 - 花
  <g transform="translate(120, 145)">
    <ellipse cx="0" cy="35" rx="25" ry="8" fill="#f0d8b0"/>
    <rect x="-25" y="5" width="50" height="30" fill="#f0d8b0" stroke="#c8a870" stroke-width="1.5" rx="3"/>
    <ellipse cx="0" cy="5" rx="25" ry="7" fill="#f8e8c8" stroke="#c8a870" stroke-width="1.5"/>
    <!-- 标签 -->
    <rect x="-12" y="12" width="24" height="16" fill="#e888a0" rx="4"/>
    <text x="0" y="24" font-size="12" fill="white" text-anchor="middle" font-family="sans-serif" font-weight="bold">花</text>
    <!-- 硬币 -->
    <circle cx="-10" cy="38" r="3" fill="#e8a030" stroke="#c08020" stroke-width="0.5"/>
    <circle cx="3" cy="40" r="3" fill="#e8a030" stroke="#c08020" stroke-width="0.5"/>
    <circle cx="-3" cy="36" r="2" fill="#e8a030" stroke="#c08020" stroke-width="0.5"/>
  </g>
  # 罐子2 - 存
  <g transform="translate(225, 140)">
    <ellipse cx="0" cy="40" rx="28" ry="9" fill="#b0d8e8"/>
    <rect x="-28" y="5" width="56" height="35" fill="#b0d8e8" stroke="#68a8c0" stroke-width="1.5" rx="3"/>
    <ellipse cx="0" cy="5" rx="28" ry="8" fill="#c8e8f4" stroke="#68a8c0" stroke-width="1.5"/>
    <!-- 标签 -->
    <rect x="-12" y="14" width="24" height="16" fill="#68a8d0" rx="4"/>
    <text x="0" y="26" font-size="12" fill="white" text-anchor="middle" font-family="sans-serif" font-weight="bold">存</text>
    <!-- 很多硬币 -->
    <circle cx="-10" cy="42" r="3" fill="#e8a030" stroke="#c08020" stroke-width="0.5"/>
    <circle cx="10" cy="43" r="3" fill="#e8a030" stroke="#c08020" stroke-width="0.5"/>
    <circle cx="0" cy="44" r="3" fill="#e8a030" stroke="#c08020" stroke-width="0.5"/>
    <circle cx="-5" cy="39" r="2.5" fill="#e8a030" stroke="#c08020" stroke-width="0.5"/>
    <circle cx="5" cy="40" r="2.5" fill="#e8a030" stroke="#c08020" stroke-width="0.5"/>
    <circle cx="-15" cy="40" r="2" fill="#e8a030" stroke="#c08020" stroke-width="0.5"/>
    <circle cx="15" cy="41" r="2" fill="#e8a030" stroke="#c08020" stroke-width="0.5"/>
  </g>
  # 罐子3 - 帮
  <g transform="translate(330, 145)">
    <ellipse cx="0" cy="35" rx="25" ry="8" fill="#c8e8c8"/>
    <rect x="-25" y="5" width="50" height="30" fill="#c8e8c8" stroke="#68a868" stroke-width="1.5" rx="3"/>
    <ellipse cx="0" cy="5" rx="25" ry="7" fill="#d8f4d8" stroke="#68a868" stroke-width="1.5"/>
    <!-- 标签 -->
    <rect x="-12" y="12" width="24" height="16" fill="#68a868" rx="4"/>
    <text x="0" y="24" font-size="12" fill="white" text-anchor="middle" font-family="sans-serif" font-weight="bold">帮</text>
    <!-- 硬币 -->
    <circle cx="-8" cy="38" r="3" fill="#e8a030" stroke="#c08020" stroke-width="0.5"/>
    <circle cx="5" cy="39" r="3" fill="#e8a030" stroke="#c08020" stroke-width="0.5"/>
    <circle cx="0" cy="36" r="2" fill="#e8a030" stroke="#c08020" stroke-width="0.5"/>
  </g>
  <!-- 小豹子站在旁边微笑 -->
  <circle cx="225" cy="215" r="20" fill="#f5d8b8"/>
  <path d="M205,210 Q212,192 225,190 Q238,192 245,210" fill="#3a2a1a"/>
  <path d="M205,210 Q207,202 211,197" fill="none" stroke="#3a2a1a" stroke-width="3"/>
  <path d="M205,213 Q193,218 196,238 Q198,248 202,252" fill="none" stroke="#3a2a1a" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="202" cy="254" r="2.5" fill="#e06060"/>
  <circle cx="218" cy="213" r="2.8" fill="#3a2a1a"/>
  <circle cx="232" cy="213" r="2.8" fill="#3a2a1a"/>
  <!-- 微笑 -->
  <path d="M220,220 Q225,223 230,220" fill="none" stroke="#b06060" stroke-width="1.8" stroke-linecap="round"/>
  <!-- 衣服 -->
  <path d="M208,225 L212,250 L238,250 L242,225" fill="#e888a0" stroke="#c06070" stroke-width="1.5"/>
  <rect x="218" y="250" width="6" height="18" fill="#5a7a9a" rx="2"/>
  <rect x="226" y="250" width="6" height="18" fill="#5a7a9a" rx="2"/>
  <ellipse cx="221" cy="270" rx="7" ry="3" fill="#4a3a2a"/>
  <ellipse cx="229" cy="270" rx="7" ry="3" fill="#4a3a2a"/>
  <!-- 小豹子手中拿着围巾（礼物） -->
  <g transform="translate(252, 222)">
    <path d="M0,0 Q8,-5 15,0 Q12,8 8,10 Q4,8 0,0 Z" fill="#e06080" opacity="0.8"/>
  </g>
  <!-- 咪咪蹲在桌子下 -->
  <ellipse cx="380" cy="255" r="12" ry="7" fill="#e8a040"/>
  <circle cx="380" cy="246" r="8" fill="#e8a040"/>
  <ellipse cx="377" cy="244" rx="2.5" ry="2" fill="white"/>
  <ellipse cx="377" cy="244" rx="1.3" ry="1.3" fill="#3a2a1a"/>
  <ellipse cx="383" cy="244" rx="2.5" ry="2" fill="white"/>
  <ellipse cx="383" cy="244" rx="1.3" ry="1.3" fill="#3a2a1a"/>
  <ellipse cx="380" cy="249" rx="1.2" ry="0.8" fill="#e07070"/>
  <path d="M374,239 Q380,237 386,239" fill="none" stroke="#c08030" stroke-width="1.2"/>
  <path d="M368,255 Q358,248 355,238 Q354,233 357,232" fill="none" stroke="#e8a040" stroke-width="3" stroke-linecap="round"/>
""")


SVG_MAP = {
    "courage": svg_courage,
    "kite": svg_kite,
    "choice": svg_choice,
    "flute": svg_flute,
    "vase": svg_vase,
    "confidence": svg_confidence,
    "bird": svg_bird,
    "friendship": svg_friendship,
    "responsibility": svg_responsibility,
    "jars": svg_jars,
}


# ─── HTML 模板 ───

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;700&display=swap');

  @page {{
    size: A4 portrait;
    margin: 1.2cm 1cm;
  }}

  * {{ margin: 0; padding: 0; box-sizing: border-box; }}

  body {{
    font-family: 'Noto Serif SC', 'STSong', 'SimSun', serif;
    background: #f5f0e8;
    color: #3a2a1a;
    line-height: 1.7;
    font-size: 12px;
  }}

  /* 封面 - 单独一页 */
  .cover {{
    page-break-after: always;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 90vh;
    text-align: center;
    background: linear-gradient(180deg, #fefce8 0%, #f0e8d8 100%);
    padding: 1.5cm;
  }}
  .cover h1 {{
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 42px;
    color: #5a3a2a;
    margin-bottom: 12px;
  }}
  .cover .subtitle {{
    font-size: 16px;
    color: #8a6a4a;
    margin-bottom: 8px;
  }}
  .cover .meta {{
    font-size: 12px;
    color: #a08060;
    margin-top: 20px;
  }}
  .cover .decoration {{
    font-size: 48px;
    color: #e8a0b0;
    margin: 15px 0;
  }}

  /* 每个故事对 = A4一页，两栏 */
  .story-pair {{
    page-break-after: always;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6cm;
    padding: 0.3cm 0;
    align-items: start;
  }}
  .story-pair:last-child {{
    page-break-after: auto;
  }}

  /* 单个故事 - 在一栏内 */
  .story {{
    page-break-inside: avoid;
    break-inside: avoid;
    padding: 0.3cm 0.4cm;
    background: #fffcf5;
    border-radius: 6px;
    border: 1px solid #f0e4d0;
    position: relative;
    display: flex;
    flex-direction: column;
  }}
  .story-header {{
    text-align: center;
    margin-bottom: 6px;
    padding-bottom: 6px;
    border-bottom: 1.5px dashed #e8d8c0;
  }}
  .story-number {{
    font-size: 9px;
    color: #a08060;
    margin-bottom: 2px;
  }}
  .story-theme {{
    display: inline-block;
    background: #f0d8b8;
    color: #8a5a3a;
    padding: 1px 10px;
    border-radius: 12px;
    font-size: 9px;
    margin-bottom: 3px;
  }}
  .story-title {{
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 22px;
    color: #5a3a2a;
    margin-bottom: 2px;
    line-height: 1.2;
  }}
  .story-illustration {{
    margin: 4px auto 6px;
    max-width: 100%;
  }}
  .story-illustration svg {{
    max-height: 150px;
    width: auto;
  }}
  .story-body {{
    text-indent: 2em;
    font-size: 12px;
    line-height: 1.65;
    flex: 1;
  }}
  .story-body p {{
    margin-bottom: 0.3em;
  }}
  .story-body ruby {{
    ruby-align: center;
  }}
  .story-body rt {{
    font-size: 7px;
    color: #9a8a7a;
    letter-spacing: 0;
    user-select: none;
  }}
  .story-moral {{
    margin-top: 6px;
    padding: 5px 10px;
    background: #f8f0e0;
    border-left: 3px solid #e8a0b0;
    border-radius: 3px;
    font-size: 10px;
    color: #7a5a4a;
    text-align: center;
    font-style: italic;
    line-height: 1.3;
  }}

  /* 语音播放按钮 */
  .play-btn {{
    display: inline-block;
    background: #e888a0;
    color: white;
    border: none;
    padding: 6px 20px;
    border-radius: 20px;
    font-size: 14px;
    cursor: pointer;
    margin-top: 8px;
    transition: background 0.2s;
  }}
  .play-btn:hover {{
    background: #d06070;
  }}
  .play-btn:active {{
    transform: scale(0.95);
  }}
  .play-btn.playing {{
    background: #68a8d0;
    animation: pulse 1.5s infinite;
  }}
  @keyframes pulse {{
    0% {{ box-shadow: 0 0 0 0 rgba(104,168,208,0.6); }}
    70% {{ box-shadow: 0 0 0 10px rgba(104,168,208,0); }}
    100% {{ box-shadow: 0 0 0 0 rgba(104,168,208,0); }}
  }}

  /* 底部音频控制栏 */
  .audio-bar {{
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #3a2a1a;
    color: #f0e8d8;
    padding: 10px 20px;
    display: none;
    align-items: center;
    justify-content: center;
    gap: 15px;
    font-size: 14px;
    z-index: 1000;
    box-shadow: 0 -4px 12px rgba(0,0,0,0.2);
    flex-wrap: wrap;
  }}
  .audio-bar.visible {{
    display: flex;
  }}
  .audio-bar button {{
    background: none;
    border: 2px solid #f0e8d8;
    color: #f0e8d8;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }}
  .audio-bar button:hover {{
    background: rgba(255,255,255,0.15);
  }}
  .audio-bar .bar-info {{
    min-width: 120px;
    text-align: center;
  }}
  .audio-bar .bar-progress {{
    flex: 1;
    min-width: 100px;
    max-width: 300px;
    height: 4px;
    background: #5a4a3a;
    border-radius: 2px;
    position: relative;
  }}
  .audio-bar .bar-progress-fill {{
    height: 100%;
    background: #e888a0;
    border-radius: 2px;
    width: 0%;
    transition: width 0.3s;
  }}

  @media print {{
    body {{
      background: white;
      font-size: 11px;
    }}
    .story-pair {{
      gap: 0.4cm;
      padding: 0;
    }}
    .story {{
      padding: 0.2cm 0.3cm;
      background: white;
      border: none;
      box-shadow: none;
    }}
    .story-body {{
      font-size: 11px;
      line-height: 1.55;
    }}
    .story-body rt {{
      font-size: 6.5px;
    }}
    .story-title {{
      font-size: 20px;
    }}
    .story-illustration svg {{
      max-height: 130px;
    }}
    .story-moral {{
      font-size: 9px;
      padding: 3px 8px;
    }}
    .cover {{
      background: white;
      min-height: 80vh;
    }}
    .play-btn, .audio-bar {{
      display: none !important;
    }}
  }}
</style>
</head>
<body>

<!-- 封面 -->
<div class="cover" id="cover">
  <div class="decoration">🌸</div>
  <h1>小豹子的成长之旅</h1>
  <div class="subtitle">—— 十个关于勇气与爱的童话</div>
  <svg width="120" height="80" viewBox="0 0 120 80" style="margin:20px auto;">
    <ellipse cx="60" cy="60" rx="45" ry="12" fill="#8ab87a" opacity="0.5"/>
    <path d="M55,55 Q60,20 65,55" fill="none" stroke="#5a8a5a" stroke-width="2.5"/>
    <ellipse cx="60" cy="25" rx="15" ry="10" fill="#e8a0b0" opacity="0.7"/>
    <ellipse cx="60" cy="25" rx="10" ry="7" fill="#f0c0c8" opacity="0.8"/>
    <ellipse cx="58" cy="38" rx="4" ry="2" fill="#5a8a5a"/>
    <circle cx="48" cy="63" r="2" fill="#e8a030"/>
    <circle cx="72" cy="65" r="2" fill="#e8a030"/>
    <circle cx="55" cy="68" r="1.5" fill="#e8a030"/>
  </svg>
  <div class="meta">适合 7-8 岁 · 全文拼音标注 · 亲子共读</div>
  <button class="play-btn" onclick="startReading()" style="font-size:18px;padding:12px 36px;margin-top:30px;">🎧 开始听故事</button>
  <div style="font-size:11px;color:#a08060;margin-top:10px;">✨ AI 语音朗读 · 点击即听</div>
</div>

{stories}

<!-- 底部音频控制栏 -->
<div class="audio-bar" id="audioBar">
  <button onclick="prevStory()" title="上一个故事">⏮</button>
  <button onclick="togglePlay()" title="播放/暂停" id="playPauseBtn">⏸</button>
  <button onclick="stopReading()" title="停止">⏹</button>
  <button onclick="nextStory()" title="下一个故事">⏭</button>
  <span class="bar-info" id="barInfo">第 1 个故事</span>
  <div class="bar-progress">
    <div class="bar-progress-fill" id="barProgress"></div>
  </div>
</div>

<script>
// ─── 音频朗读系统 (v3 — edge-tts AI 语音 + HTML5 Audio) ───
const AudioSystem = {{
  currentStory: 0,
  currentAudio: null,

  init: function() {{
    var first = document.getElementById('audio-1');
    if (first) first.preload = 'metadata';
  }},

  stop: function() {{
    if (this.currentAudio) {{
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }}
    document.getElementById('barProgress').style.width = '0%';
    this.updateUI();
  }},

  updateUI: function() {{
    var info = document.getElementById('barInfo');
    var btn = document.getElementById('playPauseBtn');
    if (info) info.textContent = '第 ' + this.currentStory + ' 个故事';
    if (btn) {{
      btn.textContent = (this.currentAudio && !this.currentAudio.paused) ? '⏸' : '▶';
    }}
    document.querySelectorAll('.play-btn').forEach(function(b) {{ b.classList.remove('playing'); }});
    var currentBtn = document.querySelector('.story[data-story-idx="' + this.currentStory + '"] .play-btn');
    if (currentBtn && this.currentAudio && !this.currentAudio.paused) {{
      currentBtn.classList.add('playing');
    }}
  }}
}};

function playStory(idx) {{
  AudioSystem.stop();

  var audio = document.getElementById('audio-' + idx);
  if (!audio) return;

  AudioSystem.currentStory = idx;
  AudioSystem.currentAudio = audio;

  document.getElementById('audioBar').classList.add('visible');

  var story = document.querySelector('.story[data-story-idx="' + idx + '"]');
  if (story) story.scrollIntoView({{ behavior: 'smooth', block: 'start' }});

  audio.onended = function() {{
    document.getElementById('barProgress').style.width = '100%';
    AudioSystem.updateUI();
  }};
  audio.ontimeupdate = function() {{
    if (audio.duration) {{
      var pct = (audio.currentTime / audio.duration) * 100;
      document.getElementById('barProgress').style.width = pct + '%';
    }}
  }};
  audio.onerror = function() {{
    var info = document.getElementById('barInfo');
    if (info) info.textContent = '⚠ 音频加载失败，确保 audio/ 文件夹完整';
  }};

  audio.play().then(function() {{
    AudioSystem.updateUI();
  }}).catch(function(e) {{
    var info = document.getElementById('barInfo');
    if (info) info.textContent = '⚠ 播放失败: ' + e.message;
  }});
}}

function togglePlay() {{
  var audio = AudioSystem.currentAudio;
  if (!audio || audio.ended) {{
    playStory(AudioSystem.currentStory || 1);
    return;
  }}
  if (audio.paused) {{
    audio.play().then(function() {{ AudioSystem.updateUI(); }});
  }} else {{
    audio.pause();
  }}
  AudioSystem.updateUI();
}}

function stopReading() {{
  AudioSystem.stop();
}}

function nextStory() {{
  var next = Math.min(parseInt(AudioSystem.currentStory) + 1, {total_stories});
  playStory(next);
}}

function prevStory() {{
  var prev = Math.max(parseInt(AudioSystem.currentStory) - 1, 1);
  playStory(prev);
}}

function startReading() {{
  document.getElementById('audioBar').classList.add('visible');
  playStory(1);
}}

document.addEventListener('DOMContentLoaded', function() {{
  AudioSystem.init();
}});
</script>

</body>
</html>"""

STORY_TEMPLATE = """<div class="story" data-story-idx="{number}" data-story-title="{title}">
  <audio id="audio-{number}" preload="none" src="audio/{audio_file}"></audio>
  <div class="story-header">
    <div class="story-number">第{number}个故事</div>
    <div class="story-theme">{theme} · {theme_en}</div>
    <div class="story-title">{title}</div>
    <button class="play-btn" onclick="playStory({number})" title="播放这个故事">🔊 听故事</button>
  </div>
  <div class="story-illustration">
    {svg}
  </div>
  <div class="story-body" data-text="{plain_text_escaped}">
    {paragraphs}
  </div>
  <div class="story-moral">
    {moral}
  </div>
</div>"""


MORALS = {
    "01-courage": "勇敢不是什么都敢做，而是知道什么不该做，还能坚持住。",
    "02-resilience": "坚强不是一次就成功，而是摔倒了，还能笑着站起来。",
    "03-decisiveness": "有时候不是选对的，而是选了之后，让它变成对的。",
    "04-persistence": "坚持，就是把「太难了」变成「我可以」。",
    "05-honesty": "诚实的孩子，比花瓶更珍贵。",
    "06-confidence": "自信不是天生的，是每一天的坚持堆起来的。",
    "07-kindness": "善良，就是看见别人需要帮助的时候，愿意停下自己的脚步。",
    "08-acceptance": "包容不是同情，是张开双臂，说一声「欢迎你」。",
    "09-responsibility": "责任，就是答应的事，再难也要做到。",
    "10-wisdom": "智慧，不是知道怎么得到，而是知道怎么用。",
}


def generate_html():
    story_htmls = []
    for idx, s in enumerate(STORIES, 1):
        paras_html = []
        plain_lines = []
        for line in s["text"]:
            ruby_text = to_ruby_html(line)
            paras_html.append(f"<p>{ruby_text}</p>")
            plain_lines.append(line)

        paragraphs = "\n      ".join(paras_html)
        plain_text = "".join(plain_lines)

        # Escape for HTML data attribute
        plain_text_escaped = (
            plain_text
            .replace("&", "&amp;")
            .replace('"', "&quot;")
            .replace("'", "&#39;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )

        svg_func = SVG_MAP.get(s["svg_name"])
        svg_content = svg_func() if svg_func else ""

        moral = MORALS.get(s["id"], "")

        audio_file = s["id"] + ".mp3"
        story_html = STORY_TEMPLATE.format(
            number=idx,
            theme=s["theme"],
            theme_en=s["theme_en"],
            title=s["title"],
            svg=svg_content,
            paragraphs=paragraphs,
            plain_text_escaped=plain_text_escaped,
            moral=moral,
            audio_file=audio_file,
        )
        story_htmls.append(story_html)

    total = len(STORIES)

    # Group stories into pairs (each pair = one A4 page)
    story_pairs = []
    for i in range(0, len(story_htmls), 2):
        pair = [story_htmls[i]]
        if i + 1 < len(story_htmls):
            pair.append(story_htmls[i + 1])
        pair_html = '<div class="story-pair">\n    ' + '\n    '.join(pair) + '\n  </div>'
        story_pairs.append(pair_html)

    full_html = HTML_TEMPLATE.format(
        title="小豹子的成长之旅",
        stories="\n".join(story_pairs),
        total_stories=total,
    )

    return full_html


AUDIO_DIR_NAME = "audio"
OUTPUT_DIR = Path("/home/wang/wk/code/xiao_baozi_stories")


async def generate_audio(story_id, text, output_dir):
    """用 edge-tts 生成一段故事的 MP3 音频"""
    audio_dir = output_dir / AUDIO_DIR_NAME
    audio_dir.mkdir(parents=True, exist_ok=True)
    mp3_path = audio_dir / f"{story_id}.mp3"
    if mp3_path.exists():
        return mp3_path  # 已存在，跳过

    # edge-tts: 中文女声 Xiaoxiao，语速+10%
    tts = edge_tts.Communicate(text, voice="zh-CN-XiaoxiaoNeural", rate="+10%")
    await tts.save(str(mp3_path))

    # 压缩到 16kbps 减小体积
    tmp_path = mp3_path.with_suffix(".tmp.mp3")
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(mp3_path), "-b:a", "16k", str(tmp_path)],
        capture_output=True,
    )
    if tmp_path.exists() and tmp_path.stat().st_size > 0:
        tmp_path.replace(mp3_path)

    return mp3_path


async def generate_all_audio(output_dir):
    """生成所有故事的音频"""
    print("🎧 正在生成 AI 语音音频...")
    tasks = []
    for s in STORIES:
        text = "".join(s["text"])
        tasks.append(generate_audio(s["id"], text, output_dir))
    results = await asyncio.gather(*tasks)
    total_size = sum(p.stat().st_size for p in results)
    print(f"   ✅ {len(results)} 个音频文件 ({total_size / 1024:.0f} KB 共计)")
    print(f"   📁 {output_dir / AUDIO_DIR_NAME}/")


if __name__ == "__main__":
    import edge_tts

    # 创建输出目录
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 生成 HTML
    html = generate_html()
    html_path = OUTPUT_DIR / "index.html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✅ HTML 已生成: {html_path}")
    print(f"   文件大小: {len(html) / 1024:.0f} KB")

    # 生成音频
    asyncio.run(generate_all_audio(OUTPUT_DIR))

    print(f"\n📦 全部输出: {OUTPUT_DIR}/")
    print(f"   ├── index.html")
    print(f"   └── {AUDIO_DIR_NAME}/")
    print(f"       ├── 01-courage.mp3")
    print(f"       └── ...")
    print(f"\n🌐 用浏览器打开 {html_path} 即可阅读和听故事")

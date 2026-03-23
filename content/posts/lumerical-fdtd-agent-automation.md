---
title: '让 AI 替你跑仿真：用 Agent 实现 Lumerical FDTD仿真全自动设计优化'
date: 2026-03-23
draft: false
slug: 'lumerical-fdtd-agent-automation'
description: '启语 Agent（智能体）的出现，让大模型可以直接操控电脑。 发展最成熟的Agent就是编程Agent，使用编程Agent的过程一般称作 AI编程 或者 Vibe Coding 。 最近我用这套方法，跑通了 Lumerical FDTD、Ansys HFSS、CST 等多款仿真软'
tags: ['AI']
lastmod: 2026-03-23T06:23:00.000Z
notion_page_id: '32c8eabb-0ab3-801b-bc68-f8021a47c77c'
---
## 启语
Agent（智能体）的出现，让大模型可以直接操控电脑。
发展最成熟的Agent就是编程Agent，使用编程Agent的过程一般称作 AI编程 或者 Vibe Coding 。
最近我用这套方法，跑通了 Lumerical FDTD、Ansys HFSS、CST 等多款仿真软件的全自动建模与优化，效果超出预期。写下这篇文章，把经验和方法分享给大家。
<empty-block/>
# 下面开始详细的教程：
这里用Lumerical FDTD的仿真进行举例，实际我还尝试了Lumerical EME 、 FDE 、INTERCONNECT等，方法基本类似，完全适用。
# 什么是 Vibe Coding？
![](/uploads/notion/lumerical-fdtd-agent-automation/3.svg)
最前沿的 Vibe Coding 技术已经不是“随便跟 AI 聊聊，让它写几行代码”，而是：
> 用自然语言描述目标，让 Agent 负责拆解、执行、调试和交付，人类负责定义问题、设置边界、审核结果。
<empty-block/>
第一层次的 Vibe Coding，就是直接与网页端大模型对话。
	我们和模型直接聊天，靠 `Ctrl+C`、`Ctrl+V` 来回搬运信息。这种方式门槛最低，但是效率很低。主要是因为模型无法自动debug，无法自动迭代结果。
第二层就到了使用Agent进行编程。目前也大概有两种：
	第一种是在 IDE 中使用 AI。比如 VS Code 插件，或者原生集成 AI 能力的 IDE，例如 Trae、AntiGravity、Cursor 等。
	第二种是脱离 IDE 的纯 Agent 编程。Agent 能调用终端、读写文件、运行脚本、查看报错、反复迭代。主要工具就是Claude Code 和 Codex。
还有更高级的一些手段，但是能达到第二层的人已经寥寥无几。
<empty-block/>
# Vibe Coding 的工具推荐：
第一档：最推荐的当然是Claude Code和 Codex。本文使用Codex Windows桌面端作为演示工具。
Claude Code基本只能官方订阅，价格昂贵。
Codex可以自己注册账号，然后在咸鱼一些渠道用很便宜的价格订阅。
第二档：Cursor、Trae国际版、AntiGravity、以及Kimi Code 、智谱ZCode等。这些里面有些比较弱的模型，可能不能很好地完成任务。比如Trae国际版中，建议选择Codex5.3模型，Auto模型则很容易出错。大家可以自己想办法获取这些的订阅，都有一些渠道。
基本使用方法都差不多，选一个工作文件夹，然后发Prompt即可。
![](/uploads/notion/lumerical-fdtd-agent-automation/4.svg)
<empty-block/>
<empty-block/>
<empty-block/>
话不多说，直接进行演示
# 演示案例1：Codex全自动完成 1×2 MMI 分束器设计与仿真
第一步，在你喜欢的地方创建一个文件夹，然后打开codex，选择这个文件夹作为Workpspace。然后可以打开下面的更改权限-完全访问权限，这样可以减少很多手动认证的步骤，目前感觉仿真lumerical并没有太大安全风险。
我这里使用的 Lumerical 版本是 2025R1 。
### 核心的技巧在于Prompt的编排：
```python
你需要完成Lumerical FDTD仿真任务，具体细节如下：

1. 我正在使用2025 R1版本的Lumerical ，请使用其自带的Python解释器，路径为"C:\Program Files\ANSYS Inc\v251\Lumerical\python-3.9.9-embed-amd64\python.exe"。
2. 编写脚本仿真设计一个3D的 1x2 MMI分束器。分束器包括输入波导，输入taper，矩形的MMI干涉区，输出taper，输出波导等结构。你需要自己搜索学习标准的1x2MMI的结构。
3. 仿真波段为1550nm，基模 TE 模式。
4. 基于 220nm 的SOI 硅波导工艺平台，衬底和包层均为二氧化硅，波导宽度450nm。
5. FDTD的仿真精度设为2.

**验收条件为：器件成功实现等功率分束，分束功率的不均衡度小于5%，同时传输损耗小于0.5dB。**

**要注意的地方：**
1、请你自己运行代码，根据代码的返回结果，在终端里帮我debug程序，直到最终整个代码可以正常运行。并且器件性能满足验收条件。
2、全程用固定文件名自动保存文件，避免 lumerical 弹交互窗口。
3、注意监视器的尺寸，不要与其他波导重叠，导致检测功率值偏高。

最后，在你完成所有的优化后：
1、把最后的优化完成的结果，保存为一个lumerical FDTD文件让我来检验。
2、撰写一份详细的仿真报告，展示MMI器件的模型结构、传输光场、损耗、分束功率等核心参数。
```
###
![](/uploads/notion/lumerical-fdtd-agent-automation/5.svg)
### Prompt核心要点：
Lumerical 自带的Python路径提取。这个路径一般就跟我的Prompt中的类似，如果找不到的话，可以用 Everything 这个软件搜索 python.exe，就能找到了。一定要把这个路径提供给编程Agent。
介绍所需要仿真的器件的要求，基本的要给出工艺平台，仿真波段等参数，要求当然是写的越详细越好。
验收条件。一定要给予AI一个可量化的验收条件。而且心里要有数这个验收条件是可以设计出来的，如果把握不准，可以跟上一句：“如果达不到这个条件，请在迭代X次后结束”。X可以是十几次、几十次，具体多少需要根据不同的场景来决定。
\*\*要注意的地方：\*\*这里面的几条是使用的过程中发现，Codex等编程Agent容易犯的Lumerical仿真错误，因此特地提醒一下，可以减少一些错误。这些提醒可以固化在所有的Lumerical仿真的Prompt中。
最后，为了方便自己验收，可以给他提供一些额外的要求，比如创建好文件让我检查，把所有的数据都处理好做成文档等。
<empty-block/>
然后把Prompt发给Codex，就可以等待它仿真结束了，验收成果了。
<empty-block/>
大概等了半个小时，Codex已经自动完成所有仿真，下面是它给我的仿真结果，已经在工作目录下创建好文件：
![](/uploads/notion/lumerical-fdtd-agent-automation/image.png)
打开文件：
![](/uploads/notion/lumerical-fdtd-agent-automation/image.png)
还有他生成好的仿真报告，器件结构图，光场传输图等：
![](/uploads/notion/lumerical-fdtd-agent-automation/mmi-geometry.png)
<empty-block/>
![](/uploads/notion/lumerical-fdtd-agent-automation/mmi-field.png)
<empty-block/>
性能参数也完全满足我的需求。
<empty-block/>
<empty-block/>
# 案例二：给一篇论文和一段 Prompt，复现 Crossing 结构
以这篇发表在Science Advanced上的文章为例：
把文章发给Codex，然后配上这样一段Prompt：
```python
你需要完成Lumerical FDTD仿真任务，具体细节如下：
1. 我正在使用2025 R1版本的Lumerical ，请使用其自带的Python解释器，路径为"C:\Program Files\ANSYS Inc\v251\Lumerical\python-3.9.9-embed-amd64\python.exe"。
2. 复现这篇文章中工作在OFF状态下的Crossing结构。

**验收条件为：认真检查建模材料、结构与原文一致，检测出反射功率正常。**

**请你自己运行代码，根据代码的返回结果，在终端里帮我debug程序，直到最终整个代码可以正常运行。并且器件性能满足验收条件。**

最后，在你完成优化后，把最后的优化完成的结果，保存为一个lumerical FDTD文件让我来检验。
```
等待仿真结果出炉直接验收就好了。
<empty-block/>
<empty-block/>
# 整个方案的总结：
![](/uploads/notion/lumerical-fdtd-agent-automation/2.svg)
整个流程可以概括为四步：
**第一步：准备环境。** 创建一个工作文件夹，打开 Codex（或其他编程 Agent），将文件夹设为 Workspace。
**第二步：编写 Prompt。** 这是核心环节，Prompt 里需要包含四个关键信息——Lumerical 自带 Python 解释器的路径、器件结构与工艺参数（材料、波段、波导尺寸等）、可量化的验收条件（比如损耗小于 0.5dB、功率不均衡度小于 5%）、以及交付物要求（保存 .fsp 文件、输出仿真报告）。
**第三步：发送 Prompt，等待 Agent 自动执行。** Agent 会自己建模、运行仿真、读取结果、发现问题、修改参数、重新跑——整个"写代码→跑仿真→看报错→改代码"的循环完全由它自主完成，不需要人盯着。
**第四步：验收结果。** 打开 Agent 生成的 .fsp 文件检查模型结构，查看仿真报告中的光场分布、损耗、分束比等指标，确认是否满足验收条件。不满足就补充反馈让它继续迭代。
一句话说就是：**你负责定义问题和验收标准，Agent 负责中间所有的脏活累活。**
<empty-block/>
# 为什么 Lumerical 场景特别适合做 Vibe Coding？
![](/uploads/notion/lumerical-fdtd-agent-automation/6.svg)
并不是所有工作都适合一上来就交给 Agent，但 Lumerical 仿真是一个非常典型的适合场景。
原因至少有四个。
第一，任务目标足够清晰。
器件是什么、材料是什么、工作波段是什么、工艺参数是什么、最终指标是什么，这些都可以被明确写出来。
第二，反馈链条足够完整。
脚本运行是否报错、结构是否生成成功、模式是否正确、损耗是否达标、功率是否均分，这些都会通过日志、图像和数值直接反馈回来。
第三，验收条件可以量化。
很多研发任务之所以难以自动化，不是因为 AI 不够聪明，而是因为“做成什么样算完成”说不清楚。仿真任务恰好相反，它天然适合写成验收条件。
第四，交付物是可以检查的。
最终不仅可以拿到脚本，还可以拿到 `.fsp` 文件、场分布图、参数报告和性能指标。也就是说，Agent 的工作不是停留在“给建议”，而是能落到一个可复核的结果上。
这也是为什么我越来越觉得，Vibe Coding 在科研和工程里的价值，不只是节省一点写代码的时间，而是把原来靠人盯着软件一点点推进的流程，变成一个可重复、可追踪、可复盘的自动迭代系统。
<empty-block/>
# 思考
科研的时候，有多少个日夜在跑仿真，一点一点建模型，debug，优化参数。
但是现在，一段Prompt就可以让AI完全替你完成这些工作。
睡觉前把任务交给AI，躺在床上，或许还没睡着，AI已经把任务完成。
<span color="orange">**回头想想，真有点不真实。但这不是梦，是时代确确实实翻了一页。**</span>
<empty-block/>
**工具从来不是为了取代思考，而是为了把思考者从重复劳动中解放出来。**
当年 MATLAB 替我们算矩阵，FDTD 替我们解麦克斯韦方程，今天 Agent 开始替我们操作这些求解器本身。每一次，我们都把自己往上抬了一层。
<span color="orange">**你还在手动调参的每一个小时，都是你本可以用来思考下一个突破的一个小时。**</span>
<span color="orange">**我们热爱科研，不是因为热爱熬夜调参，而是热爱那些灵光乍现的瞬间。把重复的还给机器，把星辰留给自己。**</span>
<span color="orange">**未来不属于最会写代码的人，而属于最会提问的人。**</span>
<empty-block/>
<empty-block/>
<empty-block/>
**回头想想，真有点不真实。但这不是梦，是时代确确实实翻了一页。**
**我们热爱科研，不是因为热爱熬夜调参，而是热爱那些灵光乍现的瞬间。把重复的还给机器，把星辰留给自己。**
<empty-block/>
<empty-block/>
<empty-block/>
<empty-block/>
<empty-block/>
<empty-block/>

# VidLuxe 工作流程图

> **版本**: 1.0
> **更新日期**: 2026-02-16

## 完整工作流程图

```mermaid
flowchart TB
    subgraph User["👤 用户输入"]
        A1[原始视频<br/>MP4/MOV]
        A2[参考风格图<br/>可选]
        A3[文字内容<br/>可选]
    end

    subgraph Stage1["Stage 1: 风格学习"]
        B1{有参考图?}
        B2[B-LoRA<br/>风格提取]
        B3[预设风格库]
        B4[StyleProfile<br/>风格配置]
    end

    subgraph Stage2["Stage 2: 素材生成"]
        C1[Prompt 构建器]
        C2[Nano Banana API]
        C3[背景图<br/>1080x1920]
        C4[文字卡片<br/>可选]
        C5[装饰元素<br/>可选]
    end

    subgraph Stage3["Stage 3: 人物抠像"]
        D1[视频抽帧<br/>FFmpeg]
        D2[关键帧选择<br/>每5帧取1]
        D3[MODNet<br/>人物抠像]
        D4[帧间插值<br/>光流算法]
        D5[透明视频<br/>ProRes 4444]
    end

    subgraph Stage4["Stage 4: 视频合成"]
        E1[Remotion<br/>合成模板]
        E2[图层叠加<br/>背景+人物+文字]
        E3[效果处理<br/>调色+暗角]
        E4[Lambda 渲染<br/>H.264 编码]
    end

    subgraph Output["📦 输出交付"]
        F1[高级化视频<br/>MP4]
        F2[素材包<br/>背景/卡片]
        F3[处理报告<br/>Before/After]
    end

    A1 --> D1
    A2 --> B1
    A3 --> C1

    B1 -->|是| B2
    B1 -->|否| B3
    B2 --> B4
    B3 --> B4
    B4 --> C1

    C1 --> C2
    C2 --> C3
    C2 --> C4
    C2 --> C5

    D1 --> D2
    D2 --> D3
    D3 --> D4
    D4 --> D5

    C3 --> E1
    C4 --> E1
    C5 --> E1
    D5 --> E2
    E1 --> E2
    E2 --> E3
    E3 --> E4

    E4 --> F1
    C3 --> F2
    C4 --> F2
    E4 --> F3
```

---

## 数据流图

```mermaid
flowchart LR
    subgraph Input["输入数据"]
        V1[("📹 原始视频<br/>~50MB")]
        V2[("🖼️ 参考图<br/>~2MB")]
        V3[("📝 文案<br/>~1KB")]
    end

    subgraph Processing["处理层"]
        P1[("B-LoRA<br/>风格向量<br/>~25MB")]
        P2[("Nano Banana<br/>背景图 x3<br/>~5MB")]
        P3[("MODNet<br/>遮罩序列<br/>~500MB")]
    end

    subgraph Composition["合成层"]
        C1[("Remotion<br/>合成配置<br/>~10KB")]
    end

    subgraph Output["输出数据"]
        O1[("🎬 最终视频<br/>~30MB")]
        O2[("📦 素材包<br/>~10MB")]
    end

    V1 -->|"视频帧"| P3
    V2 -->|"图片"| P1
    V3 -->|"文本"| C1

    P1 -->|"风格"| P2
    P2 -->|"背景"| C1
    P3 -->|"人物层"| C1

    C1 -->|"渲染"| O1
    P2 -->|"导出"| O2
```

---

## 时序图

```mermaid
sequenceDiagram
    participant U as 用户
    participant API as API Server
    participant BL as B-LoRA
    participant NB as Nano Banana
    participant MN as MODNet
    participant RM as Remotion Lambda
    participant S3 as R2/S3 Storage

    U->>API: 上传视频 + 参考图
    API->>S3: 存储原始文件
    S3-->>API: 返回 URL

    rect rgb(240, 248, 255)
        Note over API,BL: Stage 1: 风格学习 (~5-10秒)
        API->>BL: 提取风格特征
        BL-->>API: StyleProfile
    end

    rect rgb(255, 250, 240)
        Note over API,NB: Stage 2: 素材生成 (~15秒)
        API->>NB: 生成背景图 (并行)
        NB-->>API: 背景图 URL x3
        opt 有文字卡片
            API->>NB: 生成文字卡片
            NB-->>API: 卡片 URL
        end
    end

    rect rgb(245, 255, 245)
        Note over API,MN: Stage 3: 人物抠像 (~1-2分钟)
        API->>MN: 发送视频帧
        loop 每5帧处理1帧
            MN->>MN: MODNet 推理
        end
        MN->>MN: 帧间插值
        MN-->>API: 透明视频 URL
    end

    rect rgb(255, 240, 245)
        Note over API,RM: Stage 4: 视频合成 (~1-3分钟)
        API->>RM: 提交合成任务
        RM->>RM: 并行渲染帧
        RM->>S3: 存储最终视频
        RM-->>API: 完成
    end

    API-->>U: 返回高级化视频
```

---

## 系统架构图

```mermaid
flowchart TB
    subgraph Client["🖥️ 客户端"]
        Web[Web App<br/>Next.js]
    end

    subgraph Edge["🌐 边缘层"]
        CDN[Cloudflare CDN]
        EdgeFn[Vercel Edge<br/>API Routes]
    end

    subgraph Compute["⚙️ 计算层"]
        API[tRPC API<br/>Vercel Serverless]
        Queue[任务队列<br/>Upstash Redis]
    end

    subgraph AI["🤖 AI 服务层"]
        BL[B-LoRA<br/>Modal GPU]
        NB[Nano Banana<br/>External API]
        MN[MODNet<br/>Replicate/Modal]
    end

    subgraph Render["🎬 渲染层"]
        RL[Remotion Lambda<br/>AWS]
    end

    subgraph Storage["💾 存储层"]
        DB[(Supabase<br/>PostgreSQL)]
        Cache[(Redis<br/>Upstash)]
        Object[(R2/S3<br/>对象存储)]
    end

    Web --> CDN
    CDN --> EdgeFn
    EdgeFn --> API

    API --> Queue
    Queue --> BL
    Queue --> NB
    Queue --> MN
    Queue --> RL

    BL --> Object
    NB --> Object
    MN --> Object
    RL --> Object

    API --> DB
    API --> Cache
```

---

## 状态流转图

```mermaid
stateDiagram-v2
    [*] --> Uploaded: 用户上传

    Uploaded --> StyleLearning: 开始处理
    StyleLearning --> StyleReady: 风格提取完成
    StyleLearning --> StyleError: 提取失败

    StyleReady --> AssetGeneration: 生成素材
    AssetGeneration --> AssetsReady: 素材完成
    AssetGeneration --> AssetError: 生成失败

    AssetsReady --> Segmentation: 开始抠像
    Segmentation --> Segmented: 抠像完成
    Segmentation --> SegmentError: 抠像失败

    Segmented --> Composition: 开始合成
    Composition --> Rendering: Lambda 渲染中
    Rendering --> Completed: 渲染完成
    Rendering --> RenderError: 渲染失败

    Completed --> [*]: 交付用户

    StyleError --> [*]: 返回错误
    AssetError --> [*]: 返回错误
    SegmentError --> [*]: 返回错误
    RenderError --> [*]: 返回错误
```

---

## 并行处理流程

```mermaid
flowchart TB
    subgraph Sequential["⏱️ 串行阶段"]
        S1[风格学习<br/>~10秒]
    end

    subgraph Parallel["⚡ 并行阶段"]
        P1[背景图生成<br/>~5秒]
        P2[卡片生成<br/>~5秒]
        P3[装饰元素<br/>~5秒]
    end

    subgraph Segmentation["🎯 抠像阶段"]
        G1[帧提取]
        G2[批量抠像<br/>~90秒]
        G3[帧插值]
    end

    subgraph Composition["🎬 合成阶段"]
        C1[图层合成]
        C2[Lambda 渲染<br/>~90秒]
    end

    S1 --> P1
    S1 --> P2
    S1 --> P3

    P1 --> G2
    P2 --> G2
    P3 --> G2

    G1 --> G2
    G2 --> G3
    G3 --> C1

    C1 --> C2

    style P1 fill:#e1f5fe
    style P2 fill:#e1f5fe
    style P3 fill:#e1f5fe
```

---

## 错误处理流程

```mermaid
flowchart TB
    subgraph Normal["✅ 正常流程"]
        N1[任务提交]
        N2[处理中]
        N3[完成]
    end

    subgraph Retry["🔄 重试逻辑"]
        R1{可重试?}
        R2[指数退避]
        R3[重新执行]
        R4[标记失败]
    end

    subgraph Fallback["🔀 降级方案"]
        F1[使用预设风格]
        F2[使用简化背景]
        F3[跳过抠像]
    end

    N1 --> N2
    N2 --> N3

    N2 -->|错误| R1
    R1 -->|是| R2
    R2 --> R3
    R3 --> N2
    R1 -->|否| R4

    R4 --> F1
    R4 --> F2
    R4 --> F3

    F1 --> N2
    F2 --> N2
    F3 --> N2
```

---

## 成本流程图

```mermaid
flowchart LR
    subgraph PerVideo["💵 单视频成本"]
        C1[B-LoRA<br/>$0.01]
        C2[Nano Banana<br/>$0.025]
        C3[MODNet<br/>$0.18]
        C4[Remotion<br/>$0.05]
        C5[存储/带宽<br/>$0.02]
    end

    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> C5

    C5 --> Total[**总计: ~$0.29**<br/>约 ¥2.1/视频]

    style Total fill:#c8e6c9
```

---

## 关键指标仪表板

```mermaid
mindmap
  root((VidLuxe<br/>指标))
    性能
      总处理时间
        目标: &lt;3分钟
      各阶段耗时
        风格学习: ~10秒
        素材生成: ~15秒
        人物抠像: ~2分钟
        视频合成: ~2分钟
    质量
      用户满意度
        目标: &gt;4.0/5.0
      风格匹配度
        目标: &gt;75%
    成本
      单视频成本
        目标: &lt;$0.30
      月度预算
        MVP: ~$100/月
    可靠性
      成功率
        目标: &gt;98%
      错误恢复
        自动重试
```

---

## 使用说明

### 在 Markdown 中渲染

将以上 Mermaid 代码块复制到支持 Mermaid 的 Markdown 编辑器中即可渲染：

- **GitHub**: 原生支持
- **VS Code**: 安装 Markdown Preview Mermaid Support 插件
- **Typora**: 原生支持
- **Notion**: 使用 Mermaid 代码块

### 在线预览

- [Mermaid Live Editor](https://mermaid.live/)
- 复制代码块内容粘贴即可预览

### 导出图片

```bash
# 使用 Mermaid CLI
npx @mermaid-js/mermaid-cli -i workflow.mmd -o workflow.png
```

---

## 更新历史

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-16 | 1.0 | 初始版本 |

# CORE-backed NEXUS research run

Run date: 2026-05-07

## Goal

Run NEXUS like a real user doing literature discovery, without a Semantic Scholar API key, using CORE as the scholarly search provider.

Chosen research topic:

> Retrieval Augmented Generation Evaluation

Keywords:

- retrieval augmented generation
- RAG evaluation
- hallucination reduction
- open domain question answering

## What I changed first

The existing lit-watch path only supported `arxiv` and `semantic_scholar`, so a real CORE-backed run was not possible until CORE was added as a first-class provider.

Implemented changes:

- Added `CORE_API_KEY` to environment config.
- Added `src/tools/core-client.ts` for CORE API v3 work search.
- Added `core` to the allowed `watch_sources`.
- Wired `CoreClient` into the main app tool registry.
- Updated lit-watch to query CORE when a thread has `watch_sources: ["core"]`.
- Updated thread creation so lit-watch uses `arxiv` + `core`, and only includes `semantic_scholar` when `SEMANTIC_SCHOLAR_API_KEY` exists.
- Fixed nested file-lock deadlocks in `IndexStore.updateThread()` and `ConnectionStore.addConnection()`.
- Made lit-watch resilient when one provider fails, so arXiv rate limits do not prevent CORE from completing.
- Fixed the no-LLM fallback relevance behavior so papers can still be saved when no LLM key is configured.

## Environment note

`CORE_API_KEY` was added to `.env` and `.env.example`.

At run time, no actual `CORE_API_KEY` value was present in `.env` or the shell, so this run used CORE's public unauthenticated access. To run with a key, set:

```env
CORE_API_KEY=your_core_key_here
```

## Commands used

Build the project:

```powershell
npm.cmd run build
```

Create an isolated local NEXUS memory folder for the research run:

```powershell
$env:NEXUS_MEMORY_PATH='D:\nexus_open_claw\.nexus-research-run'
node dist/scripts/setup.js
```

Create the research thread through the compiled NEXUS memory APIs:

```powershell
$env:NEXUS_MEMORY_PATH='D:\nexus_open_claw\.nexus-research-run'
node --input-type=module -e "import { loadConfig } from './dist/config/index.js'; import { createLogger } from './dist/utils/logger.js'; import { createMemoryStores } from './dist/memory/index.js'; import { toIsoTimestamp } from './dist/utils/time.js'; const config=await loadConfig(); const logger=createLogger({level:config.logLevel, logPath:config.logPath}); const memory=createMemoryStores(config.memoryPath, logger); const now=toIsoTimestamp(); const thread={id:'retrieval-augmented-generation-evaluation',slug:'retrieval-augmented-generation-evaluation',title:'Retrieval Augmented Generation Evaluation',status:'active',priority:'high',created_at:now,last_touched:now,last_snapshot:now,topic_keywords:['retrieval augmented generation','RAG evaluation','hallucination reduction','open domain question answering'],source_count:0,insight_count:0,connection_count:0,dormancy_threshold_hours:72,watch_sources:['core']}; await memory.index.updateThread(thread); await memory.threads.ensureThreadStructure(thread); process.exit(0);"
```

Run the lit-watch behavior against CORE:

```powershell
$env:NEXUS_MEMORY_PATH='D:\nexus_open_claw\.nexus-research-run'
node --input-type=module -e "import { loadConfig } from './dist/config/index.js'; import { createLogger } from './dist/utils/logger.js'; import { createMemoryStores } from './dist/memory/index.js'; import { HeartbeatStateStore } from './dist/engine/heartbeat-state.js'; import { createLitWatchBehavior } from './dist/skills/lit-watch.js'; import { CoreClient } from './dist/tools/core-client.js'; const config=await loadConfig(); const logger=createLogger({level:config.logLevel, logPath:config.logPath}); const memory=createMemoryStores(config.memoryPath, logger); await memory.index.load(); await memory.connections.load(); const services={config,memory,tools:{core:new CoreClient(config.env.CORE_API_KEY)},channels:{},heartbeatState:new HeartbeatStateStore(config.memoryPath),logger}; const behavior=createLitWatchBehavior(services); await behavior.handler({signal:{type:'daily_schedule',timestamp:new Date().toISOString(),payload:{schedule:'lit_watch'}}}); process.exit(0);"
```

The successful run logged:

```text
Lit watch complete: newSources=10, thread=retrieval-augmented-generation-evaluation
```

## Output files

Raw lit-watch results:

```text
.nexus-research-run\threads\retrieval-augmented-generation-evaluation\lit-watch-2026-05-07.json
```

Saved sources:

```text
.nexus-research-run\threads\retrieval-augmented-generation-evaluation\sources.yaml
```

## Final research result

NEXUS added 10 new unread CORE sources for the topic.

1. Graphrag for the Portuguese legal domain - a comparative study of graph-based document relationships and traditional RAG pipelines
   - Author: Patricia Nunes Domingos Esteves
   - Year: 2025
   - URL: https://core.ac.uk/works/300214089
   - Why it matters: Compares graph-based document relationships with traditional RAG pipelines, useful for evaluation designs where relationship reasoning matters.

2. A Comprehensive Survey of Hallucination Mitigation Techniques in Large Language Models
   - Authors: Aman Chadha, Amitava Das, Vinija Jain, Anku Rani, Vipula Rawte, S. M Towhidul Islam Tonmoy, S M Mehedi Zaman
   - Year: 2024
   - URL: https://core.ac.uk/works/157283975
   - Why it matters: Broad survey of hallucination mitigation techniques, including retrieval-augmented generation.

3. Mitigating Hallucinations in Large Language Models via Self-Refinement-Enhanced Knowledge Retrieval
   - Authors: Hamed Haddadi, Hao Li, Fan Mo, Mengjia Niu, Jie Shi
   - Year: 2024
   - URL: https://core.ac.uk/works/162766677
   - Why it matters: Targets hallucination reduction through knowledge retrieval and refinement, close to RAG evaluation concerns.

4. Hallucination-Free? Assessing the Reliability of Leading AI Legal Research Tools
   - Authors: Matthew Dahl, Daniel E. Ho, Varun Magesh, Christopher D. Manning, Faiz Surani, Mirac Suzgun
   - URL: https://core.ac.uk/works/171641250
   - Why it matters: Evaluates reliability and hallucinations in legal AI tools, a strong applied benchmark area.

5. Retrieval Augmented Generation for Intelligent Querying of Databases and Documents
   - Author: Owais Ali
   - URL: https://core.ac.uk/works/290421198
   - Why it matters: Looks at RAG for querying structured and document sources.

6. Grounding Language Model with Chunking-Free In-Context Retrieval
   - Authors: Zhicheng Dou, Zheng Liu, Kelong Mao, Hongjin Qian, Yujia Zhou
   - URL: https://core.ac.uk/works/157598892
   - Why it matters: Explores retrieval and grounding without standard chunking, relevant to retrieval quality tradeoffs.

7. Optimizing document reranking in a retrieval-augmented generation pipeline for Portuguese legal research
   - Author: Carolyn Svea Wollny
   - URL: https://core.ac.uk/works/300220480
   - Why it matters: Focuses on reranking inside a RAG pipeline, an important evaluation lever.

8. Survey on Factuality in Large Language Models: Knowledge, Retrieval and Domain-Specificity
   - Authors: Wenyang Gao, Xuming Hu, Cheng Jiayang, Xiaoze Liu, Zehan Qi, Xiangru Tang, Cunxiang Wang, Jindong Wang, Yidong Wang, Xing Xie, Linyi Yang, Yunzhi Yao, Yuanhao Yue, Tianhang Zhang, Yue Zhang, Zheng Zhang
   - URL: https://core.ac.uk/works/157156700
   - Why it matters: Connects factuality, retrieval, and domain specificity.

9. Luna: An Evaluation Foundation Model to Catch Language Model Hallucinations with High Accuracy and Low Cost
   - Authors: Masha Belyi, Robert Friel, Atindriyo Sanyal, Shuai Shao
   - URL: https://core.ac.uk/works/174760649
   - Why it matters: Directly relevant to hallucination evaluation.

10. Ever: Mitigating Hallucination in Large Language Models through Real-Time Verification and Rectification
    - Authors: Haoqiang Kang, Juntong Ni, Huaxiu Yao
    - URL: https://core.ac.uk/works/153548070
    - Why it matters: Covers real-time verification and correction, a complementary approach to retrieval grounding.

## Observations

- CORE worked for the requested research pass even without Semantic Scholar.
- arXiv hit a live `429 Rate exceeded` during an attempted combined run. After provider isolation was added, this no longer blocks CORE.
- Because no LLM provider key was configured, lit-watch used the non-LLM relevance path.
- The resulting sources are now available in `sources.yaml` with `status: new_unread`.

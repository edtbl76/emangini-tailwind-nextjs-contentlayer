# Defense-in-Depth Guardrails: Four Complementary Layers for LLM Applications

## Stage

- [x] Hypothesis _(retroactive, see note)_
- [x] Research
- [x] Thesis _(gate. Rewritten and human-approved 2026-08-27 per D7. The 2026-08-11 version
      is retained below as history)_
- [x] Outline _(rebuilt 2026-08-27 on the D7 thesis, in five parts following the three
      evidence roles plus the count. The Minto exec-summary shape carries over; the earlier
      2026-08-27 pyramid and the 2026-08-11 version are retained below as history)_
- [x] Draft _(full draft 2026-08-27, 37,037 chars, 11 sections, validates clean, behind
      `draft: true` pending review. The 2026-08-10 draft was discarded. It was written against
      the pre-2026-08-11 outline
      and carried three superseded claims: a "tier" section against D1, "Structure is the layer
      nobody sells you" after the thesis demoted it, and the 1B to 8B escalation as a live
      argument. §1 of a fresh draft exists at `data/blog/2026/defense_in_depth_guardrails.md`
      behind `draft: true`)_

> **Ordering note.** This hypothesis was written on 2026-08-10, after the research it is
> supposed to precede. That is backwards and it is recorded as such rather than hidden. It
> is a reconstruction of the claim carried by the source document as handed over, written
> deliberately without reference to what the research found. The `## Hypothesis vs. what
research actually tested` section below audits how badly the inversion cost us. Treat the
> falsifier here as untested rather than survived.

## Hypothesis

**Claim.** An LLM application needs multiple — likely four — complementary guardrail
**layers**: scan, classify, dialog, structure. Each catches a failure mode the others
structurally cannot. **Layers are not tools.** How many products implement them is an
orthogonal deployment question: one tool may span several layers, and one layer may escalate
across several model tiers.

> **Correction (2026-08-10, author).** My first reconstruction of this claim ended with "and
> no single tool covers all four," and that clause was mine, not the author's — the stated
> position was always about layers (the author's word at the time was "tiers" — see **D1**,
> which settles the vocabulary). The falsifier pass below was consequently aimed at a claim
> nobody made, and its verdict is re-scored in place. The source document's own phrasing
> ("four complementary, industry-standard tools") invited the misreading, which is worth
> remembering when the post is drafted: **if a distilled doc led me to conflate layer with
> tool, it will do the same to a reader.** Making the distinction explicit is now a job the
> post has to do.

The stack's own Classify layer demonstrates the orthogonality directly: a single tool (Llama
Guard) spans a 1B→8B escalation **tier** _within_ one layer. Layer count and tool count are
independent axes, and tiers are a third axis running vertically inside a layer.

**Who it's for.** Engineers building LLM or agent systems who are treating "which guardrail
should I put in front of the model" as a single-product decision, and who will otherwise buy
one scanner and consider the problem handled.

**What would falsify it.** Any of three findings would wound it badly:

1. ~~A single tool or platform demonstrably covers all four jobs~~ — **withdrawn, invalid.**
   This tested tool count, not layer count, and was never part of the claim. Product packaging
   says nothing about whether the layers are real. See the correction above.
2. The layers overlap enough in practice that two or three catch effectively everything the
   four do, making the fourth pure operational cost.
3. The layers do not in fact catch distinct things — e.g. the content-safety classifier
   flags substantially the same traffic the I/O scanner already caught.

**Falsifiers 2 and 3 are the live ones, and both are ultimately empirical rather than
bibliographic** — they are answered by overlap measurements in shadow-mode logs, not by
papers.

**Why I might be wrong.** The strongest opposing case is operational, and it is a good one.
Four guards means four services, four dependency trees, four failure modes, four sources of
false positives, and latency on every request. The rival position is that a single competent
scanner plus the model's own safety alignment covers the large majority of real risk at a
fraction of the complexity — and that layers three and four are ceremony bought at the price
of an on-call rotation. A team that shipped one scanner and moved on may simply be right.

## Question

Does the four-layer guardrail stack (Scan · Classify · Dialog · Structure) hold up as an
engineering recommendation, and is each layer's "one job" claim supported by primary
sources rather than vendor marketing?

Secondary question the research had to answer: are the specific tools named in the source
draft still the right ones to name in August 2026?

## Findings

### The core claim — no single guardrail is sufficient — is well supported

OWASP's 2025 Top 10 for LLM Applications keeps prompt injection at LLM01 for a second
consecutive edition and explicitly frames mitigation as defense-in-depth: input validation
_plus_ output filtering _plus_ privilege restriction _plus_ human-in-the-loop for sensitive
operations. It states that neither RAG nor fine-tuning fully mitigates the class. This is
the strongest available backing for the article's thesis and should be cited early.

Beurer-Kellner et al. (2025) reach the same conclusion from the design-pattern direction:
they propose six patterns for prompt-injection resistance rather than one, and explicitly
trade utility against security per pattern. Strength: strong — 14 authors across ETH Zurich,
Google, Microsoft, IBM, Invariant Labs.

### The layers map to genuinely distinct, documented failure modes

- **Scan** — LLM Guard ships 15 input scanners and 21 output scanners (README-confirmed
  list below). The input/output split is real: `Anonymize` on the way in pairs with
  `Deanonymize` on the way out. Strength: strong (primary README).
- **Classify** — Inan et al. (2023) built Llama Guard specifically as an _LLM-based_
  input-output safeguard with a taxonomy, arguing that classification is a different task
  from scanning. Strength: strong (peer-adjacent, arXiv, Meta).
- **Dialog** — Rebedea et al. (2023) frame NeMo Guardrails around _conversational_ control
  (topic routing, dialogue paths), i.e. stateful behavior the stateless I/O scanners have
  no notion of. Strength: strong (primary paper).
- **Structure** — Guardrails AI's re-ask mechanism is documented: `OnFailAction.REASK`
  generates a field-targeted reask prompt, `num_reasks` caps retries, `Guard.for_pydantic()`
  is the entry point. Strength: strong (primary docs).

### The Llama Guard 1B-vs-8B worked example is corroborated

The draft's anecdote (1B said "violent crime," 8B said "indiscriminate weapons") maps
exactly onto Meta's published MLCommons taxonomy: **S1 = Violent Crimes**, **S9 =
Indiscriminate Weapons** (chemical, biological, radiological, nuclear, high-yield
explosive). The 1B model card also documents the tradeoff that justifies escalation:
English F1 of **0.899 (1B)** vs **0.939 (8B)**, with Meta itself recommending 8B where
"better safety classification performance" is wanted "at a higher deployment cost." The
1B model is trained on 13 categories; 8B on 14 (adds Code Interpreter Abuse for tool-call
use cases). Strength: strong — the anecdote is now evidence, not just a story.

### Independent benchmarking validates LLM Guard specifically

Palit & Woods (2025) surveyed 13 LLM security solutions (9 proprietary, 4 open source);
only 7 could be evaluated because proprietary vendors declined to participate. **LLM Guard
and Lakera Guard "emerged as the best overall tools showcasing the tradeoff between
usability and performance."** The ChatGPT-3.5-Turbo baseline had "too many false positives
to be used for this task." Strength: moderate — small study, single dataset, and the
non-participation of 6 of 13 tools limits the comparison.

### The Scan layer as now built: Prompt Guard 2 + Presidio + NLI

**This section supersedes the "material correction" below.** The stack has already retired
its all-in-one Scan tool and replaced it with focused components (source repo commit
`421bedd`). The archival finding is therefore no longer a recommendation to act on — it is
the article's best piece of evidence. Research on the replacements:

**Llama Prompt Guard 2 (injection).** Two sizes, 86M and 22M, both trained to detect prompt
injection _and_ jailbreak attempts. Reported on Meta's model card:

|                           | 86M     | 22M     |
| ------------------------- | ------- | ------- |
| AUC (English)             | .998    | .995    |
| Recall @ 1% FPR (English) | 97.5%   | 88.7%   |
| AUC (multilingual)        | .995    | .942    |
| Latency (A100, 512 tok)   | 92.4 ms | 19.3 ms |

The 22M cuts latency and compute roughly 75% at a real multilingual cost (the xsmall base
lacks multilingual pretraining). Base models are DeBERTa variants under MIT; the Llama
models themselves carry the Llama Community License. 512-token context window — worth
noting, since a long injected document can exceed it. Meta's own listed limitation is
"vulnerability to adaptive attacks." Strength: strong (primary model card), but these are
vendor-reported numbers on a private benchmark.

**Presidio (PII).** Microsoft, MIT licensed, ~8 years old, 8,800+ stars, 183 contributors,
still releasing in 2026 (2.2.362, March 2026). Cleanly separates _detection_ (Analyzer —
finds spans, labels entity types with confidence) from _transformation_ (Anonymizer —
replace / mask / redact / encrypt). Strength: strong on maintenance signal; the sourcing on
the release number is a secondary blog, so treat the exact version as soft.

**Note the continuity:** the retired all-in-one tool's anonymization scanners wrapped
Presidio underneath. Going direct removed a wrapper, not a capability. This is the detail
that makes the swap a _de-bundling_ rather than a migration, and it is worth saying plainly
in the article.

**The NLI grounding check — researched 2026-08-10, gate closed.**

Natural Language Inference classifies a premise/hypothesis pair as _entailment_,
_contradiction_, or _neutral_. Applied to grounding, the retrieved context is the premise and
the model's answer is the hypothesis: an answer that is not entailed by its sources is
ungrounded. NLI entailment correlates with attribution and factuality scores and is the
standard baseline for hallucination detection, which is why it is the right primitive for
this job rather than a bolted-on LLM call.

The lineage inside this stack is worth noting: the retired all-in-one scanner shipped a
`FactualConsistency` output scanner, so grounding was already an NLI-shaped job there. Like
the PII component, it survived the de-bundling as a dedicated piece rather than a new
capability.

The established approaches, in order of how they evolved:

- **SummaC** — aggregates sentence-level NLI entailment between document and summary sentence pairs.
- **AlignScore** — trains on multiple semantic alignment tasks, scored at chunk level.
- **MiniCheck** — addresses training-data scarcity by synthesizing hallucinated examples.
- **Vectara HHEM** — a fine-tuned factual-consistency classifier trained with contrastive,
  entailment-based objectives, aimed squarely at RAG. `HHEM-2.1-Open` is the open-weights
  variant; the leaderboard itself runs on the commercial `HHEM-2.3`. ⚠ The 3.5M-download
  figure comes from vendor material — do not cite it as independent adoption evidence.

**The honest limitation, and it matters for the post.** Tamber et al. (2025) built an
evolving RAG-faithfulness leaderboard and introduced _FaithJudge_ specifically because they
observed limitations in current hallucination detection methods — i.e. the NLI-detector
generation this layer depends on. ⚠ The precise accuracy/cost/latency comparison against
LLM-as-judge could not be extracted (the ACL PDF would not parse and the arXiv abstract omits
the numbers); cite the motivation, not a number. The transferable point stands regardless:
**the grounding check is the least settled component in the Scan layer**, cheap and fast but
with documented accuracy limits, and the field is actively moving toward judge-based
verification. That is a real cost of choosing the cheap primitive, and the post should say so
rather than presenting grounding as solved.

### The honest counterweight — these scanners are evadable

Hackett et al. (2025) tested six protection systems including **Meta's Prompt Guard** and
Microsoft's Azure Prompt Shield, using character-injection and adversarial-ML evasion, and
report **up to 100% evasion success** while preserving the attack's utility. They also show
attackers can boost success by computing word-importance rankings from offline white-box
models and transferring them to black-box targets.

This is the single most important citation for the article. It is not a reason to skip the
Scan layer — it is the empirical argument for _why one layer cannot be the whole defense_,
which is the article's thesis. Note the paper predates Prompt Guard **2**, so it is evidence
about the class of detector rather than a direct verdict on the current model. Say that.
Strength: strong (peer-reviewed venue, arXiv, named systems).

### ⚠ SUPERSEDED — LLM Guard is archived (retained as history)

**`protectai/llm-guard` was archived by its owner on July 9, 2026 and is read-only.** The
repository states the project _and its associated Hugging Face models_ are "no longer under
active development or maintained." Context: Palo Alto Networks completed its acquisition of
Protect AI on July 22, 2025 and folded the products into Prisma AIRS; the final release,
v0.3.16, shipped May 2025.

Verified two ways: the GitHub repository's own archive banner, and independent reporting
that names the same date and the acquisition. Note that **the project's documentation site
(`protectai.github.io/llm-guard/`) still describes the project as actively maintained and
"constantly improving"** — the docs are stale relative to the repo. Anyone evaluating the
tool from the docs site alone would get the wrong answer.

This does not invalidate the article's architecture — the _Scan layer_ is still the right
first layer, and an MIT-licensed archived codebase still runs. But the post cannot
recommend LLM Guard as a live dependency without saying this out loud, and the honest
framing is: name the layer as durable, name the tool as replaceable. That is arguably a
_stronger_ article — it demonstrates why the four-layer decomposition matters more than any
of the four names.

### The false-positive warning in the draft is empirically grounded

Huang et al. (2025) tested 1,123 prompts across three major GenAI platforms. Findings that
directly support the draft's "shadow mode first" advice:

- False-positive spread was enormous: 13.1% (131 benign prompts blocked) on one platform
  vs 0.1% on another.
- The blocked-benign prompts were **disproportionately code review and mathematics
  questions** — the platform could not distinguish benign code-related keywords from
  exploits. This is a concrete, citable hazard for any engineering-facing assistant.
- False negatives ran the other way: one platform's input filters caught only 53% of
  malicious prompts while others caught 91–92%.
- Role-play and narrative-framed attacks bypassed filters across _all_ systems.

This is the best single citation for "measure the false-positive rate on real traffic
before promoting anything to hard-block."

### The NeMo/Colang workaround is a documented path, not a hack

The draft says Colang rails "may not reliably fire" and recommends routing topicality
through a self-check-input LLM judge instead. `self check input` is a **pre-defined flow**
in NeMo Guardrails, configured under `rails.input.flows`, with its prompt supplied in
`prompts.yml`; NVIDIA's docs explicitly describe it as an LLM-as-a-judge technique usable
with either a separate judge model or the guarded model itself. So the fallback is
first-class and supported. Strength: strong for _the alternative being supported_; the
claim that Colang rails misfire is the author's own observation (see Gaps).

### The alternatives, researched properly (2026-08-11)

Commissioned after a draft named competing tools without ever researching them. Listing
names harvested from another paper's bibliography is not a comparison. Two independent
benchmarks now supply real numbers, and **both damage claims the draft was resting on.**

#### Classify: independent benchmarking contradicts the escalation argument

Harsh, Sarmah & Pasquali (2026) benchmarked **14 open source safety guard models** against
79,331 samples aggregated from HarmBench, StrongREJECT, RealToxicityPrompts and BeaverTails,
across eight safety categories. Reported recall and precision:

| Model                   | Recall     | Precision  |
| ----------------------- | ---------- | ---------- |
| Qwen Guard (4B)         | **83.97%** | 68.79%     |
| Nemotron Safety (8B)    | 77.25%     | 74.93%     |
| WildGuard (7B)          | 73.83%     | 72.89%     |
| ShieldGemma (2B)        | 45.49%     | **82.20%** |
| **Llama Guard (12B)**   | **33.32%** | 78.51%     |
| GPT-OSS Safeguard (20B) | 24.86%     | 80.68%     |

Also benchmarked: MD-Judge (7B), Granite Guardian (8B), DynaGuard (8B), DuoGuard (0.5B),
GuardReasoner (3B), and three encoder only models, EthicalEye (270M), PoliteGuard (110M),
MetaHateBERT (110M).

**Two findings that hit this stack directly.**

1. **Llama Guard, the tool in the Classify layer, records the second worst recall in the
   study at 33.32%.** The authors state that "while ShieldGemma achieves highest precision
   (82.20%), it misses 54.51% of unsafe content, and GPT-OSS Safeguard misses 75.14%." Llama
   Guard sits in that same conservative band. The paper argues recall is the metric that
   matters for safety work, since a miss is worse than a false alarm.
2. **Model size does not predict recall.** "The Pearson correlation between log10-transformed
   model size and recall is negligible (r=0.21, p=0.48, n=14)." That is a direct contradiction
   of the draft's escalation argument, which rested on Meta's own F1 figures (0.899 for 1B
   against 0.939 for 8B) to justify spending more compute for a better verdict. **Vendor
   reported F1 on a private benchmark said bigger is better; an independent benchmark across
   14 models says size explains almost nothing.**

⚠ **Caveats that must travel with these numbers.** The benchmark aggregates four datasets
into eight categories of its own; Llama Guard is trained against the MLCommons taxonomy, and
a guard evaluated on a taxonomy it was not built for will under-report. That is a real
confound and it is not a full excuse, because the same is true for every model in the table.
The paper is arXiv, April 2026, and I have not confirmed peer review. Do not present it as
settled, and do not suppress it either.

**What this does to the article.** The Classify section cannot recommend Llama Guard on
vendor F1 and move on. The honest version reports that the tool this stack runs performs
poorly on the one independent benchmark found, names Qwen Guard as the recall leader, and
treats the precision and recall split as the actual decision the reader has to make. It also
weakens the 1B to 8B escalation story, which should now be presented as what it is: a vendor
claim that independent work does not support.

#### Structure: the market is not thin, it is a different industry

The draft claimed Structure is "the layer nobody sells you." **That is wrong as written.**
There is a substantial and competitive market; it simply does not sit inside guardrail
products, which is a different and more interesting claim.

Two mechanisms, not one:

- **Validate then retry**, which is what Guardrails AI does, and what Instructor and BAML
  do. The model generates freely, the output is checked against a schema, and a failure
  triggers a re-ask. Instructor is the popular one, reported at 11K GitHub stars and over
  3M monthly downloads, wrapping provider SDKs with Pydantic validation. BAML is MIT
  licensed and exists partly because strict JSON parsers choke on markdown wrapped output
  and reasoning preambles. ⚠ Those adoption figures come from a secondary summary, not from
  the projects, and need confirming before use.
- **Constrain during generation**, which is a fundamentally different intervention: invalid
  tokens are masked at decode time so malformed output cannot be produced at all. Geng et al.
  (2025) benchmark six such engines, Guidance, Outlines, llama.cpp, XGrammar, OpenAI and
  Gemini, against 10K real world JSON schemas plus the official JSON Schema Test Suite. ⚠ I
  could not extract per engine numbers from the abstract, and the claims circulating about
  Outlines having the lowest compliance and very long compilation times come from a secondary
  blog. Fetch the full paper before citing any figure.

⚠ **One further claim worth confirming:** XGrammar is reported as the default structured
generation backend for vLLM, SGLang and TensorRT-LLM as of March 2026. If that holds, then
Structure is not merely sold, it ships switched on inside the most widely used inference
servers, which would be the strongest possible refutation of the "nobody sells it" line.
Secondary source only so far.

**What this does to the article.** The Structure section needs rewriting rather than
tweaking. The defensible claim is narrower and sharper: **no guardrail platform bundles
Structure, while a separate and healthy tooling ecosystem solves it, and the two worlds
barely reference each other.** That is a real observation about how the market is carved up,
and it survives contact with the evidence. "Nobody sells you the fourth layer" does not.

#### The Classify evidence base, four decision factors (2026-08-11)

Built after the author noted that one paper is not a body of evidence, and that quality is
only one of four factors. The others are cost, availability, and deployability on the
hardware and in the time actually available.

**Methodological warning that must survive into any comparison.** Harsh et al. and Young
are different benchmarks with different prompts, categories, and scoring. **Their numbers
cannot be merged into one ranking.** Read them as two independent views that happen to
disagree, which is the most useful thing about having both.

| Model             | Publisher | Sizes        | Recall / Precision (Harsh) | Generalization (Young)                                                                 |
| ----------------- | --------- | ------------ | -------------------------- | -------------------------------------------------------------------------------------- |
| Qwen3Guard        | Alibaba   | 0.6B, 4B, 8B | 83.97 / 68.79 (4B)         | **collapses: 91.0% to 33.8% on unseen attacks, a 57.2 point gap (8B)**                 |
| Nemotron Safety   | NVIDIA    | 8B           | 77.25 / 74.93              | tested; emitted harmful content in some conditions                                     |
| WildGuard         | AI2       | 7B           | 73.83 / 72.89              | not in Young's set                                                                     |
| Granite Guardian  | IBM       | 5B, 8B       | not in Harsh's top table   | **best generalization, 6.5% decline**; also emitted harmful content in some conditions |
| ShieldGemma       | Google    | 2B, 9B       | 45.49 / 82.20              | not in Young's set                                                                     |
| Llama Guard       | Meta      | 1B, 8B, 12B  | 33.32 / 78.51 (12B)        | not in Young's set                                                                     |
| GPT-OSS Safeguard | OpenAI    | 20B          | 24.86 / 80.68              | not in Young's set                                                                     |

**Quality: the two benchmarks disagree in a way that matters.** Harsh et al. rank by recall
and Qwen3Guard wins. Young tests generalization to unseen adversarial prompts and Qwen3Guard
is the one that falls apart, 91.0% down to 33.8%, while Granite Guardian holds within 6.5%.
Young's conclusion is explicit: "generalization ability, not overall accuracy, should be the
primary metric for guardrail evaluation." **A switch justified purely on Harsh's recall table
would land on the model Young singles out as the most brittle.** That is the strongest single
argument for not moving fast here.

Also from Young, and genuinely alarming for any of these as a _guard_: Nemotron Safety and
Granite Guardian were observed **generating harmful content rather than blocking it** under
certain conditions. A guard model that can be induced to emit the thing it is meant to catch
is a different risk class than one that merely misses.

Liu et al. (2024, ICLR 2025) add a third view across 9 guard models and 12 benchmarks:
guard models are **overconfident**, become **significantly miscalibrated under jailbreak
attack**, and show limited robustness across response models. Temperature scaling and
contextual calibration help. This is the paper that says the confidence score coming out of
any of these should not be trusted as a probability.

**Availability and licensing.** Qwen3Guard is the standout: Apache 2.0, stated in the
technical report as covering all models, in three sizes, with 119 languages. Llama Guard
carries the Llama Community License with its monthly active user ceiling, which is a real
constraint for some deployments and a non-issue for a lab.

⚠ **Do not repeat my error here.** For ShieldGemma and Granite Guardian I have only
confirmed the **paper** licenses (CC BY 4.0), which say nothing about the model weights.
Gemma models ship under Gemma Terms of Use, not a standard open source licence, and IBM's
Granite weights are commonly Apache 2.0 but I have not confirmed it for Guardian
specifically. **Confirm weight licences from the model cards before any of this is written
down as fact.**

**Deployability, which is where the shortlist really narrows.**

- **Qwen3Guard ships two architectures, not one.** Generative, which frames classification
  as instruction following and gives the tri-class safe / controversial / unsafe judgment,
  and **Stream, which does token level classification during generation**. The Stream variant
  is a genuinely different deployment shape and suits real time monitoring rather than a
  request boundary check.
- **The 0.6B size is the interesting one for a CPU default tier.** It is the only sub-1B
  option in this set aside from DuoGuard, and it is what makes a like for like swap against
  a small CPU model plausible at all.
- **Granite Guardian covers RAG groundedness, context relevance, and answer relevance**
  alongside content harms. That overlaps the NLI grounding component in Scan. Worth noting
  that adopting it could collapse part of two layers into one tool, which is exactly the
  layer versus tool distinction the article is about.
- ⚠ **VRAM figures are secondary sourced and must be confirmed:** Llama Guard 3 8B around
  4.9 GB, ShieldGemma 9B around 5.8 GB, Granite Guardian 3.3 8B around 6.7 GB, all quantized.
  GGUF at Q4_K_M is reported to cut VRAM roughly 75% against FP16. CPU inference is reported
  at single digit tokens per second, which matters less than it sounds for a guard emitting a
  handful of tokens, but should be measured rather than assumed.

**Cost.** No source in this pass priced these models per request or per GPU hour. What the
evidence supports is narrower and still useful: **size does not buy recall** (Harsh et al.
report r=0.21, p=0.48, n=14 between log model size and recall), so the cheapest defensible
configuration is not obviously worse than the expensive one. That is a cost argument built
on quality evidence rather than a price list.

**Where this leaves the tooling decision.** Not a clean answer, which is itself the finding.
Qwen3Guard wins on recall, licence, size range, and language coverage, and loses badly on
generalization to novel attacks. Granite Guardian wins on generalization and covers grounding
too, and has been seen emitting harmful content. Llama Guard, the incumbent, is poor on
recall in the one large benchmark that includes it and untested in the generalization study.
**No published evidence resolves this for a specific stack; a replay against real shadow
traffic would.**

#### Scan and Dialog: still under-researched, flagged not fudged

LlamaFirewall, OpenGuardrails, Azure Prompt Shields and Bedrock filters have been read only
at the level of what they claim to cover. No independent benchmark comparing them was found
in this pass. Dialog alternatives are thinner still: Bedrock denied topics is documented,
and "write your own topical judge" is not a product anyone benchmarks. **The article should
either compare Scan and Dialog on capability only, saying plainly that no comparative
evidence was found, or omit the comparison for those two rather than implying one exists.**

## Gaps

- **⚠ The Guardrails AI `click` pin claim is unverified.** The draft states Guardrails AI
  pins click at or below 8.2.0, conflicting with common data tooling. Searching surfaced no
  such issue. What _is_ documented is the same _class_ of problem: guardrails-ai 0.5.15+
  pins `griffe>=0.36.9,<0.37.0`, which conflicts with `openai-agents` requiring
  `griffe>=1.5.6` (issue #1267), and a fresh-install break when litellm was pulled from
  PyPI. **Recommendation: keep the argument, swap the example.** Cite griffe, which is
  documented, rather than click, which is not — or present click as the author's direct
  observation and flag it as such. Never present it as sourced.
- **The claim that "most production stacks run two or three of these"** has no source. It is
  plausible and matches OWASP's layered guidance, but no survey was found that quantifies
  it. Soften to a claim about recommended practice, or drop the quantifier.
- **NeMo/Colang misfiring** is first-hand experience, not a documented defect. Present it as
  such — a field report, explicitly marked.
- **Fail-open as universal best practice** was not confirmed against a primary security
  standard. It is defensible engineering and follows from availability requirements, but it
  is genuinely contested for high-risk surfaces (a fail-open content filter on a
  child-facing product is a bad default). Present as a considered position with its
  tradeoff named, not as settled consensus.
- **Llama Guard 3 model card publication date** is not stated on the card itself. The 1B
  variant shipped alongside Llama 3.2 (September 2024), but since the card is undated and
  versioned in-place, it is cited with a retrieval date rather than a publication year.

## Falsifier pass (2026-08-10) — deliberately hunting the negative case

Run after the audit below flagged that two of three falsifiers were untested. This section
supersedes that audit's "untested" verdict on falsifiers 1 and 2.

### Falsifier 1 — RE-SCORED: not a falsifier at all, and the evidence runs the other way

**Originally logged as "largely confirmed, the claim is wounded." That verdict was wrong**,
because the falsifier itself was invalid — it tested tool count against a claim about layers.
Re-reading the same evidence against the actual claim inverts it: **a unified product still
decomposes into the same layers internally, which is confirmation that the layers are real.**

Bedrock did not dissolve the layers by bundling them. It shipped them as separately
configurable policies, each with its own detection method, tuning surface, and failure mode —
which is precisely what "these are distinct jobs" predicts. Had the layers been a packaging
accident, a single vendor rebuilding from scratch would have had every incentive to collapse
them into one classifier, and did not.

The finding is therefore **market evidence, not counter-evidence**: it tells the post that
readers may already own three layers inside one console and not know they are three. That is
a reason to name the layers more clearly, not a reason to retract them.

From AWS's own component documentation, a single guardrail can be configured with:

| Bedrock policy                                                                  | Maps to                     |
| ------------------------------------------------------------------------------- | --------------------------- |
| Content filters (hate, insults, sexual, violence, misconduct)                   | **Classify**                |
| Prompt attacks — jailbreak, prompt injection, prompt leakage                    | **Scan**                    |
| Sensitive information filters — PII + custom regex                              | **Scan**                    |
| Contextual grounding checks — hallucination + relevance                         | **Scan**                    |
| **Denied topics** — "define a set of topics to avoid"                           | **Dialog**                  |
| Word filters                                                                    | —                           |
| Automated reasoning checks — validate responses against stated logical policies | _adjacent to_ **Structure** |

Denied topics is the one that hurts. Topical scope control was the layer I argued the
stateless scanners "have no notion of" — and it ships as a checkbox in a managed service.

Note what this table actually is: **a competitor's independent re-derivation of the same
layer decomposition.** AWS arrived at scan / classify / topical / grounding as separate
policies without reference to this stack. Independent convergence on a decomposition is
evidence the decomposition tracks something real.

**The one layer that stays outside the bundle is Structure.** Automated Reasoning checks
validate whether a response complies with logical policies expressed in natural language;
that is not JSON schema conformance, and no re-ask repair loop is documented. Structure
remains unbundled across every platform examined — worth noting as the layer the market has
not absorbed.

### Wang & Li (2025) read in full, 2026-08-27. Gate closed.

Read at v2 (29 Oct 2025), full text including Table 1 through Table 4. The abstract-level
sourcing debt is closed, and the claim it carries at §7 came back **stronger** than the
abstract supported, along with two corrections.

**The money quote, and it is the authors' own bullet list of what the platform provides
(p. 2).** Immediately after "A unified large model for both content-safety and
model-manipulation detection," the very next bullet reads:

> "A separate lightweight NER/data-redaction pipeline for identifying and masking sensitive
> information."

**The paper with "Unified" in its title ships a separate pipeline for the third job.** It
merged two of the seams into one model and states plainly that it could not, or chose not to,
merge the third. §3.3 confirms the scope of the merge: "Both content-safety and
model-manipulation detection are handled by the same LLM, unlike multi-model pipelines." Two
jobs merged, one kept out, Dialog and Structure absent entirely. This is the answer to path
dependence in the authors' own words rather than in my reading of their eval tables.

**Correction 1: the paper does not benchmark against NeMo Guardrails.** Earlier notes and the
outline said it benchmarks "against Llama Guard and NeMo." The comparison in Table 1 covers
Qwen3Guard, LlamaFirewall, PromptGuard 2 and OpenAI Moderation only. The eval tables include
**NemoGuard-8B**, which is NVIDIA's content-safety classifier, not NeMo Guardrails, the Colang
dialog framework (Rebedea et al., 2023). Conflating them would have put a Dialog-layer tool in
a Classify-layer comparison and quietly weakened the claim that Dialog is absent here. Do not
repeat it.

**Correction 2, and it is new evidence for §3.** Table 2 (English Prompt Results, F1):
**LlamaGuard3-8B averages 76.2 while LlamaGuard4-12B averages 72.4.** The newer, larger model
scores lower. This is an independent corroboration of Harsh et al.'s r=0.21, p=0.48, n=14
finding that size does not predict recall, arriving from a different benchmark suite and a
different research group. It also further undercuts the retired 1B to 8B escalation argument.
OpenGuardrails-Text-2510, at 3.3B quantized, averages 87.1 and tops the table.

**Still true from the abstract read:** 119 languages, 14B compressed to 3.3B via GPTQ at over
98% of benchmark accuracy, Apache 2.0. No topical control, no dialogue state, no schema or
structured-output validation anywhere in the paper.

**Corroborating consolidation elsewhere:**

- **OpenGuardrails** (Wang & Li, 2025) — the paper I skipped twice. Explicitly "unified":
  content-safety detection, manipulation defense (prompt injection, jailbreaks,
  code-interpreter abuse), and data protection (PII) in one configurable platform, 119
  languages, with a 14B model compressed to 3.3B at a reported 98% of benchmark accuracy.
  That is **Scan + Classify collapsed into one product, in open source.** The abstract claims
  no topical control and no schema validation.
- **Azure AI Content Safety** — Prompt Shields covers both direct (user prompt) and indirect
  (document) injection, plus groundedness detection and protected-material detection. Again
  Scan + Classify in one service; no topical or schema layer found.

**The pattern the evidence actually shows:** the market is consolidating Scan and Classify
into single products, one major cloud has absorbed Dialog as well, and Structure is the only
layer still reliably living outside the bundle. Against a _layer_ claim this is convergent
evidence, not counter-evidence. What it changes is the post's job: the reader on a managed
platform already runs three layers and may believe they run one thing called "guardrails."
Layer illiteracy, not layer absence, is their problem.

**Deployment note, not an argument.** Bedrock is proprietary, per-request priced, and locks
the guard layer to one cloud; the source stack's constraint was self-hosted at zero licensing
cost. That is a legitimate reason this stack is built the way it is, and it should appear in
the post as a stated constraint — never as evidence for the layer claim, which stands or falls
independently of who hosts what.

### Falsifier 2 — "fewer layers suffice": NOT falsified, but the counter-evidence stands

**Cut, per author decision D5.** The survey literature offering the standard rebuttal —
that external guardrails and training-time alignment are complementary because alignment is
costly to update post-deployment and still fails under jailbreak, injection, and
out-of-distribution input — rested on a paywalled 2026 Springer _Machine Learning_ survey
that was never read past its abstract. It is removed rather than shipped on trust.

**Consequence: this falsifier is now unrebutted on the record.** Huang et al.'s finding that
model alignment independently blocked harmful outputs where input filters failed stands with
nothing verified answering it. That is the honest position, and under the mid-stream framing
(**D6**) it is a feature: it is a specific, named place where a reader who has measured this
can come back and disagree with evidence.

### New counter-evidence found while looking — the layers are context-fragile

She et al. (2025) tested three Llama Guard models and two GPT-oss models and found that
inserting **benign** documents into the guardrail's context flips its judgment in **~11% of
input-guardrail cases and ~8% of output cases**. Tested mitigations gave "only minor
improvements." They name this a context-robustness gap.

This lands directly on the stack described here, because the Scan layer sits in front of
_agent and RAG_ requests — i.e. exactly the retrieved-document context that degrades the
verdict. It does not falsify the four-layer claim. It cuts both ways, and the article should
say so: it argues no individual layer's verdict is trustworthy on its own (supporting
defense-in-depth), while simultaneously undermining confidence in the Classify layer that
defense-in-depth is leaning on.

### Where this leaves the hypothesis

**The layer claim survived the pass and came out better supported than it went in.** Three
independent parties — this stack, AWS, and the OpenGuardrails authors — arrived at
overlapping layer decompositions without coordinating. That is the strongest available
evidence that the layers track real, separable failure modes rather than one team's taxonomy.

What genuinely changed:

1. **Layer ≠ tool is now a load-bearing distinction the post must make explicitly**, because
   the distilled source conflated them well enough to fool me. A reader arrives believing
   "which guardrail should I buy" is the question; the answer is that buying is orthogonal to
   the layers they need to be able to name.
2. **The audience widened.** It is no longer only the engineer choosing tools. It is also the
   engineer already running three layers inside a managed console who cannot name them, and
   therefore cannot reason about which one failed.
3. **Structure is the unbundled layer** across every platform examined — the one a reader
   almost certainly does _not_ have, whatever they bought.
4. **Falsifiers 2 and 3 remain open and are empirical.** Overlap between layers is answerable
   from shadow-mode logs and from nothing else. Whether that measurement belongs in this post
   or a later one is a thesis-gate decision.
5. **She et al.'s context fragility is the strongest live threat**, and it is a threat to the
   _reliability of each layer_, not to the layer decomposition.

## Hypothesis vs. what research actually tested

Written 2026-08-10, auditing the research against the claim it was supposed to test.

**The positive case is well covered.** OWASP's layered mitigation guidance, Beurer-Kellner
et al.'s six patterns, the per-layer primary sources establishing each tool's distinct job,
the S1/S9 category-grading example, and Hackett et al.'s up-to-100% evasion result all
support "one layer is not enough." If the goal were to argue the claim, the evidence is
there.

That is also the problem. Here is each falsifier against what was actually gathered.

**Falsifier 1 — a single tool covers all four: UNTESTED.** No search was run for unified
platforms. This is not a near miss: **OpenGuardrails** (arXiv:2510.19169) surfaced in two
separate search results, self-describing as "a configurable, unified, and scalable
guardrails platform for large language models," and was never opened. It is the closest
thing to a direct falsifier that crossed the screen and it was passed over because it did
not fit the four-layer frame. Commercial all-in-one offerings (Prisma AIRS, Azure AI Content
Safety, Bedrock Guardrails) were likewise never examined. **This must be closed before the
thesis gate.**

**Falsifier 2 — fewer layers suffice: PARTIALLY TESTED, AND IT DREW BLOOD.** Huang et al.
(2025) report that model alignment "independently blocked harmful outputs in most cases
where input filters failed." That is direct evidence for the rival position named in _Why I
might be wrong_ — that the model's own alignment plus one scanner covers most real risk. It
was recorded as a supporting detail about false negatives and never confronted as a threat
to the claim. It is the single strongest piece of counter-evidence in the corpus and it is
currently filed as a supporting quote.

**Falsifier 3 — the layers catch the same traffic: UNTESTED.** Nothing was gathered on
overlap. The decisive evidence would not come from the literature anyway — it is sitting in
the stack's own shadow-mode logs. What fraction of what Classify flags did Scan already
catch? That number is obtainable and would test the claim harder than any paper.

**Scope drift.** Much of the session's research went to _which tool_ should occupy the Scan
layer (archival status, replacements, maintenance signal). That is genuinely valuable and it
produced the strongest narrative material in the corpus — but it tests a _different_ claim
("name layers by job, not product"), not the four-layer claim above. Worth noticing that the
research drifted toward the more interesting question rather than the stated one.

**Verdict.** The research is strong exactly where the claim is safe and thin exactly where it
is falsifiable — the predicted failure mode of gathering evidence before writing down what
would refute it. **Do not carry this into `blog-thesis` as a claim that survived research.
It has not yet been tested.** Two falsifiers are open; the third produced counter-evidence
that has not been answered.

## Open-question research (2026-08-10) — sources validated before use

Commissioned to close the three open questions. Every source below was fetched and read to
the point cited; where it could not be, that is stated and the claim is not made. **One
result damages the thesis and is reported as such.**

### Q2 — Convergence or shared ancestry? ⚠ ANSWERED, AND IT GOES AGAINST US

The independence assumption behind **D4** does not survive contact with the sources.

**OpenGuardrails is explicitly positioned against the same lineage, not independent of it.**
Its related work names Qwen3Guard, LlamaFirewall, PromptGuard 2, and the OpenAI Moderation
API, and its evaluation tables benchmark against **LlamaGuard3, LlamaGuard4, WildGuard,
ShieldGemma, NemoGuard, and PolyGuard**. It describes itself as advancing "unlike prior
efforts that open-source either models or rule-based tools in isolation." That is a paper in
direct conversation with Llama Guard and NeMo — the same two systems in this stack's Classify
and Dialog layers. It is not a second independent arrival at the same decomposition; it is
the next move in one conversation.

**Worse for D4: the three-way framing has a documented common ancestor that predates this
stack.** Dong et al. (2024), a position paper at ICML, already examined exactly
**Llama Guard, NVIDIA NeMo, and Guardrails AI** together as the open-source guardrail
landscape, and concluded that current offerings are incomplete and that a systematic approach
to more complete solutions is needed. Published February 2024. So the grouping of these
particular systems, and the "no single solution suffices" conclusion drawn from them, was in
the literature before this stack assembled its four layers.

**What this does and does not kill.** It does not falsify the layer decomposition — Dong et
al. independently reaching "no single solution suffices" is convergent support for that. What
it kills is the **independence** premise: the post cannot claim three unrelated parties
arrived separately, because at least two of the three are demonstrably reading each other,
and a fourth paper framed the trio first. **D4 as written is not supportable and needs
author revision.** The honest replacement is not "three independent arrivals" but something
like "a field converging in public, and here is the citation trail showing it converge" —
which is still interesting, and is defensible, and is a different sentence.

### Q1 — Layer overlap: NO PUBLISHED SOURCE FOUND (a validated negative)

Searched for ablation or redundancy measurements across composed guardrail layers. What
exists is component ablation _within_ single systems, and adjacent work on over-refusal, but
**nothing measuring what fraction of traffic a content classifier flags that an I/O scanner
already caught** in a multi-layer production stack. This confirms rather than removes the
earlier assessment: the question is answerable only from this stack's shadow-mode logs. Worth
stating in the post as a gap in the public record, not just a gap in our notes.

### Q3 — Does alignment alone suffice? STILL UNREBUTTED, NO VALIDATED SOURCE

No open-access source was found that directly and verifiably tests whether external
guardrails add measurable value over a safety-aligned model. Search results gestured at the
claim, but the summaries aggregated across papers rather than pointing at one verifiable
finding, and **an aggregated summary is exactly the kind of source that put the Springer
survey into these notes in the first place.** Nothing is cited here.

⚠ **Explicitly NOT used:** Dong et al. was checked as a possible replacement and does **not**
support this claim — the paper is about guardrail construction, and its abstract does not
contrast guardrails against model alignment. Citing it here would have been a second
instance of the Springer error. Huang et al.'s finding therefore stands unrebutted, which is
now a deliberate, recorded position rather than an oversight.

## Decisions

Accumulates across stages. Author decisions are binding on later stages.

**D1 — Terminology: "layer," and drop "tier" entirely.** _(author, amended 2026-08-11)_ Use
**layer** throughout. **"Tier" is jettisoned and must not appear in the post.** Escalation
within a layer, which is what the 1B→8B Llama Guard path is, gets described plainly instead
("two models, one job") rather than given a term of its own. Only two words need defining
for the reader: layer and tool.

> Superseded wording, retained for the record: _"Reserve 'tier' for escalation within a
> layer... layers are horizontal, tiers are vertical inside one layer."_ Introducing a third
> term to distinguish two axes cost more than it bought, since the post only ever needs the
> layer/tool distinction to do work.

**D2 — Bedrock and OpenGuardrails are supporting evidence, not counter-evidence.**
_(author, 2026-08-10; amended after Q2)_ Both are cited as **points on a public citation
trail** converging on the same decomposition — not as independent arrivals, which Q2
falsified. See revised **D4**. AWS shipping denied topics, content filters, PII, and grounding as separately
configurable policies, and OpenGuardrails unifying content safety, manipulation defense, and
data protection, are two other serious teams reaching the layer model without reference to
this stack. Align the post with that, rather than positioning against it.

**D3 — The subject is the convergence of structure and architecture.** _(author, 2026-08-10)_
Not "unification versus layering" — that framing is a packaging debate and the post should
decline it. The argument is that independent teams solving this seriously converge on the
same structural seams, and that convergence is itself the evidence the seams are real.
Whether a given team ships them as four services or one console is a deployment fact, not an
architectural one.

**D4 (revised 2026-08-10) — Frame it as a citation trail, not independent arrival.**
_(author)_ The original D4 called this stack, Bedrock, and OpenGuardrails "three independent
points of view." **Research falsified the independence premise** (see Q2 above), so the
framing changes rather than the evidence.

The post shows the conversation converging _in public_, and traces it: Dong et al. (2024)
group Llama Guard, NeMo, and Guardrails AI and conclude no single solution suffices;
OpenGuardrails (2025) benchmarks explicitly against Llama Guard, NeMo, ShieldGemma and the
rest while setting out to unify them; AWS ships the same seams as separately configurable
policies under entirely different commercial pressure; this stack arrives at four layers
building for zero licensing cost.

**Why this is not a downgrade.** Independent invention would have been _weaker_ evidence than
what the trail actually shows. Parties who read each other are free to collapse the
boundaries — and the one that explicitly set out to unify them **kept them as distinguishable
functions anyway**, merging Scan and Classify into one model while still treating content
safety and manipulation defense as separate detection jobs, and dropping Dialog and Structure
rather than dissolving them. Seams that survive a deliberate unification attempt are seams
that are hard to remove. Say that, and cite the trail, instead of claiming independence.

> **⚠ Honesty constraint on D4, for the thesis stage.** The convergence is real but not
> total, and the post is stronger if it says where the seams differ than if it claims a clean
> trifecta:
>
> | Layer     | This stack | Bedrock                                 | OpenGuardrails       |
> | --------- | ---------- | --------------------------------------- | -------------------- |
> | Scan      | ✓ separate | ✓ separate policies                     | merged with Classify |
> | Classify  | ✓ separate | ✓ separate policy                       | merged with Scan     |
> | Dialog    | ✓ separate | ✓ denied topics                         | ✗ absent             |
> | Structure | ✓ separate | ~ automated reasoning, no schema/re-ask | ✗ absent             |
>
> All three agree the problem decomposes and largely agree _where_ it decomposes; they
> disagree on how finely. Claiming unanimity would be the same confirmation-shopping the
> falsifier pass was run to correct. **Structure is absent or partial in both external
> bodies** — the honest reading is that the convergence is strongest on Scan/Classify,
> real but weaker on Dialog, and that this stack is ahead of the field on Structure rather
> than corroborated by it.

**D5 — Cut the Springer survey.** _(author, 2026-08-10)_ Paywalled, read only to abstract.
Remove it and every claim resting on it rather than shipping it as read. Accept that this
leaves falsifier 2 unrebutted on the record.

**D6 — The post reports mid-stream and invites divergence.** _(author, 2026-08-10)_ The
convergence is **not** offered as proof, and the independence objection is not something to
dig out of. The piece is a field report from the middle of an unsettled problem: here is
where three groups landed, here is what none of us have measured, come disagree. Argument
and dissent are the intended output. This changes the register from "here is the
architecture" to "here is the current state, and here is what would move it" — and it makes
every open gap an invitation rather than an embarrassment.

**D7. The piece proposes the four layers. It does not avow them, and it does not restate
`harness_engineering`.** _(author, 2026-08-27)_ Two things came out together, and they were
the same problem at two altitudes.

The first is the framing "the layers transfer and the choices inside them do not." That is
the previous article's thesis wearing guardrails clothing. It made this piece read as a
sequel rather than as an argument about guardrails, and it kept surfacing: in the body, in
three rejected titles, and in the summary. The second is the spine position that framing
bought. `harness_engineering` drops from the load-bearing idea of the piece to at most one
APA prose citation, placed where it is actually relevant and nowhere else.

What replaces it is the process. The four layers are proposed on the strength of having
built them, broken them in unpredicted ways, and then gone out to the literature and the tool
landscape to find who else had landed in the same place. That is a weaker claim than the one
it replaces, and it is the honest one: a proposal carries its own evidence and invites the
counter-case, which is what D6 asked for and what the previous framing quietly prevented.

## Thesis

**Sentence.** Guardrails decompose into layers rather than products, and four is where that
decomposition currently looks stable: nothing on offer spans all four, and the projects that
set out to unify them kept the seams anyway.

**Delta from hypothesis.** **Replaced, for the third time.** The four layers have never
moved. The warrant beneath them has now been rebuilt three times: first "here is why each
layer is necessary," argued from one stack; then "three parties converged independently,"
falsified when the citation trail showed they read each other; then "the layers transfer and
the choices do not," which explained both halves with one mechanism but imported that
mechanism wholesale from `harness_engineering`.

The trigger for this revision was not a research finding. It was reading the draft's opening
and finding the previous article's thesis in it (D7). The claim now sits on the subject
itself, and two things changed with it.

**The origin moved from the build to the investigation.** Earlier versions read as though the
four layers came out of assembling a stack and were then confirmed by reading. That is
backwards, and it is the same ordering error the hypothesis note already admits to at the top
of this document. Surveying what the available tools actually do, and what falls between them,
is what produced the decomposition. The build is one constrained instance of it.

**The count became provisional.** This is the first version of the thesis in which four is a
reading rather than a finding. Previous versions treated the number as settled and pushed the
alternatives into an objection to be conceded. The count is now part of the argument the
piece makes, with the case for three and the case for five stated on their own evidence.

**What the piece is.** A proposal carried by three kinds of evidence, each weak alone and
each doing a different job. Keeping their roles straight is what stops the piece from
overclaiming.

| Evidence                   | Role              | What it can and cannot support                                                                                                                                                                                          |
| -------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The tool investigation** | **Origin**        | The seams are visible in what the available tools actually do, and in what falls between them. Nothing on offer spans all four. This is where the decomposition came from. It cannot show the decomposition is minimal. |
| **The convergence**        | **Corroboration** | Other teams surveying the same ground landed on substantially the same seams, and one that set out to unify them preserved them anyway. Checkable, but a shared citation ancestry limits how independent it is.         |
| **The build**              | **Demonstration** | One worked instance, on modest hardware at close to zero budget. Shows four-layer coverage is reachable with freely available tools. It is a field report, not evidence for the decomposition.                          |

**The build is deliberately not the warrant.** It is constrained by one person's hardware and
a budget of as little as possible, so the tools in it were chosen under pressures that have
nothing to do with whether the four layers are right. Treating a constrained lab as evidence
for an architecture is exactly the move the piece is arguing against. Its honest role is to
answer a different and still useful question: what does four-layer coverage cost when you
cannot buy anything?

**Why four, and the live case for three or five.** Four is a current reading of a moving
landscape, not a finding. The piece should argue the alternatives rather than concede them
in a footnote, because a proposal that cannot survive its own counter-count is not a proposal.

- **The case for three.** OpenGuardrails merged Scan and Classify into a single model and
  still shipped a working system. If one model does both jobs, the seam between them may be
  an implementation detail rather than a structural one.
- **The case for five.** The input/output split inside Scan is real and documented: separate
  scanner sets on each side, with anonymisation on the way in pairing to de-anonymisation on
  the way out. Grounding, in the sense of checking a claim against retrieved documents by
  entailment, is arguably a third job again rather than pattern work.

Both cases rest on the same missing measurement as the main claim, which is the point. Four
is where the seams currently look stable, and stability is the strongest word the evidence
supports.

**Strongest unanswered objection.** **Path dependence, and the proposal framing makes it
sharper rather than softer.** If the layers keep reappearing only because a small field read
the same 2024 paper (Dong et al.), then proposing them is proposing an echo. The piece does
not get to dodge this by being modest.

Note precisely where it lands: **path dependence attacks corroboration, not origin.** It says
nothing about whether the seams are visible in the tool landscape, only about whether other
teams finding them counts as independent support. The answer the piece can defend is that the
trail is checkable, and that one party on it set out explicitly to unify the layers and
preserved them as distinguishable functions anyway, dropping two rather than dissolving them.
Seams that survive a deliberate attempt to remove them are hard seams. That is weaker than
proof and stronger than nothing, and saying so is what the proposal register is for.

**The objection that used to sit here has been promoted into the argument.** Previous versions
conceded that nobody has published a layer overlap measurement, so four is not shown to be
minimal or complete. That is still true, and it is now stated as part of the claim rather than
defended against. See "Why four, and the live case for three or five" above.

**Demoted.**

- **"The layers transfer and the choices inside them do not"** comes out entirely, along with
  every construction that restates it. It was the previous article's thesis, not this one's.
- **`harness_engineering` as the spine.** Demoted from the idea that explains the piece to a
  single prose citation. The old §8, "Your details, your devil," does not survive as a
  section.
- **The state/withhold structure** loses its object, since the withheld mechanism was the tie
  itself. The exec summary now states the proposal outright, which is what a proposal needs.
- **The build as warrant.** Every earlier version let the stack argue for the decomposition.
  It cannot: it was assembled under hardware and budget constraints unrelated to whether four
  layers are right, and a constrained lab presented as architectural evidence is the move this
  piece is arguing against. The build itself is not demoted. Demonstration is a different
  scope from warrant, not a lesser one, and it answers a question the other evidence cannot:
  what four-layer coverage costs when you cannot buy anything.
- **Still demoted from the previous pass, unchanged:** "Structure is the layer nobody sells
  you" (factually wrong, replaced by Structure having its own industry); the 1B to 8B
  escalation as a live argument (contradicted by r=0.21, p=0.48, n=14, and surviving only as
  a vendor claim independent work does not support); every "independent arrival" formulation
  (falsified at Q2).

**Promoted.**

- **The tool investigation becomes the warrant and the narrative.** Survey what exists, find
  what falls between the tools, and only then build one instance of the result. This is what
  makes the piece a proposal rather than a taxonomy, and it is the through-line the previous
  two theses were substituting for.
- **The constraint becomes a scope statement rather than an apology.** Modest hardware and a
  near-zero budget define who the piece serves: a reader assembling four-layer coverage from
  freely available tools. That is more useful than a survey written from an unlimited budget,
  and it explains the absences in the stack without special pleading.
- **The counter-count becomes live argument.** The case for three and the case for five are
  made on their own evidence rather than conceded, which is what a proposal owes its reader.
- **Wang & Li (2025) becomes the single most load-bearing source.** The unification attempt
  that kept the seams is now the strongest evidence in the piece, so its ⚠ sourcing limit
  matters more than it did.
- **Harsh et al. (2026) against Young (2025) stays central but changes job.** It is no longer
  proof that "the choices are local." It is evidence that the decomposition cannot be
  shortcut by buying a good classifier.
- **Dong et al. (2024)** remains the common ancestor and the trail's first checkpoint.

**Publish gates.**

_Must close before publication:_

- **Model weight licences for ShieldGemma and Granite Guardian.** Only the paper licences
  (CC BY 4.0) are confirmed, and those say nothing about the weights. Gemma ships under Gemma
  Terms of Use rather than an OSI licence.
- **Every VRAM figure** is secondary sourced. Confirm or drop.
- **Per engine numbers from JSONSchemaBench** were never extracted; the claims circulating
  about Outlines compliance and compile times come from a blog. Fetch the paper or omit.
- **Any surviving `click` line** must be labelled a first-hand observation.
- ~~**⚠ Wang & Li (2025) was read at abstract and related-work level only.**~~ **Closed
  2026-08-27**, read in full at v2. The claim came back stronger, with a direct quote from
  the authors' own contribution list, and two corrections recorded in Findings.

_May ship flagged:_

- Meta model cards are undated; cite `n.d.` with retrieval dates.
- Prompt Guard 2 and ShieldGemma performance figures are vendor reported; say so inline.
- Harsh et al. scores models against NIST AI RMF categories, which disadvantages models
  trained to a different taxonomy, Llama Guard included. State the confound wherever the
  33.32% recall figure appears.

_Open questions the post should name as invitations, per D6:_

- Layer overlap is unmeasured and no published measurement exists.
- Whether model alignment alone covers most of what Scan catches, unrebutted since D5.
- Which guard model is right for a given stack, which is the question this piece argues
  cannot be answered from the literature at all.

**The XGrammar and vLLM `auto` default debt closed 2026-08-12** against primary sources and
is not carried forward.

## Thesis: superseded 2026-08-11 version (retained as history)

> Replaced 2026-08-27 per D7. Retained because the discarded 2026-08-10 draft and the
> superseded outline below both descend from it, and the trail is the only way to date a
> stray paragraph.

**Sentence.** The four layers transfer between systems and the choices inside them do not:
two credible benchmarks rank the same guard models in opposite orders, so the only evidence
that can pick yours is your own traffic, for the same reason nobody can sell you the layer
that validates your own schemas.

**The unifying idea, added 2026-08-11 (author).** Both halves of this piece have the same
root cause, and it is one the author has argued before. In `harness_engineering` the claim
was that what you can buy is the inexpensive, transferable artifact, while what actually
creates value is local and cannot be bought at any scale. **The devil is in your details.**

Guardrails turn out to be a clean instance:

- **The layers are the transferable artifact.** They generalise. Three groups working under
  very different constraints landed on substantially the same decomposition, and a reader can
  adopt the layer model without adopting anything else.
- **The choices inside the layers are the local, unbuyable part.** Structure cannot be sold
  because the schema contract is defined entirely by your producers and your consumers. And
  the Classify model cannot be chosen from the literature because the literature contradicts
  itself: Harsh et al. rank Qwen3Guard first on recall while Young measures it collapsing
  from 91.0% to 33.8% on unseen attacks. Both are credible. Neither can pick for you.

The tie is exact rather than decorative. **The only way to select a guard model is to try it
on your own traffic, against your own taxonomy, in your own deployment.** Your details. Your
devil. That is why the piece ends by asking for a measurement rather than issuing a
recommendation, and it is why the layer discipline is the only part of this that transfers.

**Delta from hypothesis.** **Replaced, for the second time, and this one is structural.**
The four layers have never moved. The warrant beneath them has now been rebuilt three times:
first "here is why each layer is necessary" argued from one stack; then "three parties
converged independently," falsified when the citation trail showed they read each other;
now "the layers transfer and the choices do not," which is the first version that explains
both the convergence and the churn with a single mechanism.

The trigger for this revision was two research findings that broke earlier claims:

1. **Structure is not unsold.** A healthy market exists, split between validate-then-retry
   (Guardrails AI, Instructor, BAML) and constrain-during-generation (Guidance, Outlines,
   XGrammar, llama.cpp, plus native OpenAI and Gemini modes). The surviving claim is narrower
   and better: no guardrail platform bundles Structure, a separate industry solves it, and
   the two worlds barely cite each other. **A seam that grows its own industry is a harder
   seam than one nobody serves.**
2. **Guard model selection is unresolvable from published evidence.** Two credible benchmarks
   disagree by roughly fifty points on the same models; size does not predict recall
   (r=0.21, p=0.48, n=14); and every model tested is badly miscalibrated under jailbreak
   (Liu et al., 2024).

**Strongest unanswered objection.** **If the choices are local, why should the layers
generalise?** The same reasoning that makes tool selection unbuyable could be turned on the
decomposition itself: perhaps the four layers are also local, and they merely look universal
because a small field read the same 2024 paper. Path dependence, in other words, now aimed
at the surviving half of the thesis.

The answer the piece can defend, and it is a real answer rather than a dodge: the two claims
have different evidence. Nothing generalises about guard model rankings, and two benchmarks
demonstrate that directly by contradicting each other. The layer decomposition, by contrast,
keeps reappearing across parties with sharply different commercial constraints, including
one that explicitly set out to unify it and preserved the boundaries anyway. That is weaker
than proof and stronger than nothing, and it should be stated as exactly that.

**The second objection, which the piece must not dodge:** "measure it on your own traffic"
is unhelpful advice for a reader who has no shadow mode logs and no labelled traffic. The
honest response is that this is a real limitation of the recommendation, not a hidden virtue,
and the piece should say who it does not help.

**Demoted.**

- **"Structure is the layer nobody sells you"** is factually wrong and comes out. It is
  replaced by the stronger version: Structure has its own industry, and that industry is the
  evidence.
- **The 1B to 8B escalation argument**, built on Meta's own F1 figures of 0.899 against
  0.939, is now contradicted by an independent finding that model size does not predict
  recall. It survives only as an example of a vendor claim that independent work does not
  support, which is a different and more useful role.
- **Every "independent arrival" formulation** stays cut, per Q2.

**Promoted.**

- **Dong et al. (2024)** remains load-bearing as the common ancestor and the trail's first
  checkpoint.
- **Harsh et al. (2026) against Young (2025)** becomes the centrepiece of the tool selection
  argument. The contradiction between them is the evidence, so both must be presented fairly
  and neither used to win.
- **`harness_engineering` moves from a callback in one section to the spine of the piece.**
  It now explains Structure and Classify with the same idea.

**Publish gates.**

_Must close before publication:_

- **Model weight licences for ShieldGemma and Granite Guardian.** Only the paper licences
  (CC BY 4.0) are confirmed, and those say nothing about the weights. Gemma ships under Gemma
  Terms of Use rather than an OSI licence. Do not state either as fact until checked against
  the model cards.
- **Every VRAM figure** is secondary sourced. Confirm or drop.
- **Per engine numbers from JSONSchemaBench** were never extracted; the claims circulating
  about Outlines compliance and compile times come from a blog. Fetch the paper or omit.
- **The claim that XGrammar is the default backend in vLLM, SGLang and TensorRT-LLM** is
  secondary sourced and load-bearing for the Structure argument. Confirm it.
- **Any surviving `click` line** must be labelled a first-hand observation.

_May ship flagged:_

- Meta model cards are undated; cite `n.d.` with retrieval dates.
- Prompt Guard 2 and ShieldGemma performance figures are vendor reported; say so inline.
- Harsh et al. scores models against NIST AI RMF categories, which disadvantages models
  trained to a different taxonomy, Llama Guard included. State the confound wherever the
  33.32% recall figure appears.

_Open questions the post should name as invitations, per D6:_

- Layer overlap is unmeasured and no published measurement exists.
- Whether model alignment alone covers most of what Scan catches, unrebutted since D5.
- Which guard model is right for a given stack, which is the question this piece argues
  cannot be answered from the literature at all.

## Outline

**Register. Grey paper**, target 35k to 40k characters, full APA reference list. Unchanged
across all three outline generations. The structure keeps changing; the length does not.

**Shape (author, 2026-08-27, revised after the D7 thesis): Minto pyramid over the three
evidence roles.** A short executive summary carries the proposal, then the argument descends
through the three kinds of evidence the thesis names, in the order that makes each one
answerable: **origin**, then **corroboration**, then **demonstration**. The exec summary is
the deliverable, not a teaser. A reader who stops there leaves with the four layers and the
proposal.

**The state/withhold rule is gone.** It existed to hold back a mechanism that no longer
exists in the piece. A proposal states itself outright, so §1 says what it is proposing and
why the count is provisional, and nothing is held in reserve for a reveal.

**Part order follows the thesis, not the drama.** Origin first, because a proposal has to say
where it came from before it says who agrees. Corroboration second, because that is what path
dependence attacks and it needs the origin already on the table to be answerable.
Demonstration third, because a constrained build is only interesting once the reader knows it
is not being offered as proof.

**Harvested from Decisions.** D1 keeps "tier" out entirely. D3 rules out any unification
versus layering section. D4 supplies the citation-trail framing at §6 and §7. D5 keeps the
Springer survey out and leaves Q3 unrebutted, named at §11. D6 puts the mid-stream framing in
the exec summary and the invitation at §11. **D7 caps `harness_engineering` at a single APA
prose citation**, placed at §4 where the contract argument makes it genuinely relevant, and
nowhere else.

### Part 1. The proposal

| #   | Section                           | Claim it makes                                                                                                                                                                                                                                                                          | Evidence                                                                                      | Debt                                                                                                                                                    |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The four layers, and the proposal | Here are four problems, each catching a failure the others structurally cannot. Four is where the decomposition currently looks stable, not a finding. Take it as a proposal, and take the rest of the piece as the evidence I have for it, including the parts that cut the other way. | Inan et al. (2023); Rebedea et al. (2023); one sentence per layer on the failure mode it owns | **Drafted, 2,072 chars.** No product names. D1: no "tier". Says "proposal" outright and names the origin as investigation, not the build. D6 lives here |

### Part 2. Origin: what the tool landscape actually looks like

_Where the four came from. The seams are visible in what the available tools do and in what
falls between them, which is why this part runs before anyone else's agreement is invoked._

| #   | Section                                                                | Claim it makes                                                                                                                                                                                                                                                                                                              | Evidence                                                                                                                                                                                                                                   | Debt                                                                                                                                                                                                                                                                                                                                         |
| --- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2   | The question I could not answer                                        | Clients ask which guardrail to run. I went to the literature to answer properly, and it contradicts itself: two credible benchmarks rank the same guard models in opposite orders.                                                                                                                                          | Harsh et al. (2026) Qwen3Guard 83.97% recall, Llama Guard 33.32%; Young (2025) Qwen3Guard 91.0% collapsing to 33.8% on unseen attacks, Granite Guardian holding within 6.5%                                                                | Present both fairly; neither wins. State the NIST taxonomy confound wherever 33.32% appears                                                                                                                                                                                                                                                  |
| 3   | The landscape, and what falls between the tools                        | Here is the full field on publisher, size, licence and language. No tool spans all four jobs, and the gaps between what they do are where the seams became visible. **This is the origin of the decomposition.**                                                                                                            | Comparison across Llama Guard, Qwen3Guard, ShieldGemma, WildGuard, Granite Guardian, Nemotron; size versus recall r=0.21, p=0.48, n=14; Liu et al. (2024) miscalibration under jailbreak                                                   | ⚠ Weight licences unconfirmed for ShieldGemma and Granite Guardian. ⚠ All VRAM figures secondary. The 1B to 8B escalation appears **only** here, as a vendor claim independent work contradicts. Vendor-reported figures labelled inline; Meta cards cited `n.d.` with retrieval dates. **No "what I run" here**: the build is §9, in Part 5 |
| 4   | Structure has its own industry, and it sells the half that generalises | The fourth seam is so real it grew a separate market, and that market ships as infrastructure: vLLM defaults to `auto`, selecting a constrained-decoding backend per request. It sells the **enforcement mechanism**, which generalises, and cannot sell the **contract**, which is yours. No guardrail bundle includes it. | vLLM (n.d.) `auto` default across xgrammar and guidance; XGrammar (n.d.) integrated in vLLM, SGLang, TensorRT-LLM, MLC-LLM, OpenVINO GenAI, Modular MAX, Apache 2.0; Guardrails AI, Instructor, BAML on the retry side; Geng et al. (2025) | **XGrammar debt closed 2026-08-12.** Do **not** write "XGrammar is the default backend"; vLLM's docs say `auto`. ⚠ JSONSchemaBench per engine numbers still not extracted. **D7: the single `harness_engineering` citation goes here, one clause, APA prose.** Never "Structure is the layer nobody sells you"                               |
| 5   | Every layer is individually unreliable                                 | Even the tool you settle on is evadable, context fragile and badly calibrated, which argues for composing the layers and against trusting any one of them.                                                                                                                                                                  | Hackett et al. (2025) up to 100% evasion; She et al. (2025) 11% and 8% flips on benign context; Huang et al. (2025) 0.1% to 13.1% false positives                                                                                          | ⚠ Hackett predates Prompt Guard 2, state it. Concede the correlated failure problem rather than only taking the flattering reading                                                                                                                                                                                                           |

### Part 3. Corroboration: who else landed here

_Only now, with the origin on the table, is it worth asking who agrees. This part is what
path dependence attacks, which is why it needs Part 2 already read._

| #   | Section                        | Claim it makes                                                                                                                                                                                                                                                                                   | Evidence                                                                                                                                                                                                                                                                                                                                                                                                 | Debt                                                                                                                                                                                                                                                           |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | The citation trail             | Several teams surveying the same ground published the same seams, and the trail is checkable rather than a coincidence I am asking you to take on faith.                                                                                                                                         | Dong et al. (2024) as common ancestor; Wang & Li (2025) benchmarking against Llama Guard, ShieldGemma, WildGuard and Qwen3Guard; AWS (n.d.) seven separately configurable policies                                                                                                                                                                                                                       | **Never say "independent."** Cite Dong when introducing the trio. State plainly that shared ancestry weakens this, then hand off to §7. **Not "benchmarks against NeMo"**: that was NemoGuard-8B, a classifier                                                 |
| 7   | The seams that would not merge | The project with "Unified" in its title merged two seams into one model and shipped **a separate pipeline** for the third, in its own words, while dropping the other two entirely. **This is the answer to path dependence:** a party free to collapse the boundary, and motivated to, did not. | Wang & Li (2025) p. 2 bullet list, quoted directly: "A separate lightweight NER/data-redaction pipeline for identifying and masking sensitive information", set against the preceding bullet's "unified large model for both content-safety and model-manipulation detection"; §3.3 "handled by the same LLM, unlike multi-model pipelines"; AWS separate policies under commercial pressure to simplify | **Debt closed 2026-08-27, read in full at v2.** Quote the bullet pair directly; it is stronger than any paraphrase. **Do not say the paper benchmarks against NeMo Guardrails**: its eval includes NemoGuard-8B, a classifier, not the Colang dialog framework |

### Part 4. The count

| #   | Section                                  | Claim it makes                                                                                                                                                                                  | Evidence                                                                                                                                                                                                                                                                                                                                                       | Debt                                                                                                                                                                                                      |
| --- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8   | Why four, and the case for three or five | Four is where the seams currently look stable, not a finding. Here is the real case for three, here is the real case for five, and here is why I would rather argue them than assume them away. | **Three:** Wang & Li (2025) merged Scan and Classify into one model and still shipped. **Five:** the input/output split inside Scan is documented, with anonymisation on the way in pairing to de-anonymisation on the way out; grounding by NLI entailment is arguably a third job again. Both rest on the same missing overlap measurement as the main claim | This section is why the thesis can say "currently looks stable" honestly. Argue both counts on their evidence; do not stage them as strawmen to knock down. If either reads as stronger than four, say so |

### Part 5. Demonstration: what it costs when you cannot buy anything

_A worked instance, not evidence for the decomposition. Its job is to answer a question the
other two parts cannot._

| #   | Section                            | Claim it makes                                                                                                                                                                                                                                                                        | Evidence                                                                                                                                                                                                                                         | Debt                                                                                                                                                                                                                             |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9   | Four layers on a budget of nothing | Here is one assembly of all four using freely available tools on modest hardware, and here is what the constraints cost. The tool choices were made under pressures unrelated to whether the decomposition is right, which is exactly why this is a field report and not an argument. | Prompt Guard 2, Presidio, NLI grounding, Llama Guard, NeMo, Guardrails AI; the archive story: Protect AI (2026) and the de-bundling that worked because Presidio and the NLI job were already inside; Palit & Woods (2025) reduced to one clause | **Explicit scope statement**: freely available tools, modest hardware, near-zero budget. Label every first-hand claim a field report. Do **not** let this section argue for the four layers. `click` capped at one sentence (D3) |
| 10  | Engineering realities              | Fail open, ship in shadow, and expect packaging to dictate deployment. This is how you get the traffic §11 says nobody has.                                                                                                                                                           | Huang et al. (2025) false positive spread; NVIDIA (n.d.) `self check input`; first-hand Colang                                                                                                                                                   | Label first-hand claims as field reports                                                                                                                                                                                         |

### Close

| #   | Section                                          | Claim it makes                                                                                                                                                           | Evidence                                                                | Debt                                                                                                                                                                                                           |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | What none of us have measured, and where to push | The overlap measurement would settle the count and would also pick your guard model. Nobody has published one, I do not have one either, and that is where to push back. | Q1 validated negative; Q3 unrebutted per D5; the count argument from §8 | Must concede that "measure it on your own traffic" is useless to a reader with no shadow logs. D6 lands here: this is a position to argue with, and the invitation must be specific about what would change it |

### Checks

- **Does the order build the thesis sentence?** Reading the claims column top to bottom: here
  are four layers, offered as a proposal. No tool on the market spans them, the benchmarks
  cannot even rank the tools consistently, one seam grew its own industry, and no single layer
  is reliable alone. Others surveying the same ground published the same seams, and the one
  that set out to unify them kept them anyway. Four is where that looks stable, and here is
  the honest case for three and for five. Here is one build of it at near-zero cost, here is
  what running it takes, and here is the measurement none of us has. That composes
  "guardrails decompose into layers rather than products, and four is where that
  decomposition currently looks stable."
- **Is the strongest objection answered?** Yes, at §7, and the placement is now structural
  rather than incidental. Path dependence attacks corroboration, so it is answered inside
  Part 3 where corroboration is made, immediately after §6 concedes the shared ancestry that
  gives the objection its force. §11 no longer carries a residual of it; it carries the
  measurement gap, which the thesis promoted into the argument at §8.
- **Sections carrying pre-publication debt:** §2, §3, §4, §5, §7, §9. **§7 is the one that
  changed severity**: Wang & Li was tolerable as abstract-level sourcing when it was one of
  three supporting citations and is not tolerable now that it carries the answer to the
  strongest objection. §4's XGrammar debt closed 2026-08-12.
- **Anything demoted that resurfaced?** No. The transfer framing is absent. "Your details,
  your devil" is gone as a section and `harness_engineering` appears once, as one clause at
  §4. The 1B to 8B escalation appears only at §3 in its assigned role. "Independent arrival"
  is absent. "Nobody sells you Structure" is replaced by §4. The build no longer argues for
  the decomposition anywhere.

### Structural changes from the previous outline

1. **The parts are now the three evidence roles from the D7 thesis**: origin, corroboration,
   demonstration, plus the count. The previous parts were "why the choices do not transfer,"
   "why the layers do," and "one mechanism explains both," all of which belonged to the
   superseded thesis.
2. **"Your details, your devil" is gone.** `harness_engineering` drops from the spine of the
   piece to a single APA prose clause at §4.
3. **Structure moves from §7 to §4, into Origin.** A seam with its own separate industry is
   landscape evidence, not a mechanism reveal, and it belongs beside the other three.
4. **The build gets its own section at §9 and is removed from §3.** Previously "what I run"
   sat inside the landscape survey, which is exactly what let a constrained lab read as
   evidence for the architecture.
5. **§8 is new.** The count was previously an objection to concede; the thesis promoted it to
   an argument the piece makes.
6. **The state/withhold rule is gone**, along with the reveal it was holding back.
7. **§7's sourcing debt was upgraded to must-close** as a direct consequence of promoting
   Wang & Li.
8. **Eleven sections stay eleven**, but only §1, §2 and §5 keep the job they had.

## Outline — superseded 2026-08-11 version (retained as history)

> Replaced 2026-08-27 by the Minto pyramid above. Retained because the 2026-08-10 draft was
> written against the version before _this_ one, and the trail of what moved when is the only
> way to tell which generation any given paragraph belongs to.

**Register. Grey paper**, target 35k to 40k characters, full APA reference list.

**Shape (author, 2026-08-11): answer first, then story.** The piece opens by handing over the
four layers with no preamble and explicitly releases the reader who only came for that. The
argument then restarts as a narrative: a question I could not answer, a literature that
contradicts itself, and the reframe that follows. This replaces the previous
argument-shaped order, which had no arc and buried its strongest hook at section seven.

**Harvested from Decisions.** D1 keeps "tier" out entirely. D3 rules out any unification
versus layering section. D4 supplies §5 and §6. **D6 moves to the front**, since naming the
genre early is what buys permission to leave things unresolved later. D7 places the harness
tie, which the thesis promoted to the spine at §8.

| #   | Section                                                                | Claim it makes                                                                                                                                                                                                                                                                                                                                           | Evidence                                                                                                                                                                                                                                                         | Debt                                                                                                                                                                                                                                   |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The four layers                                                        | Here are the four problems, each irreducible to the others. This is the part that transfers, and it is the whole deliverable.                                                                                                                                                                                                                            | Inan et al. (2023); Rebedea et al. (2023); per layer failure modes. Minimal layer versus tool distinction inline, only as much as the list needs                                                                                                                 | No product names anywhere in this section. D1: no "tier"                                                                                                                                                                               |
| 2   | If you stopped reading here                                            | The layers are the transferable part and you now have them. What follows is a report from the middle of an unsettled question, not a recommendation.                                                                                                                                                                                                     | Author framing; **D6 relocated from the close to the open**                                                                                                                                                                                                      | Must genuinely release the reader rather than tease. The permission has to be real or the move is a trick                                                                                                                              |
| 3   | The question I could not answer                                        | Clients ask which guardrail to run. I went to the literature to answer properly, and it contradicts itself: two credible benchmarks rank the same guard models in opposite orders.                                                                                                                                                                       | Harsh et al. (2026) Qwen3Guard 83.97% recall, Llama Guard 33.32%; Young (2025) Qwen3Guard 91.0% collapsing to 33.8% on unseen attacks, Granite Guardian holding within 6.5%                                                                                      | Present both fairly; neither wins. State the NIST taxonomy confound wherever 33.32% appears                                                                                                                                            |
| 4   | The landscape, and why it cannot decide                                | Here is the full field on publisher, size, licence and language, here is what I run, and here is why none of it picks for you.                                                                                                                                                                                                                           | Comparison across Llama Guard, Qwen3Guard, ShieldGemma, WildGuard, Granite Guardian, Nemotron; size versus recall r=0.21, p=0.48, n=14; Liu et al. (2024) miscalibration under jailbreak; my own Prompt Guard 2, Presidio, NLI, Llama Guard, NeMo, Guardrails AI | ⚠ Weight licences unconfirmed for ShieldGemma and Granite Guardian. ⚠ All VRAM figures secondary. The 1B to 8B escalation appears **only** here, as a vendor claim independent work contradicts                                        |
| 5   | So what does transfer                                                  | The layers do, and here is why that is more than my taxonomy: the field converged on them in public and the trail is checkable.                                                                                                                                                                                                                          | Dong et al. (2024) as common ancestor; Wang & Li (2025) benchmarking against Llama Guard and NeMo; AWS (n.d.) seven separately configurable policies                                                                                                             | **Never say "independent."** Cite Dong when introducing the trio                                                                                                                                                                       |
| 6   | The seams that would not merge                                         | The project that set out to unify these layers kept them as distinguishable functions and dropped the rest rather than dissolving them.                                                                                                                                                                                                                  | Wang & Li (2025) related work and eval tables; AWS separate policies under commercial pressure to simplify                                                                                                                                                       | ⚠ OpenGuardrails read at abstract and related work level only                                                                                                                                                                          |
| 7   | Structure has its own industry, and it sells the half that generalises | The seam is so real it grew a separate market, and that market ships as infrastructure: vLLM defaults to `auto`, selecting a constrained-decoding backend per request, so you do not choose one at all. But it sells the **enforcement mechanism**, which generalises, and cannot sell the **contract**, which is yours.                                 | vLLM (n.d.) `auto` default across xgrammar and guidance; XGrammar (n.d.) integrated in vLLM, SGLang, TensorRT-LLM, MLC-LLM, OpenVINO GenAI, Modular MAX, Apache 2.0; Guardrails AI, Instructor, BAML on the retry side; Geng et al. (2025)                       | **Verified 2026-08-12, debt closed.** Do **not** write "XGrammar is the default backend": that is the project's own README wording and vLLM's docs say the default is `auto`. ⚠ JSONSchemaBench per engine numbers still not extracted |
| 8   | Your details, your devil                                               | The layers are the transferable artifact and the choices inside them are local and unbuyable. Three instances, one mechanism: the schema is yours, the traffic is yours, the seam is yours. **§7 supplies the sharpest form: the industry sells the enforcement because enforcement generalises, and leaves you the contract because contracts do not.** | Mangini (2026); §7 and §3 as the first two instances; **the archive story merged in as the third**: Protect AI (2026), and the de-bundling that worked because Presidio and the NLI job were already inside                                                      | D7: APA prose self citation, not an internal link. This is the spine. Palit & Woods (2025) reduced to one clause here                                                                                                                  |
| 9   | Every layer is individually unreliable                                 | The layers are evadable, context fragile and badly calibrated, which argues for composing them and against trusting any one of them.                                                                                                                                                                                                                     | Hackett et al. (2025) up to 100% evasion; She et al. (2025) 11% and 8% flips on benign context; Huang et al. (2025) 0.1% to 13.1% false positives                                                                                                                | ⚠ Hackett predates Prompt Guard 2, state it. Concede the correlated failure problem rather than only taking the flattering reading                                                                                                     |
| 10  | Engineering realities                                                  | Fail open, ship in shadow, and expect packaging to dictate deployment.                                                                                                                                                                                                                                                                                   | Huang et al. (2025) false positive spread; NVIDIA (n.d.) `self check input`; first-hand Colang and `click`                                                                                                                                                       | Label both first-hand claims as field reports. `click` capped at one sentence (D3)                                                                                                                                                     |
| 11  | What none of us have measured                                          | Path dependence is the strongest objection, the overlap measurement would settle it, nobody has published one, and that same measurement is what would pick your guard model.                                                                                                                                                                            | Q1 validated negative; Q3 unrebutted per D5                                                                                                                                                                                                                      | Must concede this advice is useless to a reader with no shadow logs                                                                                                                                                                    |
| 12  | Come diverge                                                           | This is a position to argue with, and here is exactly what would change it.                                                                                                                                                                                                                                                                              | D6, paid off from §2                                                                                                                                                                                                                                             | —                                                                                                                                                                                                                                      |

### Checks

- **Does the order build the thesis?** Here are the four layers and they are yours to take.
  You may stop. If you continue: I could not answer which tool to run, because the literature
  contradicts itself. Here is the whole landscape and it still cannot decide. So what
  transfers is the layers, and here is the evidence they are real. Even a unification attempt
  preserved them. One of them grew its own industry. Therefore the layers transfer and the
  choices are local, which is the same reason the tool that vanished did not take the layer
  with it. None of the layers is individually reliable. Here is what running them costs. Here
  is the measurement nobody has. Come argue. That composes the thesis sentence.
- **Is the strongest objection answered?** Yes, §11 takes path dependence and concedes it,
  and carries the second objection from the gate, that "measure it yourself" does not help a
  reader without shadow logs.
- **Sections carrying pre-publication debt:** §3, §4, §6, §9, §10. **§7's XGrammar debt closed
  2026-08-12 against primary sources**, and the correction strengthened the section: the
  verified claim is that vLLM defaults to `auto` backend selection, which is a better
  demonstration of "infrastructure, not a product" than the vendor's own phrasing was.
- **Anything demoted that resurfaced?** No. The 1B to 8B escalation appears only in §4 in its
  assigned role. "Independent arrival" is absent. "Nobody sells you Structure" is replaced by
  §7. The standalone tool churn section is gone, merged into §8.

### Structural changes from the previous outline

1. **The four layers move from §3 to §1**, with no preamble in front of them.
2. **§2 releases the reader explicitly**, and moves the mid-stream framing from the close to
   the open.
3. **The benchmark contradiction moves from §7 to §3**, becoming the hook rather than a late
   finding.
4. **"What I run" merges into the landscape at §4**, after the contradiction, so it cannot be
   read as a recommendation.
5. **The tool churn section is gone**, merged into the spine at §8 as its third instance.
6. **Fourteen sections become twelve.**

## References

Amazon Web Services. (n.d.). Create your guardrail. Amazon Bedrock User Guide. Retrieved August 10, 2026, from https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-components.html

Beurer-Kellner, L., Buesser, B., Creţu, A.-M., Debenedetti, E., Dobos, D., Fabian, D., Fischer, M., Froelicher, D., Grosse, K., Naeff, D., Ozoani, E., Paverd, A., Tramèr, F., & Volhejn, V. (2025, June 10). Design patterns for securing LLM agents against prompt injections (arXiv:2506.08837). arXiv. https://doi.org/10.48550/arXiv.2506.08837

Dong, Y., Mu, R., Jin, G., Qi, Y., Hu, J., Zhao, X., Meng, J., Ruan, W., & Huang, X. (2024). Building guardrails for large language models. In Proceedings of the 41st International Conference on Machine Learning (PMLR 235). https://doi.org/10.48550/arXiv.2402.01822

Geng, S., Cooper, H., Moskal, M., Jenkins, S., Berman, J., Ranchin, N., West, R., Horvitz, E., & Nori, H. (2025, January 18). JSONSchemaBench: A rigorous benchmark of structured outputs for language models (arXiv:2501.10868). arXiv. https://doi.org/10.48550/arXiv.2501.10868 ⚠ per-engine figures not yet extracted; fetch the full paper before citing numbers

Guardrails AI. (n.d.). Guards. Guardrails AI documentation. Retrieved August 4, 2026, from https://www.guardrailsai.com/docs/api_reference_markdown/guards

Hackett, W., Birch, L., Trawicki, S., Suri, N., & Garraghan, P. (2025, April 15). Bypassing LLM guardrails: An empirical analysis of evasion attacks against prompt injection and jailbreak detection systems (arXiv:2504.11168). arXiv. https://doi.org/10.48550/arXiv.2504.11168

Harsh, R. R., Sarmah, B., & Pasquali, S. (2026, April 10). Benchmarking open-source safety guard models: A comprehensive evaluation (arXiv:2605.28830). arXiv. https://doi.org/10.48550/arXiv.2605.28830 ⚠ peer review status not confirmed; benchmark uses its own eight-category scheme, which disadvantages models trained to a different taxonomy

Huang, Y., Bray, N., Rao, A., Ji, Y., & Hu, W. (2025, June 2). How good are the LLM guardrails on the market? A comparative study on the effectiveness of LLM content filtering across major GenAI platforms. Unit 42, Palo Alto Networks. https://unit42.paloaltonetworks.com/comparing-llm-guardrails-across-genai-platforms/

Inan, H., Upasani, K., Chi, J., Rungta, R., Iyer, K., Mao, Y., Tontchev, M., Hu, Q., Fuller, B., Testuggine, D., & Khabsa, M. (2023, December 7). Llama Guard: LLM-based input-output safeguard for human-AI conversations (arXiv:2312.06674). arXiv. https://doi.org/10.48550/arXiv.2312.06674

Liu, H., Huang, H., Gu, X., Wang, H., & Wang, Y. (2024, October 14). On calibration of LLM-based guard models for reliable content moderation (arXiv:2410.10414). arXiv. https://doi.org/10.48550/arXiv.2410.10414 accepted to ICLR 2025

Mangini, E. (2026, July 17). Harness engineering: The devil is in your details. https://emangini.com/blog/2026/harness_engineering

Meta. (n.d.-a). Llama Guard 3-1B model card. PurpleLlama. Retrieved August 4, 2026, from https://github.com/meta-llama/PurpleLlama/blob/main/Llama-Guard3/1B/MODEL_CARD.md ⚠ model card is undated and versioned in place; the 1B variant shipped with Llama 3.2 in September 2024, but that date is not stated on the card itself

Meta. (n.d.-b). Llama Prompt Guard 2 86M model card. PurpleLlama. Retrieved August 10, 2026, from https://github.com/meta-llama/PurpleLlama/blob/main/Llama-Prompt-Guard-2/86M/MODEL_CARD.md ⚠ undated and versioned in place; performance figures are vendor-reported against a private benchmark

Microsoft. (n.d.-a). Prompt Shields in Azure AI Content Safety. Microsoft Learn. Retrieved August 10, 2026, from https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection

Microsoft. (n.d.-b). Presidio: Data protection and de-identification SDK [Code repository]. GitHub. Retrieved August 10, 2026, from https://github.com/microsoft/presidio ⚠ the 2.2.362 / March 2026 release figure comes from a secondary summary, not the repo's own release page

NVIDIA. (n.d.). Input rails. NeMo Guardrails documentation. Retrieved August 4, 2026, from https://docs.nvidia.com/nemo/guardrails/latest/getting-started/4-input-rails/README.html

OWASP. (2025). OWASP Top 10 for large language model applications 2025. OWASP Foundation. https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf

Padhi, I., Nagireddy, M., Cornacchia, G., Chaudhury, S., Pedapati, T., Dognin, P., Murugesan, K., Miehling, E., Santillán Cooper, M., Fraser, K., Zizzo, G., Hameed, M. Z., Purcell, M., Desmond, M., Pan, Q., Ashktorab, Z., Vejsbjerg, I., Daly, E. M., Hind, M., … Sattigeri, P. (2024, December 10). Granite Guardian (arXiv:2412.07724). arXiv. https://doi.org/10.48550/arXiv.2412.07724 ⚠ CC BY 4.0 is the paper licence; model weight licence not confirmed

Palit, S., & Woods, D. (2025, May 19). Evaluating the efficacy of LLM safety solutions: The Palit benchmark dataset (arXiv:2505.13028). arXiv. https://doi.org/10.48550/arXiv.2505.13028

Protect AI. (2026, July 9). LLM Guard: The security toolkit for LLM interactions [Archived code repository]. GitHub. https://github.com/protectai/llm-guard ⚠ date given is the archival date, not the publication date; repository is read-only as of that date

Qwen Team. (2025, October 16). Qwen3Guard technical report (arXiv:2510.14276). arXiv. https://doi.org/10.48550/arXiv.2510.14276 ⚠ corporate author as printed; Apache 2.0 licence stated in the report but not independently confirmed against the model cards

Rebedea, T., Dinu, R., Sreedhar, M., Parisien, C., & Cohen, J. (2023, October 16). NeMo Guardrails: A toolkit for controllable and safe LLM applications with programmable rails (arXiv:2310.10501). arXiv. https://doi.org/10.48550/arXiv.2310.10501

She, Y., Peterson, D. W., Liu, M. M., Upadhyay, V., Chaghazardi, M. H., Kang, E., & Roth, D. (2025, October 6). RAG makes guardrails unsafe? Investigating robustness of guardrails under RAG-style contexts (arXiv:2510.05310). arXiv. https://doi.org/10.48550/arXiv.2510.05310

Tamber, M. S., Bao, F. S., Xu, C., Luo, G., Kazi, S., Bae, M., Li, M., Mendelevitch, O., Qu, R., & Lin, J. (2025, May 7). Benchmarking LLM faithfulness in RAG with evolving leaderboards (arXiv:2505.04847). arXiv. https://doi.org/10.48550/arXiv.2505.04847 ⚠ also published in the EMNLP 2025 industry track; the PDF would not parse, so accuracy/cost/latency comparisons were not extracted

Vectara. (n.d.). Hallucination evaluation model (HHEM-2.1-Open). Hugging Face. Retrieved August 10, 2026, from https://huggingface.co/vectara/hallucination_evaluation_model ⚠ vendor source; the download count is self-reported

vLLM. (n.d.). Structured outputs. vLLM documentation. Retrieved August 12, 2026, from https://docs.vllm.ai/en/latest/features/structured_outputs.html states the default backend is `auto`, selecting between xgrammar and guidance per request

Wang, T., & Li, H. (2025, October 22). OpenGuardrails: A configurable, unified, and scalable guardrails platform for large language models (arXiv:2510.19169). arXiv. https://doi.org/10.48550/arXiv.2510.19169

XGrammar. (n.d.). XGrammar [Code repository]. GitHub. Retrieved August 12, 2026, from https://github.com/mlc-ai/xgrammar Apache 2.0; integrated in vLLM, SGLang, TensorRT-LLM, MLC-LLM, OpenVINO GenAI and Modular MAX ⚠ the "default structured generation backend" phrasing is the project's own README claim and is contradicted by vLLM's documentation

Young, R. J. (2025, November 27). Evaluating the robustness of large language model safety guardrails against adversarial attacks (arXiv:2511.22047). arXiv. https://doi.org/10.48550/arXiv.2511.22047 single author; 10 models, 1,445 prompts, 21 attack categories

Zeng, W., Liu, Y., Mullins, R., Peran, L., Fernandez, J., Harkous, H., Narasimhan, K., Proud, D., Kumar, P., Radharapu, B., Sturman, O., & Wahltinez, O. (2024, July 31). ShieldGemma: Generative AI content moderation based on Gemma (arXiv:2407.21772). arXiv. https://doi.org/10.48550/arXiv.2407.21772 author list verified against the abstract page ⚠ vendor-reported +10.8% AU-PRC over Llama Guard; Gemma weights ship under Gemma Terms of Use, not confirmed here

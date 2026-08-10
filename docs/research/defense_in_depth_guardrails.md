# Defense-in-Depth Guardrails — Four Complementary Layers for LLM Applications

## Stage

- [x] Hypothesis _(retroactive — see note)_
- [x] Research
- [x] Thesis _(gate — human approved 2026-08-10)_
- [ ] Outline
- [ ] Draft

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

**D1 — Terminology: "layer," not "tier."** _(author, 2026-08-10)_ Use **layer** throughout
the post and in the working doc. Reserve "tier" for escalation _within_ a layer, which is
what the 1B→8B Llama Guard path actually is. This keeps the two axes verbally distinct:
layers are horizontal, tiers are vertical inside one layer.

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

## Thesis

**Sentence.** Guardrail architecture is converging in public on four layers — scan, classify,
dialog, structure — and the citation trail shows something better than independent invention
would: even the projects setting out to unify the layers keep them as distinguishable
functions, which is the strongest evidence available that the seams belong to the problem
rather than to anyone's product.

**Delta from hypothesis.** **Widened, and the warrant was replaced.** The four layers
themselves survived intact — that part is unchanged and the falsifier pass strengthened it.
What moved is what the claim rests on. The hypothesis argued from the inside: _here is why
each layer is necessary_, justified by one stack's experience and each tool's primary
documentation. The thesis argues from the outside: _three teams with different constraints
arrived at the same decomposition_, which is a stronger and more falsifiable kind of
evidence. Three specific shifts drove it:

1. The invalid tool-count falsifier was withdrawn (author correction), and re-reading its
   evidence against the actual layer claim inverted the verdict from counter-evidence to
   convergent evidence.
2. Bedrock and OpenGuardrails moved from rivals to be dismissed into supporting bodies
   (**D2**, **D4**).
3. The audience widened. It was "the engineer choosing a guardrail product." It is now also
   "the engineer already running three layers inside one console who cannot name them" —
   layer illiteracy rather than layer absence.

**Second re-warranting (2026-08-10, after the open-question research).** The warrant moved
again, and this time because research falsified part of it. "Independent convergence" is dead
— Q2 established that OpenGuardrails benchmarks directly against Llama Guard and NeMo, and
that Dong et al. (2024) had grouped the same three systems and reached "no single solution
suffices" before this stack existed. The warrant is now **persistence under attempted
unification**: the seams survive in the work of parties who read each other and who were
actively trying to remove them. That is a narrower claim than independence and a sturdier
one, because it is traceable — the citation trail is checkable by any reader, where
independence never was.

Net across both moves: the four layers have not changed since the hypothesis. What they rest
on has been rebuilt twice, each time under contact with evidence.

**Strongest unanswered objection.** **Path dependence.** The layers may persist not because
the problem has these seams but because everyone inherited the same 2024 framing — Dong et
al. grouped Llama Guard, NeMo, and Guardrails AI, and every subsequent system has been
answering that grouping. Under this reading the seams are a convention the field locked in
early, and their persistence measures the strength of the convention rather than the
structure of the problem. This is sharper than the old independence objection because the
citation trail, which is now the thesis's evidence, is _also_ the mechanism by which lock-in
would propagate. The same trail supports both readings.

**What would settle it is the measurement nobody has.** Path dependence and real seams make
different predictions about overlap: if the boundaries are conventional, the layers should
substantially co-fire on the same traffic; if they track distinct failure modes, they should
not. That is Q1, and Q1 has no published answer. **So the strongest objection to the thesis
and the largest gap in the public record are the same fact**, which is a good reason for the
post to end pointing at it rather than pretending to close it.

The older framing of this objection is superseded but worth keeping in mind while drafting: I
cannot demonstrate independence, and the post must not pretend otherwise.

**Per D6, the piece concedes this openly and makes the concession structural.** It does not
claim proof. It reports a convergence observed mid-stream, states plainly that shared
intellectual ancestry is the obvious alternative explanation, and offers the narrower
observation it can defend: shared reading does not by itself explain why teams under very
different commercial constraints — a hyperscaler selling a managed service, an open-source
project chasing multilingual coverage, a self-hosted lab optimizing for zero licensing cost —
put the seams in the same places. That is weaker than proof and is stated as weaker.

The objection is therefore not a hole to be patched but the post's invitation: if the
convergence is really one lineage wearing three hats, the person who can show that has a
better piece to write, and this one should say so explicitly.

A second objection, partially answered: **She et al. (2025) show the layers are
context-fragile**, with benign retrieved documents flipping guardrail verdicts ~11% of the
time. Defense-in-depth assumes failures are uncorrelated; if every layer degrades under the
same RAG context, they are correlated and stacking buys less than it appears to. The post
answers this only partially — it argues the finding strengthens the case against
single-layer designs while conceding it weakens the reliability of the stack as a whole.

**Demoted.**

- **Palit & Woods (2025) benchmarking of LLM Guard** — validated a tool that has since been
  archived. Drops from a supporting finding to one clause inside the tool-churn passage.
- **The LLM Guard 15-input / 21-output scanner inventory** — was doing the work of proving
  Scan is a real layer. Convergence now does that work better. Cut.
- **The `click` / `griffe` dependency-conflict material** — genuinely good field detail, but
  **D3** declines the packaging debate, and this argues about products rather than
  architecture. At most one line; it no longer earns a section.
- **Hackett et al. (2025) is repositioned, not demoted** — it was the centerpiece of the
  honesty section; it now serves the narrower job of showing why no single layer suffices.
- **Every "independent arrival" formulation is cut** _(2026-08-10)_ — falsified by Q2. Any
  surviving phrasing that implies the three parties worked in isolation must go, including in
  the distilled source doc if the post borrows from it.

**Promoted.** **Dong et al. (2024)** moves from absent to load-bearing. It is simultaneously
the common ancestor that kills the independence claim, peer-reviewed support for "no single
solution suffices," and the first checkpoint on the citation trail the thesis now runs on.
It should appear early in the post, not in a footnote.

**Publish gates.**

_Must close before publication:_

- ~~The Springer survey~~ — **closed by D5.** Cut, along with every claim resting on it.
- ~~The NLI grounding component~~ — **closed by research, 2026-08-10.** Sourced: NLI
  entailment as the grounding primitive, the SummaC → AlignScore → MiniCheck → HHEM lineage,
  and Tamber et al. (2025) on the documented limits of current detectors.
- **Any surviving `click<=8.2.0` line** must be labeled a first-hand observation, since it
  could not be confirmed upstream. If the demotion above removes it, this gate closes itself.

_Open questions the post should name as invitations, per D6:_

- **Layer overlap is unmeasured, and no published measurement exists** (validated negative,
  Q1). What fraction of what Classify flags did Scan already catch? Answerable only from
  shadow-mode logs. This is also the test that would separate real seams from path
  dependence, which makes it the post's closing ask.
- **Whether model alignment alone covers most of what Scan catches** — unrebutted since D5,
  and no verifiable source found in Q3.
- ~~Whether the convergence reflects independent arrival or shared ancestry~~ — **closed by
  Q2: shared ancestry, demonstrated.** Now stated as fact in the post rather than posed as a
  question.

_Additional publication constraint, per Q2:_ the post must not describe the three bodies as
independent, and must cite Dong et al. (2024) when it introduces the trio, since that paper
grouped them first.

_May ship flagged:_

- Meta model cards are undated and versioned in place — cite `n.d.` with retrieval dates.
- Prompt Guard 2 figures are vendor-reported against a private benchmark — say so inline.
- Presidio's exact release version came from a secondary summary — soften or omit the number.
- OpenGuardrails' 119-language and 98%-accuracy figures come from the abstract only — prefer
  its architectural facts and flag any performance number used.

**D7 — §6 cites back to the "devil is in your details" argument.** _(author, 2026-08-10)_
Structure's absence from every bundle is not an accident of product roadmaps; it is the
`harness_engineering` thesis showing up in guardrails. That post argued that what you can buy
is the inexpensive, transferable artifact, while what actually creates value is local and
cannot be bought at any scale.

Applied here, it **explains** the §6 observation rather than merely restating it. Scan,
Classify, and Dialog are all sellable because their subject matter generalizes: harmful
content is harmful for every customer, injection looks like injection everywhere, and even
denied topics are a list a vendor can let you fill in. **A schema contract does not
generalize.** It is defined entirely by which of your producers emits it and which of your
consumers breaks when it is malformed — details that are, precisely, yours and yours alone.
That is why no vendor ships the fourth layer, and why the reader who bought three cannot buy
the fourth.

Cite in APA prose like any other source, not as an internal link. ⚠ **No post on this site
currently links to another** — the convention is prose citation with a reference entry, and
this would be the first self-citation; do not invent a cross-linking pattern to accommodate
it. Reference entry to add at draft time: _Mangini, E. (2026, July 17). Harness engineering:
The devil is in your details. https://emangini.com/blog/2026/harness_engineering_ (slug
verified against `velite.config.ts`, which strips only the leading `blog/`, so the year stays
in the path).

## Outline

**Register. Grey paper**, target ~25–30k characters with a full APA reference list — shorter
than `harness_engineering` (~50k) because the thesis is narrower, but well past essay length.
Three things force grey paper rather than essay: twenty references that must be listed, an
honesty apparatus the thesis depends on (⚠ flags, first-hand claims labeled as such), and a
citation-trail argument that only works if the trail is actually shown. An essay at ~7k would
have to assert the trail instead of tracing it, which is the one thing this piece cannot do.

**Harvested from Decisions:** D1 fixes the vocabulary section (§2). D3 rules out any
unification-vs-layering section. D4 supplies §4 and §5. D6 supplies §10 and §11. D5 sets the
concession in §10. That is six of eleven sections already settled by prior decisions.

| #   | Section                                   | Claim it makes                                                                                                                                                                                                                                                  | Evidence                                                                                                                                                        | Debt                                                                                                    |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | The question with a false premise         | "Which guardrail should I use" presumes a single product, and that premise is what produces one-scanner architectures.                                                                                                                                          | OWASP (2025) layered mitigation; Beurer-Kellner et al. (2025) six patterns                                                                                      | —                                                                                                       |
| 2   | Layer is not tool; tier is not layer      | Layer count and tool count are independent axes, and tiers run vertically inside one layer.                                                                                                                                                                     | Llama Guard 1B→8B escalation inside Classify; Meta (n.d.-a) F1 0.899 vs 0.939                                                                                   | Must land before §3 or the rest misreads (D1)                                                           |
| 3   | The four layers and the one job each does | Each layer catches a failure mode the other three structurally cannot.                                                                                                                                                                                          | Inan et al. (2023); Rebedea et al. (2023); Guardrails AI (n.d.) re-ask; Prompt Guard 2 · Presidio · NLI for Scan                                                | ⚠ Prompt Guard 2 figures vendor-reported — say so inline. ⚠ HHEM download count vendor-reported — omit  |
| 4   | The citation trail                        | The field converged on these seams in public, and the trail is checkable: Dong et al. grouped the trio and concluded no single solution suffices; OpenGuardrails benchmarks against that lineage; AWS ships the same seams under different commercial pressure. | Dong et al. (2024); Wang & Li (2025); AWS (n.d.)                                                                                                                | **Must not say "independent"** (Q2). Cite Dong when introducing the trio                                |
| 5   | The seams survive unification             | The project that set out to unify the layers kept them as distinguishable functions and dropped the rest rather than dissolving them — seams that survive a deliberate unification attempt are hard seams.                                                      | Wang & Li (2025) related work + eval tables; AWS separate configurable policies                                                                                 | ⚠ OpenGuardrails detail is from abstract and related work only                                          |
| 6   | Structure is the layer nobody sells you   | Structure is absent from every bundle _because_ a schema contract does not generalize — the other three layers are sellable precisely because their subject matter does. The reader who bought three layers cannot buy the fourth.                              | AWS automated reasoning ≠ schema/re-ask; absent in OpenGuardrails; Guardrails AI (n.d.) re-ask; **Mangini (2026)** on the buyable artifact vs. the local detail | Self-citation in APA prose, not an internal link (D7)                                                   |
| 7   | Every layer is individually unreliable    | The layers are evadable and context-fragile, which is the argument for composing them and against trusting any one of them.                                                                                                                                     | Hackett et al. (2025) up to 100% evasion; She et al. (2025) ~11%/~8% flip on benign context; Huang et al. (2025) FP 0.1%–13.1%                                  | ⚠ Hackett predates Prompt Guard 2 — state it                                                            |
| 8   | Engineering realities                     | Fail open, ship in shadow, and expect packaging to dictate deployment.                                                                                                                                                                                          | Huang et al. (2025) FP spread justifies shadow; NVIDIA (n.d.) `self check input`; first-hand Colang report                                                      | ⚠ Colang misfire is a field report, label it. `click` line ≤1 sentence, labeled first-hand, or cut (D3) |
| 9   | Name layers by job, because tools churn   | The layer outlives the tool: the archived scanner proves it, and the de-bundling showed the seam was already in the right place.                                                                                                                                | Protect AI (2026) archive; Presidio and the NLI/`FactualConsistency` lineage already inside the retired tool                                                    | Palit & Woods (2025) reduced to a single clause here                                                    |
| 10  | What none of us have measured             | Path dependence is the strongest objection, overlap data would settle it, and no such measurement is published.                                                                                                                                                 | Q1 validated negative; Q3 unrebutted per D5                                                                                                                     | This section _is_ the debt — answers the thesis-gate objection                                          |
| 11  | A report from mid-stream                  | This is not a recommendation but a position to argue with; here is what would change it.                                                                                                                                                                        | D6                                                                                                                                                              | —                                                                                                       |

### Checks

- **Does the order build the thesis?** Reading the claims column top to bottom: the buying
  question is wrong → layers are not tools → here are the four → the field converged on them
  in public → the seams survived an attempt to remove them → one is missing from every bundle
  → none is individually reliable → here is what running them costs → the tools churn but the
  layers do not → and here is what nobody has measured. That composes the thesis sentence.
- **Is the strongest objection answered?** Yes — §10 takes path dependence directly, and
  concedes rather than closes it, per D6.
- **Sections carrying pre-publication debt:** §3 (vendor-reported figures), §5
  (abstract-only sourcing), §7 (Hackett predates Prompt Guard 2), §8 (`click` labeled or
  cut; Colang labeled). §4 carries the hard constraint against "independent."
- **Anything demoted that resurfaced?** No. The LLM Guard scanner inventory is absent, Palit
  is one clause in §9, and the dependency material is capped at one sentence in §8.

## References

Amazon Web Services. (n.d.). Create your guardrail. Amazon Bedrock User Guide. Retrieved August 10, 2026, from https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-components.html

Beurer-Kellner, L., Buesser, B., Creţu, A.-M., Debenedetti, E., Dobos, D., Fabian, D., Fischer, M., Froelicher, D., Grosse, K., Naeff, D., Ozoani, E., Paverd, A., Tramèr, F., & Volhejn, V. (2025, June 10). Design patterns for securing LLM agents against prompt injections (arXiv:2506.08837). arXiv. https://doi.org/10.48550/arXiv.2506.08837

Dong, Y., Mu, R., Jin, G., Qi, Y., Hu, J., Zhao, X., Meng, J., Ruan, W., & Huang, X. (2024). Building guardrails for large language models. In Proceedings of the 41st International Conference on Machine Learning (PMLR 235). https://doi.org/10.48550/arXiv.2402.01822

Guardrails AI. (n.d.). Guards. Guardrails AI documentation. Retrieved August 4, 2026, from https://www.guardrailsai.com/docs/api_reference_markdown/guards

Hackett, W., Birch, L., Trawicki, S., Suri, N., & Garraghan, P. (2025, April 15). Bypassing LLM guardrails: An empirical analysis of evasion attacks against prompt injection and jailbreak detection systems (arXiv:2504.11168). arXiv. https://doi.org/10.48550/arXiv.2504.11168

Huang, Y., Bray, N., Rao, A., Ji, Y., & Hu, W. (2025, June 2). How good are the LLM guardrails on the market? A comparative study on the effectiveness of LLM content filtering across major GenAI platforms. Unit 42, Palo Alto Networks. https://unit42.paloaltonetworks.com/comparing-llm-guardrails-across-genai-platforms/

Inan, H., Upasani, K., Chi, J., Rungta, R., Iyer, K., Mao, Y., Tontchev, M., Hu, Q., Fuller, B., Testuggine, D., & Khabsa, M. (2023, December 7). Llama Guard: LLM-based input-output safeguard for human-AI conversations (arXiv:2312.06674). arXiv. https://doi.org/10.48550/arXiv.2312.06674

Mangini, E. (2026, July 17). Harness engineering: The devil is in your details. https://emangini.com/blog/2026/harness_engineering

Meta. (n.d.-a). Llama Guard 3-1B model card. PurpleLlama. Retrieved August 4, 2026, from https://github.com/meta-llama/PurpleLlama/blob/main/Llama-Guard3/1B/MODEL_CARD.md ⚠ model card is undated and versioned in place; the 1B variant shipped with Llama 3.2 in September 2024, but that date is not stated on the card itself

Meta. (n.d.-b). Llama Prompt Guard 2 86M model card. PurpleLlama. Retrieved August 10, 2026, from https://github.com/meta-llama/PurpleLlama/blob/main/Llama-Prompt-Guard-2/86M/MODEL_CARD.md ⚠ undated and versioned in place; performance figures are vendor-reported against a private benchmark

Microsoft. (n.d.-a). Prompt Shields in Azure AI Content Safety. Microsoft Learn. Retrieved August 10, 2026, from https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection

Microsoft. (n.d.-b). Presidio: Data protection and de-identification SDK [Code repository]. GitHub. Retrieved August 10, 2026, from https://github.com/microsoft/presidio ⚠ the 2.2.362 / March 2026 release figure comes from a secondary summary, not the repo's own release page

NVIDIA. (n.d.). Input rails. NeMo Guardrails documentation. Retrieved August 4, 2026, from https://docs.nvidia.com/nemo/guardrails/latest/getting-started/4-input-rails/README.html

OWASP. (2025). OWASP Top 10 for large language model applications 2025. OWASP Foundation. https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf

Palit, S., & Woods, D. (2025, May 19). Evaluating the efficacy of LLM safety solutions: The Palit benchmark dataset (arXiv:2505.13028). arXiv. https://doi.org/10.48550/arXiv.2505.13028

Protect AI. (2026, July 9). LLM Guard: The security toolkit for LLM interactions [Archived code repository]. GitHub. https://github.com/protectai/llm-guard ⚠ date given is the archival date, not the publication date; repository is read-only as of that date

Rebedea, T., Dinu, R., Sreedhar, M., Parisien, C., & Cohen, J. (2023, October 16). NeMo Guardrails: A toolkit for controllable and safe LLM applications with programmable rails (arXiv:2310.10501). arXiv. https://doi.org/10.48550/arXiv.2310.10501

She, Y., Peterson, D. W., Liu, M. M., Upadhyay, V., Chaghazardi, M. H., Kang, E., & Roth, D. (2025, October 6). RAG makes guardrails unsafe? Investigating robustness of guardrails under RAG-style contexts (arXiv:2510.05310). arXiv. https://doi.org/10.48550/arXiv.2510.05310

Tamber, M. S., Bao, F. S., Xu, C., Luo, G., Kazi, S., Bae, M., Li, M., Mendelevitch, O., Qu, R., & Lin, J. (2025, May 7). Benchmarking LLM faithfulness in RAG with evolving leaderboards (arXiv:2505.04847). arXiv. https://doi.org/10.48550/arXiv.2505.04847 ⚠ also published in the EMNLP 2025 industry track; the PDF would not parse, so accuracy/cost/latency comparisons were not extracted

Vectara. (n.d.). Hallucination evaluation model (HHEM-2.1-Open). Hugging Face. Retrieved August 10, 2026, from https://huggingface.co/vectara/hallucination_evaluation_model ⚠ vendor source; the download count is self-reported

Wang, T., & Li, H. (2025, October 22). OpenGuardrails: A configurable, unified, and scalable guardrails platform for large language models (arXiv:2510.19169). arXiv. https://doi.org/10.48550/arXiv.2510.19169

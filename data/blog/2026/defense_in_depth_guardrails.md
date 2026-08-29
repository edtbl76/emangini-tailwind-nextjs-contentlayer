---
title: 'Defense in Depth: Four Guardrail Layers for LLM Applications'
date: '2026-08-27'
lastmod: '2026-08-27'
summary: 'Four things can go wrong between a user message and your response, and each is invisible to the checks that catch the other three. The four layers transfer between systems; the choices inside them do not. Two credible benchmarks rank the same guard models in opposite orders, so the only evidence that can pick yours is your own traffic. This is a report from the middle of an unsettled question rather than a recommendation: what several groups have built, why one layer is missing from every product you can buy, and the measurement none of us has published.'
authors: ['default']
draft: true
---

Every request through an LLM application takes the same path. When a user types something, your code wraps it in a prompt assembled from the system instruction you wrote, whatever documents you retrieved, and the conversation up to that point, all of it concatenated into a single string before it reaches the model. The model generates a response one token at a time, with no way of telling which part of that string was your instruction and which part came from the user. Your code parses whatever comes back and puts it to use, rendering it to a screen, writing it to a record, or passing it into a function as an argument. When the user types again the prompt is rebuilt from scratch with the previous exchange folded into it, and that accumulation is what we call the conversation.

If you have spent time in network security this will feel familiar, and where it stops being familiar is the important part. Building a prompt is encapsulation, in that several sources of information are wrapped together into a single payload for transit. What never happens is decapsulation. A network stack strips each header at the point that owns it because the framing is structural, and a length field isn't a suggestion. The model gets one flat string in which the boundary between your instruction and the user's text is a convention it was trained to respect rather than a frame it's obliged to parse. Injection is what happens when it doesn't.

The text arriving is untrusted and can carry instructions aimed at your system prompt rather than at you, while the content itself, in either direction, may be something you should decline to process or decline to return, which is a judgment about meaning rather than a pattern you can match. Control over which topics are in bounds belongs to that whole conversation rather than to any single message, so a user with four turns has considerably more room to work than a user with one. And whatever comes back arrives as text, with no guarantee it's the text your code was written to parse.

Four things can go wrong on that path, and no two fail along the same seam, which is why each one is invisible to the checks that catch the other three.

**Scan** is stateless pattern work on the text moving in and out, looking for an injection attempt in the prompt, an account number in the reply, or a claim the retrieved documents don't actually support. It runs on strings and it has no memory.

**Classify** is a model reading the content and judging it against a taxonomy, which the literature treats as a genuinely different job from scanning (Inan et al., 2023), since patterns catch known shapes while a classifier renders a verdict on content it has never seen in that form before.

**Dialog** is control over the conversation rather than over any single message, governing which topics your application will follow, which it declines, and what it does when someone walks it somewhere across four turns that no one turn would have triggered (Rebedea et al., 2023). The stateless scanners have no notion of a fourth turn.

**Structure** is whether the output is the shape your code expects, and what happens when it isn't, which means a schema, a validation pass, and a repair that targets the field which actually failed rather than regenerating the whole response and hoping.

The four layers didn't come from a taxonomy I read, and they didn't come from what I built either. They came from putting two things beside each other and looking at where they overlap.

The first is the landscape of tools the industry has actually shipped, which tells you where a large number of serious people believe this problem divides. The second is the lifecycle above, and the specific points at which a prompt can be broken on its way through it. Neither settles anything alone. A tool market reflects what is fundable and packageable at least as much as what is true, and my reading of the lifecycle is still my reading. What is worth attention is where the two agree, because mapping the tools onto the failure points brings the same boundaries up from both directions at once. Those recurring boundaries are what I'm calling layers.

I've since built all four on modest hardware for close to nothing. That comes late in this piece, and it's there to show what the thing looks like rather than to argue that it's right.

Four is also where the decomposition currently looks stable rather than a number I'm confident in. There is a real case for three and a real case for five, and I would rather argue those than assume them away, so both appear below with the evidence behind them.

So take the four layers as a proposal, and take the rest of this piece as the evidence I've for it, including the parts that cut the other way.

---

## The question I could not answer

The question I get is always some version of "which guardrail should I run," and for a long time I gave the answer any consultant gives, which is that it depends on your risk profile. That is true and it's useless. So I went to the literature to find the version of the answer that doesn't depend on anything, expecting to come back with a shortlist and a set of conditions.

What I came back with was two credible benchmarks that rank the same models in opposite orders.

Harsh, Sarmah and Pasquali (2026) evaluated fourteen open source safety guard models against 79,331 samples aggregated from HarmBench, StrongREJECT, RealToxicityPrompts and BeaverTails, scored across eight safety categories. Their argument is that recall is the metric that matters for safety work, because a miss is worse than a false alarm, and on recall the ordering is stark, with Qwen3Guard at 4B leading on 83.97% while Llama Guard at 12B records 33.32%, second worst in the study. The authors note that ShieldGemma achieves the highest precision in the set at 82.20% while missing 54.51% of unsafe content, and that GPT-OSS Safeguard misses 75.14%.

Read that table alone and the conclusion is obvious. Run Qwen3Guard.

Young (2025) puts a different question to ten models across 1,445 prompts and 21 attack categories, asking not how well a guard scores but how much of that score survives contact with attacks it hasn't seen. Qwen3Guard at 8B scores 91.0% on familiar ground and 33.8% on unseen adversarial prompts, a collapse of 57.2 points. Granite Guardian, which doesn't appear in the top of Harsh's recall table at all, declines by 6.5% and holds. Young's conclusion is stated plainly: "generalization ability, not overall accuracy, should be the primary metric for guardrail evaluation."

So a reader who acts on the first benchmark lands on precisely the model the second one singles out as the most brittle.

The cheap move here is to declare Young the winner on the grounds that adversarial robustness is what a guard is for, and to quietly retire the first table. That would be confirmation shopping with extra steps. These are different benchmarks with different prompts, different categories and different scoring, and their numbers can't be merged into a single ranking. Neither is measuring the thing the other is measuring.

Two caveats travel with these figures. Harsh et al. score every model against their own eight-category scheme, and Llama Guard is trained against the MLCommons taxonomy, so a guard evaluated on categories it wasn't built for will under-report. That is a real confound and it isn't a full excuse, since the same is true for every model in the table. Both papers are arXiv preprints and I haven't confirmed peer review for either.

Young also found that under certain conditions Nemotron Safety and Granite Guardian generate harmful content rather than blocking it. A guard that can be induced to emit the thing it exists to catch isn't a weak guard but a new attack surface.

Liu et al. (2024) add a third view across nine guard models and twelve benchmarks, and it's no more reassuring, finding that guard models are systematically overconfident and become significantly more miscalibrated under jailbreak conditions.

None of this tells you which guardrail to run. That is the point at which I stopped trying to answer the question as asked and started asking what the tools were failing to cover.

---

## The landscape, and what falls between the tools

If the benchmarks can't pick a tool for you, the next useful question isn't which tool is best but what job each one is actually doing, and what happens to the jobs nobody is doing.

Here is the field as it stands, restricted to things you can download and run.

| Model             | Publisher | Sizes        | Recall (Harsh)       | Generalisation (Young)                     |
| ----------------- | --------- | ------------ | -------------------- | ------------------------------------------ |
| Qwen3Guard        | Alibaba   | 0.6B, 4B, 8B | 83.97%               | 91.0% falling to 33.8%                     |
| Nemotron Safety   | NVIDIA    | 8B           | 77.25%               | emitted harmful content in some conditions |
| WildGuard         | AI2       | 7B           | 73.83%               | not tested                                 |
| Granite Guardian  | IBM       | 5B, 8B       | not in the top table | 6.5% decline, best in the study            |
| ShieldGemma       | Google    | 2B, 9B       | 45.49%               | not tested                                 |
| Llama Guard       | Meta      | 1B, 8B, 12B  | 33.32%               | not tested                                 |
| GPT-OSS Safeguard | OpenAI    | 20B          | 24.86%               | not tested                                 |

Four things are worth pulling out of that table, and none of them is a recommendation.

**Size doesn't buy you accuracy.** Harsh et al. report a Pearson correlation between log-transformed model size and recall of r=0.21, p=0.48, across fourteen models. That isn't a weak relationship, it's the absence of one. Corroboration arrives from an unrelated direction, since the OpenGuardrails evaluation has Llama Guard 3 at 8B averaging 76.2 on English prompt classification while Llama Guard 4 at 12B averages 72.4, which is newer, larger and worse, measured by a different group on a different benchmark suite.

I'm dwelling on this because I used to argue the opposite. The case I made was that you run a small model by default and escalate to a larger one when the verdict matters, and the evidence I had for it was Meta's own reported F1 figures of 0.899 at 1B against 0.939 at 8B. Those numbers are real. They are also vendor-reported on a private benchmark, and the only independent work I've found that tests the premise across a range of models says size explains almost nothing. The escalation argument was a vendor claim that I had adopted without checking.

**Licensing constrains the shortlist.** Qwen3Guard ships Apache 2.0 across all three sizes with 119 languages. Llama Guard carries the Llama Community License with its monthly active user ceiling, which is irrelevant to a lab and isn't irrelevant to a product. For ShieldGemma and Granite Guardian I've confirmed only the paper licences, which say nothing about the weights, and Gemma models ship under Gemma Terms of Use rather than a standard open source licence. I'm flagging that rather than filling it in.

**Deployment shape varies more than the scores suggest.** Qwen3Guard ships two architectures, a generative one that frames classification as instruction-following and a streaming one that classifies token by token during generation, and those aren't two sizes of the same thing but different integration points. Granite Guardian covers RAG groundedness and answer relevance alongside content harms, which means adopting it would fold part of one job into a tool doing another.

That last point is where this piece started. Once you lay the tools out this way, the interesting thing isn't the ranking. It is that the tools keep cutting the problem at different places, and the cuts don't line up. Something classifies content against a taxonomy. Something else pattern-matches for injections and personal data. Something else again governs what your application will discuss across a conversation rather than in a message. Something else entirely decides whether the output parses. Each product covers some of that and not the rest, and the coverage boundaries aren't arbitrary. They fall in the same few places.

Lay those cuts over the lifecycle and they stop looking like packaging decisions. Each one lands where a real handoff happens, which is the agreement I said was worth attention. The industry carved the problem in roughly these places, and the places it carved are where the prompt was already breaking. Those are what I'm calling layers.

---

## Structure has its own industry, and it sells the half that generalises

The fourth layer is the one I got most wrong.

What I used to say was that Structure is the layer nobody sells you. That is factually wrong. There is a large, competitive, well-funded market for making model output conform to a schema. What is true, and narrower, and considerably stranger, is that this market sits almost entirely outside the guardrail world, and the two ecosystems barely cite each other.

It splits into two mechanisms that solve the same problem from opposite ends.

**Validate then retry.** The model generates freely, the output is checked against a schema, and a failure triggers a targeted re-ask rather than a blanket regeneration. Guardrails AI documents this as `OnFailAction.REASK`, with a retry cap and a Pydantic model as the entry point. Instructor and BAML occupy the same space, the latter existing partly because strict JSON parsers choke on markdown-wrapped output and reasoning preambles.

**Constrain during generation.** Invalid tokens are masked at decode time, so malformed output can't be produced at all. Geng et al. (2025) benchmark six engines in this category against ten thousand real-world JSON schemas plus the official test suite.

Constrained decoding isn't a product you evaluate and adopt, because it's already switched on underneath you. vLLM's documentation states that its default structured-output backend is `auto`, which selects between xgrammar and guidance per request. XGrammar itself is Apache 2.0 and integrated into vLLM, SGLang, TensorRT-LLM, MLC-LLM, OpenVINO GenAI and Modular MAX. You aren't choosing a structured-output engine. You are choosing an inference server, and it chose for you.

A seam that grows its own industry is a harder seam than one nobody serves. An industry that's independently funded, with its own benchmarks and its own vocabulary, is better evidence that Structure is a distinct job than anything I could argue from my own stack.

That industry sells the enforcement mechanism, which generalises completely, since a grammar-constrained decoder doesn't care what your schema says. It can't sell you the schema, because the contract between your producers and your consumers isn't a thing that exists outside your system. I've argued that distinction at more length elsewhere (Mangini, 2026).

I haven't extracted per-engine numbers from the JSONSchemaBench paper, and the comparisons circulating about compliance rates and compilation times come from secondary summaries rather than the paper itself. Treat the mechanism as well established and any specific engine ranking as unverified.

---

## Every layer is individually unreliable

The layers don't work very well.

Everything above could be read as an argument that four layers gets you covered. It does not. It gets you four partial defences with uncorrelated blind spots, which is better than one partial defence, and isn't the same as coverage.

**Scanners are evadable, and the number isn't close.** Hackett et al. (2025) tested six protection systems, including Meta's Prompt Guard and Microsoft's Azure Prompt Shield, using character-injection and adversarial machine learning techniques, and report evasion success rates reaching 100% while preserving the attack's utility. They also demonstrate that attackers can compute word-importance rankings against offline white-box models and transfer them to black-box targets, which turns a closed system into a semi-open one. The paper predates Prompt Guard 2, so it's evidence about the class of detector rather than a verdict on the current model, which is a real qualification and not much of a comfort.

**Guards are context-fragile.** She et al. (2025) found that placing the same prompt in a retrieval-augmented context flips guard verdicts on benign material at rates of 11% and 8%. The content didn't change. The surrounding documents did.

**Calibration fails exactly when you need it.** Liu et al. (2024) evaluated nine guard models across twelve benchmarks and found systematic overconfidence, with significant additional miscalibration under jailbreak conditions. The confidence score that would let you route borderline cases to review is least trustworthy precisely when the input is adversarial.

**Guards can become the attack.** Young observed Nemotron Safety and Granite Guardian generating harmful content rather than blocking it under certain conditions. That is a different failure class from a miss, and it's the one that should make you nervous about adding models to a pipeline as a reflex.

The argument for composing layers is that their failures are uncorrelated, so an attack that slips past one gets caught by another. Nothing in the literature I've found measures that correlation, and there are obvious reasons to expect some of it. Three of the four layers are transformer models trained on overlapping public data, evaluated against overlapping taxonomies. If they fail in similar ways on similar inputs, composition buys much less than it appears to.

Nobody has published the measurement, so I don't know.

---

## The citation trail

The obvious objection is that both of my inputs are mine. I chose how to read the lifecycle, and I chose which tools to take seriously, so the agreement between them could be an agreement I arranged. A sufficiently determined person could carve the same ground into three pieces or seven.

The check I can offer is that other people carved it in the same places.

Dong et al. (2024), in _Building guardrails for large language models_, group Llama Guard, NeMo Guardrails and Guardrails AI together and conclude that no single approach suffices. That paper matters here for a reason beyond its conclusion: it's the common ancestor. It is what a great many subsequent projects cite when they explain why their architecture has more than one component in it.

Amazon's Bedrock guardrails ship denied topics, content filters, sensitive information filters and contextual grounding as separately configurable policies within one console. That is a company with every commercial reason to present guardrails as a single switch, shipping them as distinct policies with distinct configuration surfaces.

Wang and Li (2025) built OpenGuardrails explicitly to unify the field, benchmarking against Llama Guard, ShieldGemma, WildGuard and Qwen3Guard among others.

I got this wrong the first time. My earlier version described these as independent arrivals at the same architecture, three groups reaching the same conclusion without reference to each other. That is false. They read each other. The trail is a trail, which means the convergence could be nothing more than a shared starting point propagating outward.

So this section can't carry the weight on its own. What it establishes is weaker, which is that the decomposition is public, checkable, and not a private taxonomy I invented to organise a blog post. Whether it's _right_ needs a different kind of evidence, and there's exactly one piece of it worth the name.

---

## The seams that would not merge

Independent invention would have been weaker evidence than what the trail actually contains.

Parties who read each other are free to collapse the boundaries, and more than free, since every additional component is another thing to deploy, document, version and sell. So the interesting case isn't a project that adopted the decomposition. It is a project that set out to remove it.

OpenGuardrails is that project. The title is _A Configurable, Unified, and Scalable Guardrails Platform_. The abstract describes a "Unified LLM-based Guard Architecture." The stated contribution is that a single model can do work that previously took a pipeline, and the paper is explicit about the systems it's improving on, criticising LlamaFirewall by name for depending on multi-model inference with the latency that implies.

Here is what they shipped, in their own summary of what the platform provides. The bullets are consecutive:

> A unified large model for both content-safety and model-manipulation detection.
>
> A separate lightweight NER/data-redaction pipeline for identifying and masking sensitive information.

They merged two of the jobs into one model, and the very next line says the third one is a separate pipeline. Section 3.3 confirms the scope precisely: "Both content-safety and model-manipulation detection are handled by the same LLM, unlike multi-model pipelines." Both. Not all three.

A team whose entire framing is unification, publishing under a title with the word in it, arguing against multi-model pipelines on latency grounds, still shipped a separate component for the data-protection job. Not because they overlooked it. It is contribution number two in their own list.

The other two layers aren't merged either. They are absent, with no topical control, no dialogue state, no schema validation anywhere in the paper. A platform that unified the field would have had to dissolve four seams. It dissolved one, kept one, and didn't attempt the remaining two.

That is what I mean by seams that wouldn't merge. It is the strongest evidence in this piece, and it amounts to one project, described by its authors, read by me. It isn't a proof. It is the best available answer to the objection that the layers are just a paper propagating, because a paper propagating doesn't survive a deliberate attempt to consolidate it under commercial pressure.

---

## Why four, and the case for three or five

Four is where the seams currently look stable, which isn't the same as a finding.

**The case for three is made by the evidence I just used.** OpenGuardrails merged Scan and Classify into a single model and shipped a working system with state-of-the-art benchmark results. If one model can do both jobs at production quality, the boundary between "pattern-match the text" and "classify the content" may be an implementation detail rather than a structural fact.

**The case for five is quieter and I find it harder to dismiss.** The input/output split inside Scan is real and documented in the tools themselves, which ship separate scanner sets on each side, with anonymisation on the way in pairing to de-anonymisation on the way out. That isn't one job applied twice, it's a stateful pair. And grounding, in the sense of checking whether an answer is entailed by the documents that were retrieved to support it, has almost nothing in common with pattern-matching for injection strings beyond both being things you do to text. I fold grounding into Scan because that's where it sits in my pipeline, which is a deployment fact rather than an argument.

Both cases rest on exactly the same missing evidence as my own count. Nobody has published a measurement of how much these layers overlap in what they catch. Without it, "four" is a reading of where two things overlap, and so is "three," and so is "five."

What I can say is that four has been stable for me across a year of the tools underneath it changing completely, and that the two alternatives above are the ones I would take seriously if someone made them properly. If you think it's three, the thing that would convince me is a system that merges Scan and Classify and doesn't quietly keep a redaction pipeline off to one side.

---

## Four layers on a budget of nothing

Everything above is about the tools and the lifecycle. This is about what I built out of them, and it's here to show you what the thing looks like rather than to argue that it's right.

The constraints explain every choice in it: modest hardware, no budget worth the name, and a preference for things that are free and stay free. Those pressures have nothing to do with whether the decomposition is correct, so nothing here is evidence for it. What it does answer is a narrower question, which is whether four-layer coverage is reachable when you can't buy anything. It is.

**Scan** runs Llama Prompt Guard 2 for injection detection, Presidio for personal data, and an NLI entailment check for grounding. Prompt Guard 2 comes in 86M and 22M variants, both trained for injection and jailbreak detection, with the smaller one cutting latency substantially at a real cost to multilingual coverage. Presidio is MIT-licensed, roughly eight years old, and separates detection from transformation cleanly, which matters more than it sounds when you want to log what was found without logging the thing itself. The grounding check treats retrieved context as premise and the answer as hypothesis, and flags what isn't entailed.

**Classify** runs Llama Guard, which as established performs poorly on the one large independent benchmark that includes it. I haven't moved yet, which is a decision made on switching cost and generalisation uncertainty rather than on the recall table, and reasonable people would move.

**Dialog** runs NeMo Guardrails. Colang rails don't always fire the way I expect, which is a field report rather than a documented defect, because I haven't reduced it to a reproducible case. The path I use instead is `self check input`, which is a predefined flow configured under `rails.input.flows` with its prompt supplied separately. NVIDIA documents it as a judge-model technique usable with either a separate model or the guarded one. It is a supported route, not a workaround.

**Structure** runs Guardrails AI with schema validation and targeted re-asks.

Two things about it matter more than the component list.

**It was assembled by de-bundling, not by shopping.** The Scan layer used to be a single all-in-one tool. That tool, Protect AI's LLM Guard, was archived on 9 July 2026 and is now read-only, following Palo Alto Networks' acquisition of Protect AI and the folding of its products into a commercial platform. Its documentation site still described the project as actively maintained and constantly improving after the repository itself had been archived, which is a good argument for reading repositories rather than docs sites.

Replacing it was undramatic. The all-in-one tool's anonymisation scanners wrapped Presidio underneath, and its factual-consistency scanner was an NLI job in a coat. Going direct removed a wrapper, not a capability. The layer outlived the tool because the layer was never the tool. If I had understood my architecture as "the thing LLM Guard does" rather than as a set of jobs, that archival notice would have been a migration. Instead it was an afternoon.

**Packaging decides more than benchmarks do.** Guardrails AI 0.5.15 and later pin `griffe` to a narrow range that conflicts with `openai-agents`, which requires a newer version. That is a documented issue and it's the sort of thing that decides deployments regardless of which tool has better recall. Palit and Woods (2025) found the same tension when they attempted a comparative evaluation and could only assess seven of thirteen tools, because six vendors declined to participate.

---

## Engineering realities

Three things I would tell someone assembling this, none of which is in a paper.

**Fail open, with your eyes open.** If the guard is unavailable, let the request through and log loudly rather than taking the application down with it. I hold this position because availability requirements usually dominate and because a hard dependency on four extra models is four new ways to have an outage. I want to name it as a position rather than a consensus, because it's genuinely contested and the counter-case is strong for high-risk surfaces. A fail-open content filter on a product used by children is a bad default and I wouldn't defend it.

**Ship in shadow first, and expect the false-positive rate to surprise you.** Huang et al. (2025) tested 1,123 prompts across three major platforms and found false-positive rates spanning 0.1% to 13.1%. The blocked-benign prompts were disproportionately code review and mathematics questions, because the filters couldn't distinguish benign technical vocabulary from exploit discussion. If you're building anything engineering-facing, that isn't an edge case, that's your traffic. The same study found one platform's input filters catching 53% of malicious prompts where others caught 91% to 92%, and role-play framing bypassing filters across every system tested.

Run every layer in log-only mode against real traffic, look at what it would have blocked, and promote to hard-block one layer at a time. This is the single piece of advice here I would defend hardest, and it's also the one that assumes you have real traffic to run against.

**Expect packaging to dictate deployment more than quality does.** The griffe conflict above is a small example of a large pattern. Model licence ceilings, VRAM footprints, whether something ships a streaming variant and whether it runs on CPU at an acceptable rate all decide more architectures than benchmark tables do. I haven't priced any of these models per request or per GPU hour, and I haven't found a source that does, so the most the evidence supports is narrower and still useful, which is that since size doesn't buy recall, the cheapest defensible configuration isn't obviously worse than the expensive one.

---

## What none of us have measured, and where to push

There is one measurement that would settle most of what this piece leaves open, and as far as I can determine nobody has published it.

**How much do the layers overlap in what they actually catch?**

Run real traffic through all four independently. Record what each one flags. Then look at the intersections. That single result would tell you whether the four-layer decomposition is minimal or padded, which is the question the case for three or five couldn't settle. It would also tell you whether layer failures are correlated, which is the assumption the whole composition argument rests on and which nothing above was able to verify. And it would tell you, for your specific traffic, which guard model to run, which is the question I started with and couldn't answer from the literature.

I don't have this measurement either. I haven't run it, and saying so is more useful than implying my stack settled a question it didn't.

A second thing is unresolved and I want it on the record rather than buried. I haven't found published evidence on how much of what the Scan layer catches would have been refused by a well-aligned model anyway. If the answer is "most of it," the case for that layer as a separate component weakens considerably. I looked, I didn't find it, and the one survey that seemed to address it was paywalled beyond the abstract, so I cut it rather than cite a paper I hadn't read.

And the advice this piece ends on has a real limit. "Measure it against your own traffic" is useless to someone who has no traffic yet, no shadow-mode logs, and no labelled data. That is most people building their first thing. I don't have a good answer for them beyond starting with the layers, running everything in log-only mode from the first day, and accepting that the first months of data are the asset. It isn't a satisfying answer and I would rather say that than dress it up.

So the four layers are offered as a proposal. The seams are visible in what the tools do and don't cover, several groups surveying the same ground published the same boundaries, and the one project that set out to dissolve them kept one as a separate pipeline in its own contribution list. Four is where this looks stable to me right now. The case for three is real, the case for five is real, and the measurement that would decide between them is one nobody has run.

If you have run it, I would genuinely like to see it. And if you think the count is wrong, the thing that would move me isn't an argument about taxonomy. It is a system that merges two of these and doesn't quietly keep the third off to one side.

---

## References

Amazon Web Services. (n.d.). _Create your guardrail_. Amazon Bedrock User Guide. Retrieved August 10, 2026, from https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-components.html

Dong, Y., Mu, R., Jin, G., Qi, Y., Hu, J., Zhao, X., Meng, J., Ruan, W., & Huang, X. (2024). Building guardrails for large language models. In _Proceedings of the 41st International Conference on Machine Learning_ (PMLR 235). https://doi.org/10.48550/arXiv.2402.01822

Geng, S., Cooper, H., Moskal, M., Jenkins, S., Berman, J., Ranchin, N., West, R., Horvitz, E., & Nori, H. (2025, January 18). _JSONSchemaBench: A rigorous benchmark of structured outputs for language models_ (arXiv:2501.10868). arXiv. https://doi.org/10.48550/arXiv.2501.10868

Guardrails AI. (n.d.). _Guards_. Guardrails AI documentation. Retrieved August 4, 2026, from https://www.guardrailsai.com/docs/api_reference_markdown/guards

Hackett, W., Birch, L., Trawicki, S., Suri, N., & Garraghan, P. (2025, April 15). _Bypassing LLM guardrails: An empirical analysis of evasion attacks against prompt injection and jailbreak detection systems_ (arXiv:2504.11168). arXiv. https://doi.org/10.48550/arXiv.2504.11168

Harsh, R. R., Sarmah, B., & Pasquali, S. (2026, April 10). _Benchmarking open-source safety guard models: A comprehensive evaluation_ (arXiv:2605.28830). arXiv. https://doi.org/10.48550/arXiv.2605.28830

Huang, Y., Bray, N., Rao, A., Ji, Y., & Hu, W. (2025, June 2). _How good are the LLM guardrails on the market? A comparative study on the effectiveness of LLM content filtering across major GenAI platforms_. Unit 42, Palo Alto Networks. https://unit42.paloaltonetworks.com/comparing-llm-guardrails-across-genai-platforms/

Inan, H., Upasani, K., Chi, J., Rungta, R., Iyer, K., Mao, Y., Tontchev, M., Hu, Q., Fuller, B., Testuggine, D., & Khabsa, M. (2023, December 7). _Llama Guard: LLM-based input-output safeguard for human-AI conversations_ (arXiv:2312.06674). arXiv. https://doi.org/10.48550/arXiv.2312.06674

Liu, H., Huang, H., Gu, X., Wang, H., & Wang, Y. (2024, October 14). _On calibration of LLM-based guard models for reliable content moderation_ (arXiv:2410.10414). arXiv. https://doi.org/10.48550/arXiv.2410.10414

Mangini, E. (2026, July 17). _Harness engineering: The devil is in your details_. https://emangini.com/blog/2026/harness_engineering

Meta. (n.d.). _Llama Prompt Guard 2 86M model card_. PurpleLlama. Retrieved August 10, 2026, from https://github.com/meta-llama/PurpleLlama/blob/main/Llama-Prompt-Guard-2/86M/MODEL_CARD.md

Microsoft. (n.d.). _Presidio: Data protection and de-identification SDK_ [Code repository]. GitHub. Retrieved August 10, 2026, from https://github.com/microsoft/presidio

NVIDIA. (n.d.). _Input rails_. NeMo Guardrails documentation. Retrieved August 4, 2026, from https://docs.nvidia.com/nemo/guardrails/latest/getting-started/4-input-rails/README.html

Padhi, I., Nagireddy, M., Cornacchia, G., Chaudhury, S., Pedapati, T., Dognin, P., Murugesan, K., Miehling, E., Santillán Cooper, M., Fraser, K., Zizzo, G., Hameed, M. Z., Purcell, M., Desmond, M., Pan, Q., Ashktorab, Z., Vejsbjerg, I., Daly, E. M., Hind, M., … Sattigeri, P. (2024, December 10). _Granite Guardian_ (arXiv:2412.07724). arXiv. https://doi.org/10.48550/arXiv.2412.07724

Palit, S., & Woods, D. (2025, May 19). _Evaluating the efficacy of LLM safety solutions: The Palit benchmark dataset_ (arXiv:2505.13028). arXiv. https://doi.org/10.48550/arXiv.2505.13028

Protect AI. (2026, July 9). _LLM Guard: The security toolkit for LLM interactions_ [Archived code repository]. GitHub. https://github.com/protectai/llm-guard

Qwen Team. (2025, October 16). _Qwen3Guard technical report_ (arXiv:2510.14276). arXiv. https://doi.org/10.48550/arXiv.2510.14276

Rebedea, T., Dinu, R., Sreedhar, M., Parisien, C., & Cohen, J. (2023, October 16). _NeMo Guardrails: A toolkit for controllable and safe LLM applications with programmable rails_ (arXiv:2310.10501). arXiv. https://doi.org/10.48550/arXiv.2310.10501

She, Y., Peterson, D. W., Liu, M. M., Upadhyay, V., Chaghazardi, M. H., Kang, E., & Roth, D. (2025, October 6). _RAG makes guardrails unsafe? Investigating robustness of guardrails under RAG-style contexts_ (arXiv:2510.05310). arXiv. https://doi.org/10.48550/arXiv.2510.05310

vLLM. (n.d.). _Structured outputs_. vLLM documentation. Retrieved August 12, 2026, from https://docs.vllm.ai/en/latest/features/structured_outputs.html

Wang, T., & Li, H. (2025, October 22). _OpenGuardrails: A configurable, unified, and scalable guardrails platform for large language models_ (arXiv:2510.19169). arXiv. https://doi.org/10.48550/arXiv.2510.19169

XGrammar. (n.d.). _XGrammar_ [Code repository]. GitHub. Retrieved August 12, 2026, from https://github.com/mlc-ai/xgrammar

Young, R. J. (2025, November 27). _Evaluating the robustness of large language model safety guardrails against adversarial attacks_ (arXiv:2511.22047). arXiv. https://doi.org/10.48550/arXiv.2511.22047

Zeng, W., Liu, Y., Mullins, R., Peran, L., Fernandez, J., Harkous, H., Narasimhan, K., Proud, D., Kumar, P., Radharapu, B., Sturman, O., & Wahltinez, O. (2024, July 31). _ShieldGemma: Generative AI content moderation based on Gemma_ (arXiv:2407.21772). arXiv. https://doi.org/10.48550/arXiv.2407.21772

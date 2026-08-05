# Research: Defense-in-Depth Guardrails — Four Complementary Layers for LLM Applications

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

### ⚠ MATERIAL CORRECTION TO THE SOURCE DRAFT — LLM Guard is archived

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

## References

Beurer-Kellner, L., Buesser, B., Creţu, A.-M., Debenedetti, E., Dobos, D., Fabian, D., Fischer, M., Froelicher, D., Grosse, K., Naeff, D., Ozoani, E., Paverd, A., Tramèr, F., & Volhejn, V. (2025, June 10). Design patterns for securing LLM agents against prompt injections (arXiv:2506.08837). arXiv. https://doi.org/10.48550/arXiv.2506.08837

Guardrails AI. (n.d.). Guards. Guardrails AI documentation. Retrieved August 4, 2026, from https://www.guardrailsai.com/docs/api_reference_markdown/guards

Huang, Y., Bray, N., Rao, A., Ji, Y., & Hu, W. (2025, June 2). How good are the LLM guardrails on the market? A comparative study on the effectiveness of LLM content filtering across major GenAI platforms. Unit 42, Palo Alto Networks. https://unit42.paloaltonetworks.com/comparing-llm-guardrails-across-genai-platforms/

Inan, H., Upasani, K., Chi, J., Rungta, R., Iyer, K., Mao, Y., Tontchev, M., Hu, Q., Fuller, B., Testuggine, D., & Khabsa, M. (2023, December 7). Llama Guard: LLM-based input-output safeguard for human-AI conversations (arXiv:2312.06674). arXiv. https://doi.org/10.48550/arXiv.2312.06674

Meta. (n.d.). Llama Guard 3-1B model card. PurpleLlama. Retrieved August 4, 2026, from https://github.com/meta-llama/PurpleLlama/blob/main/Llama-Guard3/1B/MODEL_CARD.md ⚠ model card is undated and versioned in place; the 1B variant shipped with Llama 3.2 in September 2024, but that date is not stated on the card itself

NVIDIA. (n.d.). Input rails. NeMo Guardrails documentation. Retrieved August 4, 2026, from https://docs.nvidia.com/nemo/guardrails/latest/getting-started/4-input-rails/README.html

OWASP. (2025). OWASP Top 10 for large language model applications 2025. OWASP Foundation. https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf

Palit, S., & Woods, D. (2025, May 19). Evaluating the efficacy of LLM safety solutions: The Palit benchmark dataset (arXiv:2505.13028). arXiv. https://doi.org/10.48550/arXiv.2505.13028

Protect AI. (2026, July 9). LLM Guard: The security toolkit for LLM interactions [Archived code repository]. GitHub. https://github.com/protectai/llm-guard ⚠ date given is the archival date, not the publication date; repository is read-only as of that date

Rebedea, T., Dinu, R., Sreedhar, M., Parisien, C., & Cohen, J. (2023, October 16). NeMo Guardrails: A toolkit for controllable and safe LLM applications with programmable rails (arXiv:2310.10501). arXiv. https://doi.org/10.48550/arXiv.2310.10501

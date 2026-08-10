# Research: Spec-Driven Delivery

## Question

Does the argument hold that **SDD should mean Spec-Driven _Delivery_, not Spec-Driven
_Development_** — because the practice extends both earlier (discovery, product definition)
and later (release, operations, outcomes) than the development phase?

Verdict from the sources: **yes, and the evidence is stronger than expected.** Every major
SDD tool and the one serious academic treatment all stop at or before "implementation is
done." Meanwhile the two most durable spec practices in the industry — Amazon's PR/FAQ and
"you build it, you run it" — sit on either side of that boundary. The gap the argument
names is real and documented.

---

## Findings

### 1. The term is young, contested, and already recycled — twice

**The 2004 meaning was different, and already abbreviated SDD.** Ostroff, Makalsky, and
Paige presented "Agile Specification-Driven Development" at XP 2004. Their abstract:

> "We present an agile approach to Specification-Driven Development, which combines features
> of Test-Driven Development and the plan-based approach of Design-by-Contract. We argue that
> both tests and contracts are different types of specifications."

Their scope was **narrower than today's** — pre/postconditions and class invariants in Eiffel,
purely code-level correctness. They used the initialism "SDD" in the paper.

This is the strongest available hook for a piece about the term: the 2025 AI-coding usage
recycled both the phrase _and_ the acronym from a 2004 formal-methods paper that meant
something else. Nobody renamed anything. The word was just picked up again.

**Evidence:** confirmed against the primary PDF (title page and abstract read directly), not
a secondary summary.

### 2. Five tools, five different upstream boundaries, one identical downstream wall

| Tool            | Phases                                                       | Reaches back to                                              | Stops at              |
| --------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | --------------------- |
| AWS Kiro        | Requirements → Design → Tasks                                | requirements                                                 | tasks executed        |
| Piskala (arXiv) | Specify → Plan → Implement → Validate                        | specification                                                | code matches spec     |
| OpenSpec        | explore → propose → apply → sync → archive                   | exploration                                                  | change archived       |
| GitHub Spec Kit | constitution → specify → plan → tasks → implement → converge | org constraints, compliance                                  | code assessed vs spec |
| BMAD-METHOD     | Analysis → Planning → Solutioning → Implementation           | **brainstorming, research reports, product briefs, PR/FAQs** | code + retrospective  |

**The asymmetry is the finding, not the wall itself.**

Upstream, the boundary is porous and clearly moving. Kiro starts at requirements; Spec Kit
reaches into organizational constraints and compliance; BMAD's Phase 1 produces brainstorms,
research reports, product briefs, and **PR/FAQs** — the exact Amazon artifact cited in Finding 3
as the "earlier" evidence. The upstream half of the argument is not contested. It is already
shipping.

Downstream, the wall is absolute. **Five for five, not one tool covers deployment, monitoring,
operations, runbooks, or post-release outcome measurement.** OpenSpec's `archive` looked like a
candidate — it merges delta specs into a primary spec representing "the system's actual state" —
but the docs place it after implementation and verification and explicitly **before any
operational work**. BMAD ends with retrospective reviews, which examine the process, not the
running system.

**This reframes the thesis.** The argument as stated is "earlier _and_ later." The evidence says
earlier is essentially won and later is universally absent. The sharper piece is about **why the
boundary is porous in one direction and rigid in the other** — and the answer is in the word.
"Development" has a natural upstream, because requirements have always been development's
business. It has no natural downstream: you cannot "develop" a system that is already running.

**BMAD also breaks the strongest objection to the thesis.** The counter-argument is that
"development" accurately describes what these tools do. BMAD does market-adjacent product work —
briefs, PR/FAQs, UX documents — while still calling itself _Breakthrough Method for Agile AI
Driven Development_. Here is a tool that has already outgrown the word upstream and kept it
anyway. That is direct evidence the label no longer tracks the practice, available in the
present tense rather than as a prediction.

⚠ All five are 2025–26 agentic coding tools. The pattern is strong within that category but it
is still one category. A non-AI-native counterexample would settle whether this is a fact about
the word or a fact about a young product segment.

### 3. Working Backwards specifies from the end state — development is the middle, not the origin

Amazon's **Working Backwards / PR-FAQ**: teams "write a press release and FAQ for the thing, as
if they're launching it today, **before they decide to do it at all**." The method requires
defining the ideal customer experience first, then developing the product to meet that vision.
If the press release does not excite a customer, the idea is reworked or killed before a single
engineer is assigned.

**The direction is the point, and it is easy to file this under the wrong heading.** PR/FAQ is
not "a spec that happens earlier." The artifact is a description of the **launched, operating
product as the customer experiences it** — the end state — and the specification is _derived
backwards from it_. Its origin is downstream of development. Its use is upstream of development.
Development is the "how" in between, subordinate to both ends.

That reframes Finding 2 considerably. The forward wall is not merely a missing phase at the end
of a pipeline. **It severs the spec from the thing that generates it.** A practice that stops at
"code matches spec" has cut off the end state that the spec was supposed to be reasoned back
from — leaving specification of the middle, by the middle, for the middle.

Incremental delivery does not weaken this. Under Lean Startup and similar models the "end state"
becomes a milestone or increment rather than a final launch, but the logic is unchanged: you
specify from the outcome backwards. An MVP is defined by what you intend to learn, not by what
you intend to build.

**This is a quality argument, not only a scope argument — and that is the stronger claim.** A
spec derived from a described end state has an anchor: every requirement can be checked against
"does this produce that press release." A spec written at the development boundary has nothing to
check against except itself. So SDD-as-development does not merely _cover less_ — it produces
_worse specs_, because it severed the thing that gives a spec its reference point. That also
explains the field's standing complaint that specs drift: drift is what happens to a
specification with no external referent.

Argue this rather than the coverage version wherever both are available. "You are missing a
phase" invites a shrug. "Your specs are unanchored, and here is why they drift" does not.

⚠ **Tension to resolve, not paper over.** Reasoning backwards from an end state is outcome
language, which is exactly the ground Yeret occupies with "goal-driven development" (Finding 5).
The stronger this framing gets, the more it has to answer why the answer is "Delivery" rather
than "outcome" or "goal."

**Sourcing:** the mechanic is well attested across multiple independent secondary sources and the
book citation is solid, but ⚠ **the primary text was not read.** Bryar and Carr were both Amazon
executives (Bryar was Bezos' technical advisor). Verify any direct quotation against the book
before publishing; the summaries agree on substance but the wording varies between them.

### 4. Specs demonstrably operate later than development

**Vogels, interviewed by Jim Gray (2006)**, names the full span in one sentence. ✅ **Verified**
— quote confirmed against a full-text mirror of the interview; venue, volume, issue, date and
DOI all resolved:

> "Each service has a team associated with it, and that team is completely responsible for the
> service — from scoping out the functionality, to architecting it, to building it, and
> operating it."

Note the span: _scoping → architecting → building → operating_. "Development" covers the
middle two. This quote is close to a ready-made spine for the article.

**Humble & Farley (2010)** made the same move at the level of naming: the book is _Continuous
Delivery_, not _Continuous Development_, and its subtitle extends explicitly through "Build,
Test, and Deployment Automation." The industry has already once chosen "delivery" over
"development" to signal a wider boundary — a direct precedent for the argument.

⚠ **Caveat:** I could not find Humble and Farley stating their terminological reasoning
explicitly. The book demonstrably covers the wider scope; whether they chose the word
"delivery" _for that reason_ is an inference. Present it as precedent, not as their stated
intent, or verify against the book's introduction.

### 5. A rival reframing already exists and must be engaged

**Yeret (2026, June 5)** argues the narrow reading of SDD is a misunderstanding — "requirements
theater," specs as handoff paperwork, "the wrong mental model." His alternative is not a wider
noun but a different one:

> "the way to shift AI activity to impact goes one step further beyond spec-driven development
> towards **goal-driven development**"

He also reframes specs as an abstraction layer: "the spec is becoming a higher-level
programming language," "the spec is the work humans maintain."

**Not a competitor — a different axis, and the two stack.** Yeret's move is _vertical_: specs
sit at the wrong altitude, climb to goals. The move here is _horizontal_: development is the
wrong span, extend the boundary. Neither subsumes the other.

The resolution is a two-layer model, and **"delivery" is the correct noun at both layers**:

| Layer         | Artifact | Question it answers | Character                                 |
| ------------- | -------- | ------------------- | ----------------------------------------- |
| **Strategic** | Goals    | What outcome, why   | Connects to Working Backwards (Finding 3) |
| **Tactical**  | Specs    | What is true, now   | Executable ground truth (Finding 7)       |

Goal-driven delivery is the strategic effort — it is the same reasoning-from-the-end-state that
PR/FAQ performs. Spec-driven delivery is the tactical layer beneath it, and its job is
**ground truth**. Both span product intent through operations. Neither is _development_.

**The move to make is not refutation.** Use Yeret's own premise to force the conclusion: if the
spec is genuinely "becoming a higher-level programming language" expressing human intent, and
intent is about outcomes, then the artifact necessarily reaches past code. Intent does not
terminate at "implementation complete." **Yeret climbed the altitude axis and left the span axis
untouched, so his conclusion outruns the noun he kept.** He is right, and his argument does not
stop where he stopped it.

Steelman to survive: _goals imply outcomes, outcomes live past release, so goal-driven implicitly
solves the span problem._ Answer: no — he kept "development." Naming the aim does not move the
boundary. Teams with crisp goals still throw code over the wall. The word that sets scope is the
second word, and he did not touch it.

**Positioning:** one strong section, placed _after_ the five-tool wall and the Amazon bracket
land. Lead with Yeret and the piece reads as a response post; lead with the evidence and he
arrives as convergent support.

⚠ I read a summarization of his post, not the full text. **Read it end to end before engaging in
print** — misrepresenting the one person you are arguing with is the expensive error.

⚠ Open: is "goal-driven development" already an established term with its own literature? If GDD
has prior art, Yeret is joining a conversation rather than opening one. Not checked.

**Footnote — where the disagreement actually sits.** Yeret and this thesis are saying the same
thing at different altitudes. He is not wrong about goals; he is **directing attention the wrong
way**. His corrective pulls focus back up toward strategy, and strategy is not where the deficit
is. The AI discourse is already saturated with intent, goals, abstraction and framing. What it is
starving for is the executable, checkable, driven-to-the-ground layer (Finding 7).

So the disagreement is not about whether goals matter. It is about **which direction the field
currently needs to be pulled** — and the answer is down, toward ground truth, not up toward more
strategy. That is the argument to make against him: right axis, wrong direction of travel, given
where the attention already is.

### 6. The critique already circulating attacks specs themselves — not their scope

✅ **Isoform, "The Limits of Spec-Driven Development" (November 25, 2025, author not named)** —
read directly. Four limits:

1. **Maintenance burden** — specs grow expensive to keep synchronized with code:
   "documentation debt disguised as engineering discipline."
2. **Missing context** — specs describe _what_ but not _why_; the assumptions and tradeoffs
   "only emerge during actual development."
3. **False confidence** — detailed specs create an "illusion of completeness" that discourages
   iteration, making development "brittle, waterfall-like."
4. **Wrong abstraction level** — tools fixate on schemas and field definitions rather than
   intent, producing "code that is structurally correct but misaligned with the actual intent."

Core claim: **"specs can never capture all the context they need."**

**Three of the four limits are symptoms of this thesis's diagnosis, not counter-evidence.**

- Limit 1 is what happens when a spec is _prose instead of executable_ (Finding 7). Prose drifts
  silently; an executable spec fails loudly. Adzic's living documentation exists precisely to
  solve this.
- Limit 2 is what happens when the spec is _severed from the end state_ (Finding 3). The "why"
  is the outcome. PR/FAQ captures it because it starts there.
- Limit 3 is what a spec bounded at development looks like: complete, because it never has to
  survive contact with operations.
- Limit 4 is Yeret's altitude point (Finding 5), arriving seven months earlier.

**But the core claim is more radical than the four limits, and it must be answered head-on.**
"Specs can never capture all the context they need" is an argument against specs _as an
instrument_, not against their scope. If it holds, widening the boundary yields a wider
inadequate artifact and the thesis is dead.

**The answer is in the executable framing.** The objection only bites if a spec is supposed to be
_complete_. An executable spec does not need completeness — it needs to be **checkable**. Tests
never capture all context either; nobody treats that as an argument against testing. **Ground
truth is not total truth.** Isoform is refuting an ambition — the spec as exhaustive
prose description — that the executable tradition never held.

That is also why they are right about current tools and wrong about specs: the 2025 tools _are_
attempting exhaustive prose, which is exactly the property the term lost after 2011.

**Discourse timeline** — the piece would enter a mature conversation, not open one:
Spec Kit / Kiro emerge 2025 → Isoform critique Nov 2025 → Yeret reframe June 2026 → this piece.

⚠ The related claim that "the bottleneck may no longer be coding but review, product judgment,
customer access, data quality, adoption, release safety, or decision-making" came from a **search
summary with unclear attribution**. Do not attribute it to Isoform or Yeret without tracing it.

### 7. "Executable specification" is the term's lost meaning — and the strongest card in the piece

The tactical layer needs a word for what makes a spec more than prose. That word already exists,
predates the AI era, and **the 2025 usage quietly dropped it.**

**The lineage runs backwards through every prior meaning of the term:**

- **2004 — Ostroff, Makalsky & Paige** (Finding 1). Their SDD was Design-by-Contract plus TDD:
  pre/postconditions, class invariants, executable tests. Contracts _run_. Their claim that
  "both tests and contracts are different types of specifications" is a claim about
  **executable** artifacts.
- **2011 — Adzic, _Specification by Example_.** Concrete examples used to "define, validate, and
  automate requirements as **executable specifications**," producing **living documentation that
  evolves with the software**. Jolt Award, 2012. Note the subtitle: _How Successful Teams
  **Deliver** the Right Software_ — the word is already there, in the canonical text on
  executable specs, fourteen years before this argument.
- **Formal methods** — VDM-SL and similar have executable subsets; a well-tested executable
  specification demonstrably benefits implementation. Deep roots, not a novelty.

**And then 2025.** Spec Kit specs are markdown. Kiro's requirements, design and tasks are
markdown. They are prose an LLM interprets — **not artifacts that run.** The AI-era usage
inherited the phrase "spec-driven" from traditions where the spec was executable, and made the
spec _less_ executable than either predecessor.

**This is the sharpest reversal available to the piece.** The complaint is usually that AI SDD is
too rigid, too waterfall, too much documentation up front. The evidence says the opposite: it is
too _vague_. It swapped a runnable artifact for a prose one and kept the name.

That is why "executable" carries real weight rather than being a flourish. It names what the
tactical layer is _for_ — **ground truth, driven to the ground** — against a discourse currently
heavy on intent, goals, abstraction and vibes, and light on anything that can be run and checked.
Execution is the missing half of the current AI conversation, and the spec is where it lands.

**It also closes the Finding 2 limitation, partly.** Adzic (2011) is a non-AI-native spec
practice, and its **living documentation persists past release** — a spec that keeps evolving
with the running system. So a pre-AI spec practice _did_ reach past the wall the five AI tools
stop at. The wall is a property of this product generation, not of specs.

⚠ **Sourcing.** Adzic's book details (title, subtitle, publisher, 2011, Jolt Award) are solid
across multiple sources, but **the primary text was not read**. A search summary also attributed
to "specification-driven development practice" the goal of "making intent durable — across tools,
across sessions, and across team members"; that phrasing appears to blend a 2018 Gauge blog post
with a separate SDD article and **should not be quoted or attributed to anyone** without
verifying which text it belongs to.

---

## Gaps

- **Spec Kit's release date is unresolved.** One secondary source says September 2024; the same
  source frames SDD as emerging in 2025, which is inconsistent. The GitHub repo does not state a
  founding date in its README. Resolve via the repository's release tags or first commit before
  making any claim about when SDD started.
- **`specdriven.com/origins`** looked directly on-topic (a page about the term's coinage) but
  returned **HTTP 403**. Worth retrieving another way — it may resolve the date question above.
- **Ostroff et al. page range unconfirmed.** The DOI and venue are solid; the exact pages in
  LNCS 3092 were not verified. Cite without pages rather than guess.
- ~~**Vogels interview citation unverified.**~~ **RESOLVED.** _ACM Queue_ 4(4), June 30 2006,
  DOI 10.1145/1142055.1142065, interviewed by Jim Gray. queue.acm.org and dl.acm.org both
  return 403 to automated fetches; confirmed instead against a full-text mirror that preserves
  the speaker labels ("JG = Jim Gray, WV = Werner Vogels"). Residual ⚠: Semantic Scholar
  indexes the piece under "O'Hanlon", so ACM's author-of-record may not be Gray even though
  Gray asks the questions.
- **Humble & Farley's stated rationale** for "delivery" — see caveat in Finding 4.
- **No source found that already proposes "Spec-Driven Delivery" by name.** Worth one more
  search before publishing: if someone has proposed it, the piece should credit them; if nobody
  has, that absence is itself worth stating.

---

## Decisions (2026-08-01 review)

Settled while walking the findings. These bind the draft.

- **Finding 1 opens the piece and then steps aside.** High value as structure, low value as
  evidence — it earns the right to question the term, but a 22-year-old formal-methods paper
  cannot be load-bearing. One paragraph, not a section. Use the inversion: the term keeps
  getting recycled _because nobody ever specified what it covers_.

- **Finding 2 is the spine, rebalanced toward the forward wall.** "Earlier and later" treats
  the two directions symmetrically; the evidence does not. Upstream is essentially won —
  BMAD already produces PR/FAQs. Downstream is absent in all five tools. The piece argues
  mainly about the forward wall and uses upstream drift as proof that the boundary moves
  whenever the word permits it.

- **State the single-category limitation explicitly in the piece.** All five tools are 2025–26
  agentic coding tools. Five-for-five is strong within one young product category, and no
  non-AI-native counterexample was found. Say so in the text rather than let a reader find it.

- **Pre-empt "the name is accurate" head-on.** BMAD does brainstorms, research reports,
  product briefs and PR/FAQs while calling itself _..Agile AI Driven Development_. The label
  already fails to describe the leading tool — present tense, documented, not a forecast.

- **Lead with the quality argument, not the coverage argument.** The strongest version of the
  thesis is not "SDD covers too little." It is "specs written from the middle are unanchored,
  and that is why they drift." Coverage invites a shrug; an unanchored-spec claim does not.
  Finding 3 supplies this.

- **Define "delivery" early — the word is polysemous in this exact audience.** Engineers hear
  Humble & Farley's _delivery_, which deliberately stops at deployable (the CD vs. Continuous
  Deployment line). Consultants and enterprise readers hear _delivery_ as the whole engagement:
  product intent through realized outcome, operations included. The thesis uses the second
  sense — product → inception → construction → operations, with development as the "how" in
  between. Since the entire argument is about where a boundary sits, the piece cannot leave the
  boundary of its own central noun ambiguous.

  The collision is usable material rather than a liability: _the industry already had a word
  for the span past development, and then narrowed it to mean deployment automation._

  ⚠ This partly retires the earlier objection that "delivery ends at handoff" — that objection
  holds against the CD sense only. Finding 4 should be re-read with this distinction in hand.

---

## Angle notes

The strongest structure the evidence supports:

1. **The term was borrowed twice** (2004 formal methods → 2025 AI coding), so treating it as
   settled vocabulary is a mistake to begin with.
2. **The tools prove the charge.** Three independent implementations, all stopping at
   implementation. This is documented, not asserted.
3. **Both extensions already exist in practice** — PR/FAQ upstream, "you build it, you run it"
   downstream — so "delivery" is not a coinage, it is a description of what mature teams already
   do with specs.
4. **The industry already made this exact swap once**, with Continuous Delivery.
5. **Answer Yeret**: is the wrong word "spec" or "development"? Arguably both fail differently —
   "goal-driven" solves the _aim_ problem while leaving the _span_ problem untouched.

This maps onto the four-phase lifecycle already in use in the Method AI-DLC material
(pre-inception → inception → construction → operations): every SDD tool surveyed lives entirely
inside _construction_. That framing is available and owned, though the piece works without it.

---

## References

DOIs pre-encoded. Verified against primary sources except where marked ⚠.

Humble, J., & Farley, D. (2010). _Continuous delivery: Reliable software releases through build, test, and deployment automation._ Addison-Wesley.

Isoform. (2025, November 25). _The limits of spec-driven development._ https://isoform.ai/blog/the-limits-of-spec-driven-development ⚠ no author byline on the piece; cite the organization

Kiro. (n.d.). _Specs._ Kiro documentation. Retrieved August 1, 2026, from https://kiro.dev/docs/specs/

Ostroff, J. S., Makalsky, D., & Paige, R. F. (2004). Agile specification-driven development. In _Extreme Programming and Agile Processes in Software Engineering (XP 2004)_, Lecture Notes in Computer Science, Vol. 3092. Springer. https://doi.org/10.1007/978-3-540-24853-8_12 ⚠ page range not confirmed; title, authors, affiliations and abstract verified against the author's open-access PDF at https://www.eecs.yorku.ca/~jonathan/publications/2004/xp2004.pdf

Piskala, D. B. (2026, January 30). _Spec-driven development: From code to contract in the age of AI coding assistants._ arXiv. https://arxiv.org/abs/2602.00180

Adzic, G. (2011). _Specification by example: How successful teams deliver the right software._ Manning. ⚠ primary text not read; concepts (executable specifications, living documentation) and 2012 Jolt Award attested across multiple sources

BMAD-METHOD. (n.d.). _Workflow map._ BMAD Method documentation. Retrieved August 1, 2026, from https://docs.bmad-method.org/reference/workflow-map/

Bryar, C., & Carr, B. (2021). _Working backwards: Insights, stories, and secrets from inside Amazon._ St. Martin's Press. ⚠ primary text not read; PR/FAQ mechanic attested across multiple independent secondary sources — verify any direct quotation before publishing

OpenSpec. (n.d.). _Workflows._ Fission-AI/OpenSpec. Retrieved August 1, 2026, from https://github.com/Fission-AI/OpenSpec/blob/main/docs/workflows.md

Spec Kit. (n.d.). _GitHub Spec Kit._ GitHub. Retrieved August 1, 2026, from https://github.com/github/spec-kit

Gray, J. (2006, June 30). A conversation with Werner Vogels: Learning from the Amazon technology platform. _ACM Queue, 4_(4). https://doi.org/10.1145/1142055.1142065 ⚠ Gray confirmed as interviewer from the interview transcript itself ("JG = Jim Gray, WV = Werner Vogels"); note Semantic Scholar indexes the piece under "O'Hanlon", so ACM's own author-of-record metadata may differ — check the DL listing if the byline matters

Yeret, Y. (2026, June 5). _Is spec-driven development a step forward or back?_ https://yuvalyeret.com/blog/is-spec-driven-development-a-step-forward-or-back-for-product-development/

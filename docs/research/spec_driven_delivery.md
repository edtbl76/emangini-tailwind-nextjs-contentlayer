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

### 2. Every major SDD tool stops at implementation — this is the core evidence

| Tool            | Phases                                                       | Stops at                   |
| --------------- | ------------------------------------------------------------ | -------------------------- |
| GitHub Spec Kit | constitution → specify → plan → tasks → implement → converge | code assessed against spec |
| AWS Kiro        | Requirements → Design → Tasks                                | tasks executed             |
| Piskala (arXiv) | Specify → Plan → Implement → Validate                        | code matches spec          |

Kiro's documentation is explicit: the workflow "does not extend past implementation," with no
deployment, monitoring, or operational phase. Spec Kit reaches slightly further backward
(`/speckit.constitution` encodes organizational constraints and compliance; `/speckit.clarify`
does discovery-ish work) but forward it ends at `converge` — assessing code against the spec.

**The pattern is consistent and it is exactly the shape of the argument.** The word
"development" is not an accident of naming; it accurately describes where every one of these
tools stops. That makes the case _against_ the tools' scope, not merely against their label —
worth being precise about which claim is being made.

### 3. Specs demonstrably operate earlier than development

Amazon's **Working Backwards / PR-FAQ**: a press release and FAQ written _before_ any code,
explicitly "before writing specifications or defining requirements." It is a specification of
customer outcome that gates whether engineering is assigned at all. If the press release does
not excite a customer, the idea is reworked or killed before a single engineer is assigned.

This is a spec doing its most valuable work _upstream of development entirely_ — the earlier
extension the argument needs.

### 4. Specs demonstrably operate later than development

**Vogels (2006)**, the "you build it, you run it" interview, names the full span in one
sentence:

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

**This is the most serious competitor to the thesis and the piece is weaker if it ignores it.**
Yeret keeps "development" and changes "spec"; the argument here keeps "spec" and changes
"development." They diagnose the same problem — SDD aimed too low — and disagree about which
word is wrong. Engaging that directly would be the strongest section in the piece.

### 6. The scope critique is already circulating

Critics argue SDD is too narrowly focused on coding, noting the bottleneck may no longer be
coding but "review, product judgment, customer access, data quality, adoption, release safety,
or decision-making." Isoform's "The Limits of Spec-Driven Development" argues static artifacts
cannot hold the necessary context regardless of precision.

⚠ These are secondary characterizations from search summaries. **Read the Isoform piece
directly before citing it** — a claim about someone's argument should come from their text.

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
- **Vogels interview citation unverified.** The quote is well attested across multiple secondary
  sources, but ACM Queue returned 403, so volume/issue and the canonical URL are unconfirmed.
- **Humble & Farley's stated rationale** for "delivery" — see caveat in Finding 4.
- **No source found that already proposes "Spec-Driven Delivery" by name.** Worth one more
  search before publishing: if someone has proposed it, the piece should credit them; if nobody
  has, that absence is itself worth stating.

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

Kiro. (n.d.). _Specs._ Kiro documentation. Retrieved August 1, 2026, from https://kiro.dev/docs/specs/

Ostroff, J. S., Makalsky, D., & Paige, R. F. (2004). Agile specification-driven development. In _Extreme Programming and Agile Processes in Software Engineering (XP 2004)_, Lecture Notes in Computer Science, Vol. 3092. Springer. https://doi.org/10.1007/978-3-540-24853-8_12 ⚠ page range not confirmed; title, authors, affiliations and abstract verified against the author's open-access PDF at https://www.eecs.yorku.ca/~jonathan/publications/2004/xp2004.pdf

Piskala, D. B. (2026, January 30). _Spec-driven development: From code to contract in the age of AI coding assistants._ arXiv. https://arxiv.org/abs/2602.00180

Spec Kit. (n.d.). _GitHub Spec Kit._ GitHub. Retrieved August 1, 2026, from https://github.com/github/spec-kit

Vogels, W., & Gray, J. (2006). A conversation with Werner Vogels. _ACM Queue, 4_(4). ⚠ quote well attested across secondary sources; volume/issue and canonical URL not confirmed — queue.acm.org returned 403

Yeret, Y. (2026, June 5). _Is spec-driven development a step forward or back?_ https://yuvalyeret.com/blog/is-spec-driven-development-a-step-forward-or-back-for-product-development/

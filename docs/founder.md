# Why I built Iris

> *Lewis Burgess, in his own words. This page is personal, not institutional.*

I'm disabled. Most days, that means I have a small budget of clear-headed
time and a long list of things institutions want me to prove about myself.

The pattern that exhausted me was simple: a person — usually a stranger,
usually with no context for my actual life — would put my circumstances into
a system, and the system would produce a decision about me. If I disagreed,
I had to ask the same system to look at me again. The harder the day, the
worse the appeal I could write.

I registered the **Burgess Principle** ([UK certification mark
UK00004343685](https://github.com/ljbudgie/burgess-principle)) as a
mark that says, plainly: *every decision made about a person should have
had a human judicial mind applied to the specific facts of that specific
case.* It's not a slogan. It's a practical test you can apply to any
automated decision you receive.

Iris is the consumer-facing tool that makes that principle pocket-sized.
On a hard day, you don't have the energy to write a calm, factual,
correctly-cited letter to a council, the DWP, an HMO landlord, your
school's SEND lead, or a tribunal. Iris does that with you, in your own
words, while keeping the personal facts on your device by default.

A few specific design choices come straight from lived experience:

- **Local-first by default.** I don't want a cloud company to hold the
  story of my disability. `IRIS_LOCAL_ONLY=1` is the default; the smart
  router is forbidden from selecting cloud-only models when it's on; the
  preflight banner makes the promise auditable.
- **PersonGate visible.** The chip that says *"PersonGate active"* exists
  because guardrails that you can't see don't feel like guardrails.
- **Calm mode.** When I'm having a bad pain day, animation makes me sicker.
  Iris honours `prefers-reduced-motion`, detects low battery and save-data,
  and offers a manual Calm mode in ⌘K.
- **"Reasonable adjustment refused"** is a top-level intake category, not
  a footnote. It's the thing I ask Iris about most.

Iris is also **not legal advice**, and I'm not going to pretend otherwise
([read the disclaimer](../DISCLAIMER.md)). What it is, is a calm helper for
the moment between *they did this to me* and *here is what I am asking
them to do about it*.

If something Iris does conflicts with that goal, please open an issue. The
[master vision](../iris-master-vision.md) is the single source of truth and
every change to this repo should advance it.

— Lewis Burgess

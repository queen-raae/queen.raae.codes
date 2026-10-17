---
title: "The insight layer your SaaS is missing"
tags: AI, SaaS, MCP, AX, agent-operations
brands: Outseta, Userlist
peeps: benediktdeicke
---

An agent wants to know which onboarding emails aren't landing. Right now it downloads everything, reads through it all, figures out the patterns. Every time. For every user, every session. That's expensive, slow, and wasteful.

What if the SaaS provider did that work once?

> "If we as service providers can provide a layer on top of our content with some vector search and some thematic extraction — we run a little AI on our side that could pull out themes."
> <cite>🎧 Me on [Slow & Steady 236@36:16 (February 2026)](https://slowandsteadypodcast.com/236?#t=36:16) ↓</cite>

<iframe width="100%" height="180" frameborder="no" scrolling="no" seamless="" src="https://share.transistor.fm/e/0ec939c2?#t=36:16"></iframe>

Pre-process the data. Extract themes, compute scores, build embeddings. The agent asks for themes first, then drills into the specific content it needs. Two steps instead of downloading the whole archive every time.

## I did this with podcast transcripts

I've built exactly this for the Slow & Steady podcast. Raw transcripts go in, and out comes a structured knowledge base: ideas extracted, stories tagged, quotable moments indexed by theme. When I ask Jean-Claude (my Claude Code instance) "what should I blog about?", it doesn't read through 236 episodes of raw audio transcripts. It searches the processed knowledge base, finds the themes, then pulls the specific quotes it needs to give me ideas.

(Sidenote: if you want this for your podcast, [drop me a line](mailto:queen@raae.codes?subject=Podcast%20pipeline).)

## Now imagine this for your SaaS

So I pitched Benedikt, my-cohost and the founder of [Userlist](https://userlist.com/?via=queen), on doing something similar for their users' emails. Their MCP server can do CRUD: list users, get a broadcast, create a campaign. But what if it could also answer "which onboarding emails aren't landing?" or "what should my next broadcast be about?" without the agent doing all the analysis itself? Pre-process the engagement data, and the agent gets the answer in one call.

At [Outseta](https://outseta.com?via=queen) we're in the same spot. Our MCP MVP mirrors the API. Fine for basic operations. But the questions we actually want agents to answer aren't CRUD:

"Which customers are at risk?" — that needs a computed score, not a list endpoint.
"What topics drive conversions?" — that needs pattern analysis across email and billing data.
"Where are users getting stuck?" — that needs theme extraction from support tickets.

If we pre-process this, build the insights on our side so the agent gets patterns instead of spending tokens discovering them every time, I think we'll be even more valuable to our customers. And their agents.

## Agents and humans, same insights

But while we are at it, let's not limit insights to the agent layer. Build the insight layer into your product and expose it through the UI, API, MCP, CLI, whatever comes next.

The interface changes. The insights stay.

At Outseta we have billing, email, support, CRM all in one place. A [system of record](/2026-03-07-outseta-a-system-of-record/) so to speak. Now the question is: what insights do we build on top of it?

The smartest API is the one that already did the thinking.

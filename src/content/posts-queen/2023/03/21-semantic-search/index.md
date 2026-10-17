---
title: OpenAI-powered Semantic Search for Prune your Follows?
brands: Xata, OpenAi
tags: ai, search
peeps: swizec
projects: Search Demo
---

This weekend I explored Semantic Search using OpenAI and Vector Search from Xata to see if it could be something for Prune your Follows.

To understand the difference better, I created a demo comparing it to the other two search options Xata provides: full-text search with fuzzy matching and partial plaintext search using "contains".

Searching for "norway" all three gives us results for accounts mentioning "norway" in some way:

![A search for "norway" gives results for all three types of search](./norway.png)

However, when searching for "norwegians" we can see where Semantic Search shines. @nynorskdama does not mention "norwegian" or "norway", but semantically "norsk" is the same as "norwegian" in Norwegian 🤯

![A search for "norwegians" gives results for all but plaintext type of search](./norwegians.png)

It might also know that "Ulsteinvik" is geography part of Norway and thus semantically close to "norwegians" as is the case when searching for "valdres" - a location in Norway and it gives us accounts located other places in Norway:

![A search for "valdres" gives results only for semantic stype of search](./valdres.png)

For a great rundown of how to get started and the article I used to kick start my journey, check out [Swizec](https://twitter.com/Swizec)'s [Build semantic search in an afternoon? Yep 🤯](https://swizec.com/blog/build-semantic-search-in-an-afternoon-yep/) even if it took me longer than an afternoon 😬

The next step is to use what I have learned to explore [a similar accounts feature](/2023-03-25-similar-accounts/) for Prune your Follows on this week's [unauthorized and rum-fueled treasure hunt](https://www.youtube.com/live/PmbSFeDzg0U).

&nbsp;

All the best,\
Queen Raae

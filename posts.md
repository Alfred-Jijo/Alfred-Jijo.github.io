---
layout: default
title: Posts
permalink: /posts/
---

# Posts

Thoughts on systems programming, C, and software design any other random topics.

<ul>
{% for post in site.posts %}
  <li>
    <a href="{{ post.url | relative_url }}" style="font-weight: bold; font-size: 1.1rem;">{{ post.title }}</a> 
    <br>
    <span style="color: var(--ctp-overlay1); font-size: 0.9rem;">{{ post.date | date: "%B %d, %Y" }}</span>
  </li>
  <hr style="border: 0; border-top: 1px solid var(--ctp-surface0); margin: 1rem 0;">
{% endfor %}
</ul>

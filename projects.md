---
layout: default
title: Projects
permalink: /projects/
---

# Projects

Here is a collection of systems I have built, mostly in C of course

<div class="project-grid">
{% for project in site.projects %}
  <a class="card" href="{{ project.url | relative_url }}">
    <div class="card-header">
      <h3>{{ project.title }}</h3>
      <span class="arrow">↗</span>
    </div>
    <p>{{ project.description }}</p>
  </a>
{% endfor %}
</div>

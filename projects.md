---
layout: directory
title: Projects
description: A collection of systems I have built, mostly in C of course.
permalink: /projects/
---

{% for project in site.projects %}
- [**{{ project.title }}**<br>{{ project.description }}]({{ project.url | relative_url }})
{% endfor %}

- [**GitHub**<br>Check out my other repos](https://github.com/Alfred-Jijo)
- [**GitLab**<br>Check out my other other repos](https://gitlab.com/Alfred-Jijo)
- [**Codeberg**<br>Mirrors and other stuff](https://codeberg.org/Alfred-Jijo)

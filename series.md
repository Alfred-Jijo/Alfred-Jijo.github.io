---
layout: default
title: Series
permalink: /series/
---

# Series

{% assign all_series = site.posts | map: "series" | compact | uniq | sort %}

{% if all_series.size > 0 %}
  {% for series_name in all_series %}
  {% assign series_slug = series_name | slugify %}
  {% assign series_posts = site.posts | where: "series", series_name | sort: "series_part" %}

<a href="{{ '/series/' | append: series_slug | relative_url }}" class="card">
  <div class="card-header">
    <h3>{{ series_name }}</h3>
    <span class="arrow">↗</span>
  </div>
  <p>{{ series_posts.size }} posts</p>
</a>

  {% endfor %}
{% else %}
<p style="color: var(--ctp-overlay1); font-style: italic;">No series yet.</p>
{% endif %}
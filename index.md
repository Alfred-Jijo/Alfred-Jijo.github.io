---
layout: default
title: Home
custom_css:
  - /assets/home.css
custom_js:
  - /assets/home.js
---

<div class="home-grid">

  <!-- LEFT COLUMN -->
  <div class="home-left">

    <!-- About Card -->
    <div class="home-card about-card">
      <div class="about-header">
        <img src="{{ '/assets/web_pfp.jpg' | relative_url }}" alt="Alfred Jijo" class="profile-img">
        <div class="about-text">
          <h2>Alfred Jijo</h2>
          <p>
            Hi! I'm a software engineering student at Liverpool John Moores University,
            passionate about building robust systems and exploring low-level systems programming.
          </p>
          <a href="{{ '/assets/ALFRED_JIJO_SWE_2026_.pdf' | relative_url }}" target="_blank" class="btn-primary">
            View My CV / Resume
          </a>
        </div>
      </div>
    </div>

    <!-- Latest Posts Card -->
    <div class="home-card posts-card">
      <div class="posts-header">
        <h2>Latest Posts</h2>
        <a href="{{ '/posts/' | relative_url }}" class="view-all-link">View all →</a>
      </div>
      <ul class="posts-list">
        {% for post in site.posts limit:12 %}
        <li class="post-item">
          <a href="{{ post.url | relative_url }}" class="post-title">{{ post.title }}</a>
          <span class="post-date">{{ post.date | date: "%b %d, %Y" }}</span>
        </li>
        {% else %}
        <li class="post-item" style="color: var(--ctp-overlay1); font-style: italic;">No posts yet — check back soon.</li>
        {% endfor %}
      </ul>
    </div>

  </div>

  <!-- RIGHT COLUMN -->
  <div class="home-right">

    <a href="{{ '/docs/' | relative_url }}" class="home-card link-card">
      <div class="link-card-inner">
        <div><h3>Docs</h3><p>Notes, guides and documentation</p></div>
        <span class="arrow">↗</span>
      </div>
    </a>

    <a href="{{ '/contact/' | relative_url }}" class="home-card link-card">
      <div class="link-card-inner">
        <div><h3>Contact</h3><p>Get in touch with me</p></div>
        <span class="arrow">↗</span>
      </div>
    </a>

    <div class="home-card carousel-card">
      <div class="posts-header">
        <h3>Projects</h3>
        <a href="{{ '/projects/' | relative_url }}" class="view-all-link">View all →</a>
      </div>
      <div class="carousel-wrapper">
        <button class="carousel-btn carousel-prev" aria-label="Previous">‹</button>
        <div class="carousel-track-container">
          <div class="carousel-track" id="carousel-track">
            {% for project in site.projects limit:6 %}
            <a href="{{ project.url | relative_url }}" class="carousel-item">
              <span class="carousel-item-title">{{ project.title }}</span>
              <span class="carousel-item-desc">{{ project.description }}</span>
            </a>
            {% else %}
            <a href="https://github.com/Alfred-Jijo" target="_blank" class="carousel-item">
              <span class="carousel-item-title">GitHub</span>
              <span class="carousel-item-desc">Check out my repos</span>
            </a>
            <a href="https://gitlab.com/Alfred-Jijo" target="_blank" class="carousel-item">
              <span class="carousel-item-title">GitLab</span>
              <span class="carousel-item-desc">More repos here</span>
            </a>
            <a href="https://codeberg.org/Alfred-Jijo" target="_blank" class="carousel-item">
              <span class="carousel-item-title">Codeberg</span>
              <span class="carousel-item-desc">Mirrors and other stuff</span>
            </a>
            {% endfor %}
          </div>
        </div>
        <button class="carousel-btn carousel-next" aria-label="Next">›</button>
      </div>
    </div>

    <a href="{{ '/stuff/' | relative_url }}" class="home-card link-card">
      <div class="link-card-inner">
        <div><h3>Stuff</h3><p>Miscellaneous things</p></div>
        <span class="arrow">↗</span>
      </div>
    </a>

  </div>
</div>
---
layout: default
title: Home
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
            <span>📄</span> View My CV / Resume
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
        {% for post in site.posts limit:5 %}
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

    <!-- Docs Card -->
    <a href="{{ '/docs/' | relative_url }}" class="home-card link-card">
      <div class="link-card-inner">
        <span class="link-card-icon"></span>
        <div>
          <h3>Docs</h3>
          <p>Notes, guides and documentation</p>
        </div>
        <span class="arrow">↗</span>
      </div>
    </a>

    <!-- Contact Card -->
    <a href="{{ '/contact/' | relative_url }}" class="home-card link-card">
      <div class="link-card-inner">
        <span class="link-card-icon">✉️</span>
        <div>
          <h3>Contact</h3>
          <p>Get in touch with me</p>
        </div>
        <span class="arrow">↗</span>
      </div>
    </a>

    <!-- Projects Carousel -->
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

    <!-- Etc / Stuff Card -->
    <a href="{{ '/stuff/' | relative_url }}" class="home-card link-card">
      <div class="link-card-inner">
        <span class="link-card-icon"></span>
        <div>
          <h3>Stuff</h3>
          <p>Miscellaneous things</p>
        </div>
        <span class="arrow">↗</span>
      </div>
    </a>

  </div>
</div>

<style>
  /* ---- TWO-COLUMN HOME GRID ---- */
  .home-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 1.5rem;
    align-items: start;
  }

  .home-left,
  .home-right {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* ---- SHARED CARD BASE ---- */
  .home-card {
    background-color: var(--ctp-surface0);
    border: 1px solid var(--ctp-surface1);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    transition: border-color 0.2s;
  }

  .home-card h2,
  .home-card h3 {
    margin-bottom: 0.25rem;
  }

  /* ---- ABOUT CARD ---- */
  .about-card .about-header {
    display: flex;
    gap: 1.25rem;
    align-items: flex-start;
    margin-bottom: 0;
  }

  .about-card .about-text p {
    color: var(--ctp-subtext0);
    margin-bottom: 1rem;
  }

  /* ---- POSTS CARD ---- */
  .posts-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .posts-header h2,
  .posts-header h3 {
    margin: 0;
  }

  .view-all-link {
    font-size: 0.9rem;
    color: var(--ctp-blue);
    text-decoration: none;
    font-weight: 600;
  }

  .view-all-link:hover {
    color: var(--ctp-sky);
    text-decoration: none;
  }

  .posts-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .post-item {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--ctp-surface1);
    gap: 1rem;
    margin-bottom: 0;
  }

  .post-item:last-child {
    border-bottom: none;
  }

  .post-title {
    color: var(--ctp-text);
    font-weight: 600;
    font-size: 0.95rem;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .post-title:hover {
    color: var(--ctp-blue);
    text-decoration: none;
  }

  .post-date {
    color: var(--ctp-overlay1);
    font-size: 0.8rem;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ---- LINK CARDS (Docs, Contact, Etc) ---- */
  .link-card {
    display: block;
    text-decoration: none;
    color: inherit;
  }

  .link-card:hover {
    border-color: var(--ctp-mauve);
    text-decoration: none;
  }

  .link-card-inner {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .link-card-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .link-card-inner div {
    flex: 1;
  }

  .link-card-inner h3 {
    margin: 0 0 0.15rem 0;
    color: var(--ctp-lavender);
  }

  .link-card-inner p {
    margin: 0;
    font-size: 0.85rem;
    color: var(--ctp-subtext0);
  }

  .link-card .arrow {
    color: var(--ctp-overlay1);
    font-size: 1.1rem;
    font-weight: bold;
    transition: transform 0.2s, color 0.2s;
  }

  .link-card:hover .arrow {
    color: var(--ctp-mauve);
    transform: translate(2px, -2px);
  }

  /* ---- CAROUSEL ---- */
  .carousel-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .carousel-track-container {
    flex: 1;
    overflow: hidden;
  }

  .carousel-track {
    display: flex;
    gap: 0.75rem;
    transition: transform 0.3s ease;
  }

  .carousel-item {
    min-width: 140px;
    flex-shrink: 0;
    background: var(--ctp-surface1);
    border: 1px solid var(--ctp-surface2);
    border-radius: var(--radius-base);
    padding: 0.85rem 1rem;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    transition: border-color 0.2s, transform 0.2s;
  }

  .carousel-item:hover {
    border-color: var(--ctp-blue);
    transform: translateY(-2px);
    text-decoration: none;
  }

  .carousel-item-title {
    color: var(--ctp-text);
    font-weight: 700;
    font-size: 0.9rem;
  }

  .carousel-item-desc {
    color: var(--ctp-subtext0);
    font-size: 0.78rem;
    line-height: 1.3;
  }

  .carousel-btn {
    background: var(--ctp-surface1);
    border: 1px solid var(--ctp-surface2);
    color: var(--ctp-text);
    border-radius: 50%;
    width: 28px;
    height: 28px;
    cursor: pointer;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s, border-color 0.2s;
    padding: 0;
    line-height: 1;
  }

  .carousel-btn:hover {
    background: var(--ctp-surface2);
    border-color: var(--ctp-blue);
  }

  /* ---- RESPONSIVE ---- */
  @media (max-width: 720px) {
    .home-grid {
      grid-template-columns: 1fr;
    }

    .about-card .about-header {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
  }
</style>

<script>
  (function () {
    const track = document.getElementById('carousel-track');
    if (!track) return;

    const prev = document.querySelector('.carousel-prev');
    const next = document.querySelector('.carousel-next');
    let index = 0;

    function getItemWidth() {
      const item = track.querySelector('.carousel-item');
      if (!item) return 0;
      return item.offsetWidth + 12; // gap
    }

    function getVisible() {
      return Math.floor(track.parentElement.offsetWidth / getItemWidth()) || 1;
    }

    function totalItems() {
      return track.querySelectorAll('.carousel-item').length;
    }

    function update() {
      const w = getItemWidth();
      track.style.transform = `translateX(-${index * w}px)`;
    }

    next && next.addEventListener('click', () => {
      const max = Math.max(0, totalItems() - getVisible());
      index = Math.min(index + 1, max);
      update();
    });

    prev && prev.addEventListener('click', () => {
      index = Math.max(index - 1, 0);
      update();
    });
  })();
</script>
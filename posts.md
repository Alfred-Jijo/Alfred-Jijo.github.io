---
layout: default
title: Posts
permalink: /posts/
---

# Posts

Thoughts on systems programming, C, and software design any other random topics.

<!-- Search Container -->
<div class="search-container">
    <input type="text" id="search-input" class="search-input" placeholder="Search titles or content..." autocomplete="off">
</div>

<!-- Original List (Hidden when searching) -->
<ul id="post-list">
{% for post in site.posts %}
  <li>
    <a href="{{ post.url | relative_url }}" style="font-weight: bold; font-size: 1.1rem;">{{ post.title }}</a> 
    <br>
    <span style="color: var(--ctp-overlay1); font-size: 0.9rem;">{{ post.date | date: "%B %d, %Y" }}</span>
  </li>
  <hr style="border: 0; border-top: 1px solid var(--ctp-surface0); margin: 1rem 0;">
{% endfor %}
</ul>

<!-- Search Results (Hidden by default) -->
<ul id="search-results" style="display: none;"></ul>

<!-- Lightweight Search Script -->
<script>
  let posts = [];

  // Fetch the JSON index once
  fetch('{{ "/search.json" | relative_url }}')
    .then(response => response.json())
    .then(data => {
      posts = data;
    })
    .catch(error => console.error('Error loading search index:', error));

  const searchInput = document.getElementById('search-input');
  const postList = document.getElementById('post-list');
  const searchResults = document.getElementById('search-results');

  // Listen for typing
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();

    // If input is empty, show original list, hide results
    if (term.trim() === '') {
      postList.style.display = 'block';
      searchResults.style.display = 'none';
      searchResults.innerHTML = '';
      return;
    }

    // Filter posts
    const results = posts.filter(post => 
      post.title.toLowerCase().includes(term) || 
      post.content.toLowerCase().includes(term)
    );

    // Render results
    if (results.length > 0) {
      postList.style.display = 'none';
      searchResults.style.display = 'block';
      
      searchResults.innerHTML = results.map(post => `
        <li>
          <a href="${post.url}" style="font-weight: bold; font-size: 1.1rem;">${post.title}</a> 
          <br>
          <span style="color: var(--ctp-overlay1); font-size: 0.9rem;">${post.date}</span>
        </li>
        <hr style="border: 0; border-top: 1px solid var(--ctp-surface0); margin: 1rem 0;">
      `).join('');
    } else {
      postList.style.display = 'none';
      searchResults.style.display = 'block';
      searchResults.innerHTML = '<li style="color: var(--ctp-subtext0); font-style: italic;">No matches found.</li>';
    }
  });
</script>

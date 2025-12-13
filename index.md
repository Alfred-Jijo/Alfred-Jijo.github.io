---
layout: default
title: Home
---

# Welcome to My Portfolio

<!-- ABOUT SECTION WITH PROFILE PICTURE -->
<div class="about-header">
  <!-- <img src="{{ '/assets/web_pfp.jpg' | relative_url }}" alt="Alfred Jijo" class="profile-img"> -->
  <div>
    <h2>About Me</h2>
    <p>
      Hi! I'm a software engineering student at Liverpool John Moores University, 
      passionate about building robust systems and exploring low-level systems programming.
    </p>
    
    <!-- RESUME BUTTON -->
    <a href="{{ '/assets/Alfred_Jijo_Software_Engineer_2025_CV.pdf' | relative_url }}" target="_blank" class="btn-primary" style="margin-top: 0.5rem;">
      <span>📄</span> View My Resume
    </a>
  </div>
</div>

## Featured Projects

###### NOTE:Project Cards are not Finished

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

## Recent Posts

<ul>
{% for post in site.posts limit:3 %}
  <li>
    <a href="{{ post.url | relative_url }}">{{ post.title }}</a> 
    <span style="color: var(--ctp-overlay1)">- {{ post.date | date: "%B %d, %Y" }}</span>
  </li>
{% endfor %}
</ul>

## Contact
Feel free to reach out via [GitHub](https://github.com/Alfred-Jijo), [LinkedIn](https://linkedin.com/in/alfredjijo06), or [Email](mailto:alfredjijo06@gmail.com).

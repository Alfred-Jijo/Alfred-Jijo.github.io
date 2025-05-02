// main.js

// Load the marked library
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

async function loadBlogPost(fileName) {
    try {
        const response = await fetch(`src/blog/posts/${fileName}.md`);
        const markdown = await response.text();
        const htmlContent = marked.parse(markdown);
        return htmlContent;
    } catch (error) {
        console.error('Error loading blog post:', error);
        return '<p>Error loading blog post</p>';
    }
}

// Initialize blog posts when the page loads
async function initializeBlog() {
    const blogContainer = document.getElementById('blog-container');
    if (blogContainer) {
        const content = await loadBlogPost('first-post');
        blogContainer.innerHTML = content;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Add interactivity and dynamic content here

    const githubLink = document.querySelector('#github-link');
    if (githubLink) {
        githubLink.addEventListener('click', () => {
            window.open('https://github.com/your-github-username', '_blank');
        });
    }

    initializeBlog();
});
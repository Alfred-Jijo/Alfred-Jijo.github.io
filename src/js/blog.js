async function loadBlogPosts() {
    try {
        const response = await fetch('../data/blog-posts.json');
        const posts = await response.json();
        const blogContainer = document.getElementById('blog-posts');
        
        posts.forEach(post => {
            const postElement = `
                <article class="border-b border-gray-200 pb-6">
                    <h3 class="text-xl font-semibold mb-2">${post.title}</h3>
                    <p class="text-gray-600 text-sm mb-2">${new Date(post.date).toLocaleDateString()}</p>
                    <p class="text-gray-700 mb-4">${post.excerpt}</p>
                    <a href="${post.url}" class="text-blue-500 hover:text-blue-700">Read more →</a>
                </article>
            `;
            blogContainer.innerHTML += postElement;
        });
    } catch (error) {
        console.error('Error loading blog posts:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadBlogPosts);
let currentSlide = 0;

async function loadProjects() {
    try {
        const response = await fetch('../data/projects.json');
        const data = await response.json();
        const container = document.getElementById('carousel-container');

        data.projects.forEach(project => {
            const projectElement = `
                <div class="w-full flex-shrink-0 p-6 bg-white">
                    <h2 class="text-2xl font-bold mb-4">${project.title}</h2>
                    <img src="${project.image}" alt="${project.title}" 
                         class="w-full h-64 object-cover rounded-lg mb-4">
                    <p class="text-gray-600 mb-4">${project.description}</p>
                    <div class="mb-4">
                        ${project.technologies.map(tech => 
                            `<span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">${tech}</span>`
                        ).join('')}
                    </div>
                    <a href="${project.githubUrl}" target="_blank" 
                       class="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        View on GitHub
                    </a>
                </div>
            `;
            container.innerHTML += projectElement;
        });
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function showSlide(index) {
    const slides = document.querySelectorAll('#carousel-container > div');
    if (index >= slides.length) currentSlide = 0;
    if (index < 0) currentSlide = slides.length - 1;
    
    const offset = currentSlide * -100;
    document.getElementById('carousel-container').style.transform = `translateX(${offset}%)`;
}

function nextSlide() {
    currentSlide++;
    showSlide(currentSlide);
}

function previousSlide() {
    currentSlide--;
    showSlide(currentSlide);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    // Auto advance slides every 5 seconds
    setInterval(nextSlide, 5000);
});
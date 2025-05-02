async function loadComponent(path, elementId) {
    try {
        const response = await fetch(path);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error(`Error loading component from ${path}:`, error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadComponent('/src/layouts/header.html', 'header');
    loadComponent('/src/layouts/footer.html', 'footer');
});
(function () {
	const track = document.getElementById('carousel-track');
	if (!track) return;
	const prev = document.querySelector('.carousel-prev');
	const next = document.querySelector('.carousel-next');
	let index = 0;
	function getItemWidth() {
		const item = track.querySelector('.carousel-item');
		return item ? item.offsetWidth + 12 : 0;
	}
	function getVisible() { return Math.floor(track.parentElement.offsetWidth / getItemWidth()) || 1; }
	function totalItems() { return track.querySelectorAll('.carousel-item').length; }
	function update() { track.style.transform = `translateX(-${index * getItemWidth()}px)`; }
	next && next.addEventListener('click', () => { index = Math.min(index + 1, Math.max(0, totalItems() - getVisible())); update(); });
	prev && prev.addEventListener('click', () => { index = Math.max(index - 1, 0); update(); });
})();
if (HMR && HotReload) {
	(async () => {
		// Initialize the hot reload client with custom handlers
		HMR.hot = new HotReload({
			reconnectInterval: 3000,
			onChange: (change) => {
				const changesElement = document.getElementById('changes');
				const div = document.createElement('div');
				div.className = `change-item ${change.event}`;
				div.innerHTML = `
					<strong>${change.event.toUpperCase()} - ${change.action.toUpperCase()}:</strong> ${change.path}
					<div class="timestamp">${new Date(change.time).toLocaleString()}</div>
				`;
				changesElement.insertBefore(div, changesElement.firstChild);
			}
		});
	})();
}

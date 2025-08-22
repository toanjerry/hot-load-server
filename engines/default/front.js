HotEngine.create({
	name: 'default',
	opts: {
		reconnectInterval: 3000,
	},
	process: changes => {
		for (const action in changes) {
			changes[action].forEach(change => {
				const changesElement = document.getElementById('changes');
				const div = document.createElement('div');
				div.className = `change-item ${change.event}`;
				div.innerHTML = `
					<strong>${change.event.toUpperCase()}:</strong> ${change.path}
					<div class="timestamp">${new Date(change.time).toLocaleString()}</div>
				`;
				changesElement.insertBefore(div, changesElement.firstChild);
			})
		}
	}
})

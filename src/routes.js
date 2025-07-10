import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirpublic = path.join(path.dirname(__filename), '..', 'public');

// Create router instance
const router = express.Router();

// Serve static files from /public directory based on the requested path
router.get('/:file(*)', (req, res, next) => {
	let filePath;
	if (!req.params.file || req.params.file === '') {
		filePath = path.join(__dirpublic, 'index.html');
	} else {
		filePath = path.join(__dirpublic, req.params.file);
	}
	res.sendFile(filePath, err => {
		if (err) next(); // Pass to next middleware if file not found
	});
});

// Export route configuration function
export const Routes = (app, hot) => {
	// Static routes
	app.use('/', router);

	// Dynamic routes that need access to clients
	app.get('/clients', (req, res) => {
		const clientsList = Array.from(hot.ws.clients.values()).map(info => info);

		res.json(clientsList);
	});
	
	app.get('/clients/remove', (req, res) => {
		const rs = hot.injecter.remove();

		res.json(rs);
	});
};

export default router;

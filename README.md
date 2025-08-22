# Hot Load Project

This project provides a hot-reload server and client configuration for rapid development and testing of front-end and back-end code changes. It is designed to work with the BaseRoot framework and supports custom file watching, CORS, SSL, and plugin-based extensibility.

## Guide
### Setup
1. Install dependencies and initialize config files:
   ```bash
   npm run setup
   ```
   This will install required packages and copy example config files to their working versions.

2. Edit `.env` as needed for your environment (host, port, SSL paths, allowed domains).

3. Edit `hot.config.js` and `client.config.js` to customize server and client hot-reload behavior.

### Usage
Start the hot load server:
```bash
npm run dev
```
or
```bash
npm start
```
This will launch the hot-reload server using your configuration.

### Development
- Modify watched files (JS, CSS, HTML, etc.) and the server will automatically detect changes and reload as needed.
- Use the plugin system to extend functionality (see `src/plugin/queue.js` for example).
- Adjust ignore patterns in `hot.config.js` to fit your workflow.

## Features
- `.env.example`: Example environment configuration for server, SSL, and CORS.

- `hot.config.js`:
    - Loads environment variables from `.env`.
    - Sets up server host, port, protocol, and SSL certificates.
    - Configures file watching using `chokidar` with customizable patterns for included and ignored files.
    - Supports CORS via allowed domains and credentials.
    - Allows plugin integration (e.g., queue plugin) for extensibility.
    - Defines client configurations and socket options.
    - Example options:
      - `autoRestart`: Enable/disable automatic server restart on file changes.
      - `watch.files`: Array of glob patterns for files to watch.
      - `watch.ignored`: Array of glob patterns for files/folders to ignore.
      - `ssl.key`, `ssl.cert`, `ssl.ca`: Paths to SSL certificate files.
      - `plugins`: Array of plugin functions to load.

- `client.config.js`:
    - Defines client-side hot-reload behavior and app selection.
    - Specifies which apps to enable hot-reload for via the `apps` array.
    - Configures how and where hot-reload scripts are injected using `entryPoints` (can be a path, array, or function).
    - Controls JS/CSS asset handling with `inject.minimize` (minify assets).
    - Provides custom matching logic for files (`matchFile`) and socket clients (`match`).
    - Example options:
      - `id`: Unique identifier for the client config.
      - `engine`: Hot-reload engine to use (default or custom).
      - `overlay`: Show error overlay on client.
      - `apps`: List of app names to enable hot-reload for.
      - `entryPoints`: Function or path(s) for injecting hot-reload code.
      - `inject`: Options for combining/minimizing assets.
      - `matchFile`: Function to determine if a file should be hot-reloaded.
      - `match`: Function to match socket clients for hot-reload.

## Engine
### Client engine
Main props:
- `name`: Engine identifier
- `opts`: Configuration options (e.g., reconnect interval)
- `process(changes)`: Main handler for hot-reload actions

Extend with additional properties or functions as needed for your hot-reload logic.

### Server engine
Main props:
- `name`: Engine identifier
- `init(hot)`: Initialize function run on load engine
- `process(changes, hot)`: Main async handler for file changes and client actions

Extend with additional properties or functions as needed for your hot-reload logic.


## Notes
- Make sure SSL certificate files exist at the specified paths if using HTTPS.
- Adjust ignore patterns in `hot.config.js` to fit your project structure.
- For more details, see comments in the example config files.

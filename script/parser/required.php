<?php

	// folder
	define("ENV", 0);
	define("WORK_DIR", dirname(__DIR__, 4));
	define("AP_ROOT", WORK_DIR."\ap");
	define("GDIR", WORK_DIR.'\base');
	define("SYS_DIR", GDIR."\system");
	define('EXT_STATIC_DIR', GDIR."\static");
	
	define("FINAL_CACHED", 1);
	define("ALLOW_DYNAMIC_URL", 0);

	define("HTTPS", 1);
	define("DATA_URL", 'https://data.base.local.basecdn.net');
	define("SHARE_URL", 'https://share.base.local.basecdn.net');
	define("SYS_DOMAIN", 'base.beta');
	define("DOMAIN", 'base.beta');

	// CSS
	define("CSS_CONFIG_FILE", '{EXT_STATIC_DIR}/config.css');
	define("CSS_MINIFIED", 0);

	require_once(AP_ROOT.'/base/vital/inc/helper.php');
	require_once(AP_ROOT.'/base/vital/inc/utf8.string.php');
	require_once(AP_ROOT.'/base/vital/function.php');
	require_once(AP_ROOT.'/base/apu/system.php');
	require_once(AP_ROOT.'/init/base.php');
	require_once(AP_ROOT.'/base/vital/word.php');
	require_once(AP_ROOT.'/base/vital/validator.php');
	require_once(AP_ROOT.'/base/vital/lang.php');
	require_once(AP_ROOT.'/base/vital/apt.php');
	require_once(AP_ROOT.'/base/vital/file.php');

	require_once(AP_ROOT.'/base/vital/inc/sanitizer.php');
	require_once(AP_ROOT.'/base/vital/html.php');
	require_once(AP_ROOT.'/dev/cache/tcache.php');
	require_once(AP_ROOT.'/base/trait/event.queue.php');
	require_once(AP_ROOT.'/base/document.php');
	require_once(AP_ROOT.'/base/template/template.php');
	require_once(AP_ROOT.'/config.php');
	require_once(AP_ROOT.'/ap.php');
	
	require_once(AP_ROOT.'/base/template/js.php');
	require_once(AP_ROOT.'/base/template/css.php');
	require_once(AP_ROOT.'/base/template/template.php');

	require_once(GDIR.'/system/template/template.php');


	function defineApp ($app) {
		if (defined("ROOT_DIR")) return;
		
		define("ROOT_DIR", GDIR."/$app");
		define("APPKEY", $app);
		define("CACHE_DIR", WORK_DIR."/data/base/{$app}.cache");
		define("ROOT_URL", "https://$app.base.beta");
		define("STATIC_URL", "https://static-devtest.basecdn.net/$app");

		\APTemplate::viewAt(ROOT_DIR);
		CONFIG::root(ROOT_DIR);
	}
?>

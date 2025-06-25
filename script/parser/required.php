<?php

	// folder
	define("ENV", 1);
	define("WORK_DIR", 'C:\xampp\htdocs\baseroot');
	define("AP_ROOT", WORK_DIR."\ap");
	define("GDIR", 'C:\xampp\htdocs\baseroot\base');
	define("SYS_DIR", GDIR."\system");
	define('EXT_STATIC_DIR', GDIR."\static");
	
	define("FINAL_CACHED", 1);
	define("ALLOW_DYNAMIC_URL", 0);

	// CSS
	define("CSS_CONFIG_FILE", '{EXT_STATIC_DIR}/config.css');
	define("CSS_MINIFIED", 0);

	require_once(AP_ROOT.'/base/vital/inc/helper.php');
	require_once(AP_ROOT.'/base/vital/inc/utf8.string.php');
	require_once(AP_ROOT.'\base\vital\function.php');
	require_once(AP_ROOT.'/base/apu/system.php');
	require_once(AP_ROOT.'/init/base.php');
	require_once(AP_ROOT.'/base/vital/word.php');
	require_once(AP_ROOT.'/base/vital/validator.php');
	require_once(AP_ROOT.'/base/vital/lang.php');
	require_once(AP_ROOT.'/base/vital/apt.php');
	require_once(AP_ROOT.'\base\vital\file.php');

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
		define("ROOT_DIR", GDIR."/$app");
		define("APPKEY", $app);
		define("CACHE_DIR", WORK_DIR."/data/base/{$app}.cache");
		CONFIG::root(ROOT_DIR);
	}
?>

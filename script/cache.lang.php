<?php

	$apps = array_unique(array_filter(explode(',', $argv[1] ?? '')));
	if (!$apps) {
		return;
	}

	$lang = $argv[2] ?? 'vi';
	if (!$lang) {
		$lang = 'vi';
	}

	require_once('parser/required.php');

	require_once('parser/lang.php');

	\hmr\Lang::set($lang);
	foreach ($apps as $app) {
		defineApp($app);
		\hmr\Lang::prepare(null, false, true);
	}

?>

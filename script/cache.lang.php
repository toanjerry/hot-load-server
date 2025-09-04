<?php

	$app = $argv[1] ?? ''
	if (!$app) return

	$lang = $argv[2] ?? 'vi'

	require_once('parser/required.php')
	require_once('parser/lang.php')

	defineApp($app)

	\hmr\Lang::set($lang)
	\hmr\Lang::prepare(null, false, true)

?>

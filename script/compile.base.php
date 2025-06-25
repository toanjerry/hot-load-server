<?php

	$fileList = array_unique(array_filter(explode(',', $argv[1] ?? '')));
	if (!$fileList) {
		return;
	}

	require_once('parser/required.php');

	require_once('parser/lang.php');
	require_once('parser/js.php');
	require_once('parser/css.php');
	require_once('parser/template.php');

	$parsed_files = [];
	foreach ($fileList as $file) {
		$app = explode('/', str_replace('\\', '/', $file))[0] ?? '';
		if (!$app) continue;

		defineApp($app);

		$ext = pathinfo($file, PATHINFO_EXTENSION);
		if ($ext === "js") {
			require_once(GDIR."/$app/dev/base/autorun.php");
			$parsed_files[$file] = [
				'js' => parseJS(GDIR."/$file")
			];
		} else if ($ext === "css") {
			$parsed_files[$file] = [
				'css' => parseCSS(GDIR."/$file")
			];
		} else if ($ext === "base" || $ext === "tpl") {
			$parsed_files[$file] = [
				// 'html' => \APTemplate::xParse($file),
				'html' => \APTemplate::getText(),
				'js' => \APTemplate::getInternalJS().";Render.finish();",
				'title' => \APTemplate::getTitle(),
				'update' => 'update_page',
				'reset' => 'reset_page',
			];
		}
	}

	echo json_encode($parsed_files);
?>

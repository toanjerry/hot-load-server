<?php

	$fileList = array_unique(array_filter(explode(',', $argv[1] ?? '')));
	if (!$fileList) {
		return;
	}

	require_once('parser/required.php');

	require_once('parser/lang.php');
	// require_once('parser/tpl.php');
	require_once('parser/js.php');
	require_once('parser/css.php');
	require_once('parser/template.php');

	$parsed_files = [];
	foreach ($fileList as $f) {
		$file = str_replace('\\', '/', $f);
		$parts = explode('/', $file);
		$app = $parts[0] ?? '';
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
			// $parsed_files[$file] = parseTemplate(\Word::joinPart('/', $parts, 1));
		}
	}

	echo json_encode($parsed_files);
?>

<?php

	function parseTemplate ($file) {
		\hrm\Tpl::bindings();

		\hrm\Tpl::html("empty.tpl");
		\hrm\Tpl::disableCache();
		$tpl = ['', ''];
		// $tpl = \hrm\Tpl::quickLoad($file); => Todo

		return [
			'html' => $tpl[0] ?? '',
			'js' => "{$tpl[1]};Render.finish();",
			'update' => 'update_page',
			'reset' => 'reset_page',
		];
	}

?>

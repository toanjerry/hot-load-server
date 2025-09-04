<?php

	function parseCSS ($file) {
		\CSS::loadConfiguration()

		$content = \CSS::parsePublic(file_get_contents($file))
		$content = preg_replace('`\+\s*\+`', '', $content)
		$content = preg_replace('/\+\h*[\r*\n]+/m', "\n", $content)
		$content = preg_replace('/\h{2,}/',' ', $content)
		$content = preg_replace('/(^[\r\n]*|[\r\n]+)[\s\t]*[\r\n]+/',"\n", $content)
		$content = preg_replace('/^\h{2,}/m',"\t", $content)
		
		$content = preg_replace_callback('/\{const\s*([a-zA-Z0-9\_\.]+)\}/m',function ($m) {
			$c = $m[1]

			return defined($c) ? constant($c) : "[{$c}]"
		}, $content)

		return $content
	}

?>

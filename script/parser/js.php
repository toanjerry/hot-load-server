<?php

	\APTemplate::baseTags(["filter", "db", "list", "card", "block", "display", "file", "table", "layout", "master", "menu", "header", "text", "section", "setting", "app", "form", "fi", "input", "graph", "chart", "super", "dev", "kanban", "label", "mobile", "drawer", "footer", "api", "msg", "att", "row", "col", "search", "page", "platform", "pick", "error", "notis"])

	function parseJS ($file, $recursive = false, $lang = 'vi') {
		\hmr\Lang::set($lang)
		\hmr\Lang::prepare()

		$content = file_get_contents($file)
		
		// REMOVE COMMENTS
		$content = preg_replace(['/^\/\*(.*?)\*\//usm'], '', $content)
		$content = preg_replace(['/\n+\t*\s*\n+/'], "\n", $content)

		// translate
		if (in_array($lang, \Lang::LEGACY_LANGUAGES)){
			$content = preg_replace_callback('`\{\{([a-zA-Z0-9\.\,\_\-\+\<\>\$\(\)\'\%\:\|\/\p{L} \@\/\&\~]+)\}\}`ui', function ($m) {
				return \hmr\Lang::safeTranslate($m[1])
			}, $content)
		}

		// parse
		$content = \APTemplate::parseJSBlock($content)
		$content = \JS::parseBackTick($content)
		
		// add tag
		$content = preg_replace_callback("/\"\<\@declare\s+([a-zA-Z0-9\/\,\.\#\-]+)\>\"\/", function ($m) {
			\APTemplate::baseTags([$m[1]])
			return ''
		}, $content)
		
		// recursive required file
		$content = preg_replace_callback([
			"/\"\!\@require\s+([a-zA-Z0-9\/\,\.\#\-]+)\"\/",
			"/\"\<\@require\s+([a-zA-Z0-9\/\,\.\#\-]+)\>\"\/"
		], function ($m) use ($file, $recursive) {
			if (!$recursive) {
				return ''
			}

			$dir = dirname($file)
			return "\n".parseJS("{$dir}/{$m[1]}")
		}, $content)
		
		// svg
		$content = preg_replace_callback("/\{\%\s*svg\s+([a-zA-Z0-9\.\/]+)}/", function ($m) {
			return \Template::loadSVG($m[1])
		}, $content)
		
		// Replace custom tag ~ support: tdc
		$content = str_replace(
			["<tdc>", "<thc>", "<tdcl>", "<thcl>", "</tdc>", "</thc>", "</tdcl>", "</thcl>"], 
			["<td><div class='cell'>", "<th><div class='cell'>", "<td><div class='cell-lead'>", "<th><div class='cell-lead'>", "</div></td>", "</div></th>", "</div></td>", "</div></th>"],
			$content
		)
		
		$content = preg_replace([
			"/<tdcl(\s[^>]+?)>/",
			"/<tdc(\s[^>]+?)>/",
		], [
			"<td$1><div class='cell-lead'>",
			"<td$1><div class='cell'>",
		], $content)
		
		return $content
	}

?>

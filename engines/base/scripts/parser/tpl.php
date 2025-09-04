<?php

	namespace hrm;

	class Tpl extends \APTemplate {
		private static $__binded = false;

		public static function bindings () {			
			if (self::$__binded) {
				return;
			}
			
			self::$__binded = true;
			
			\APTemplate::replace("<script primary>", "<script>//primary:\n");
			\APTemplate::replace("<script inline>", "<script>//inline:\n");
			\APTemplate::replace("<base-script>", "<script>//inline:\n");
			\APTemplate::replace("</base-script>", "</script>");
			
			\APTemplate::tag("READY", \APTemplate::AP_JS, \APTemplate::AP_JS);
			\APTemplate::tag("SCRIPT", \APTemplate::AP_JS, \APTemplate::AP_JS);
			
			\APTemplate::tag("TEXT", "<div class='text'>", "</div>");
			\APTemplate::replace('<var>', '{%');
			\APTemplate::replace('</var>', '}');		
			
			\APTemplate::replace('<ivar>', '{% var ');
			\APTemplate::replace('</ivar>', '}');
			
			\APTemplate::replace('<l>', '{% l ');
			\APTemplate::replace('</l>', '}');
			
			\APTemplate::replace('{% view', '{% VIEW');
			
			/**
			 * @desc Default Site information bindings
			 */
			// bind('PROTECTED',HTML::generateProtectedCode());
			// bind('CODE',HTML::generateProtectedCode('__code'));
			
			bind('URL', ROOT_URL);
			bind('NAME', \CONFIG::data('siteinfo','name'));
			bind('IMAGE',STATIC_URL."/image");
			bind('appimg',ROOT_URL."/appimg");
			bind('mimg',ROOT_URL."/appimg/mimg");
			bind('DATA_URL',DATA_URL);
			bind("EXTJSSRC", "script");
			
			bind('SCRIPT',"<script type='text/javascript'>");
			bind('ESCRIPT',"</script>");
			bind('STYLE',"<style type='text/css'>");
			bind('ESTYLE',"</style>");
			
			bind('TAB',"<div style='display:inline-block; width:50px'></div>");

			bind('START',"</head>\n\t<body>");
			bindF('INIT','Document::show');

			bind("share_url", SHARE_URL);
			
			bind('ROOT', ROOT_URL);
			bind('DOMAIN', DOMAIN);
			bind('BASE.URL', HTTPS?"https://".DOMAIN:"http://".DOMAIN);
		}
	}

?>

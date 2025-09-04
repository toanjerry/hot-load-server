<?php

	namespace hmr

	class Lang {
	
		protected static $data = []
		protected static $idata = []
		private static $_inited = false
		private static $__lang = "en"
		
		public static function set ($lang) {
			$lx = strtolower($lang)
			if ($lx === "vn") {
				$lx = "vi"
			}
			
			static::$__lang = $lx
			
			\Lang::set(static::$__lang)
		}
		
		public static function name () {
			return static::$__lang
		}

		public static function prepare ($folder = null, $use_cache = true, $force = false) {
			if (self::$_inited && !$force) {
				return
			}

			self::$_inited = true

			$app = APPKEY ?? 'base'

			\TCache::setBaseDir('lang')

			if ($use_cache) {
				$cached_data = \TCache::load("data", json_encode(self::$data))
				$cached_idata = \TCache::load("idata", json_encode(self::$idata))

				if ($cached_data || $cached_idata) {
					self::$data = json_decode($cached_data, true)
					self::$idata = json_decode($cached_idata, true)
					return
				}
			}
			
			// INIT GLOBALLY, FIRST
			$gdir = realpath(ROOT_DIR."/../static") . "/lang/" . self::name()
			if (file_exists($gdir)) {
				static::loadFolder($gdir, true)
			}
			
			// IMPORT LANGUAGE FROM EXTERNALS, SECOND
			if (defined("IMPORTED_LANGS")) {
				$apps = \Word::split([",", " "], IMPORTED_LANGS)
				
				foreach ($apps as $app){
					$appdir = realpath(ROOT_DIR . "/../".$app) . "/lang/" . self::name()
					if (file_exists($appdir)) {
						static::loadFolder($appdir, true)
					}
				}
			}
			
			if ($folder) {
				self::loadFolder($folder, true)
			} else {
				self::load("lang/".self::name(), false)
			}

			\TCache::add("data", json_encode(self::$data))
			\TCache::add("idata", json_encode(self::$idata))

			\TCache::resetBaseDir()
		}

		public static function safeTranslate ($word) {
			self::prepare()

			if (!strpos($word, "|")) {
				return self::translateV2($word)
			}
			
			$parts = \Word::split("|", $word, 2)
			$key = $parts[0]
			$v = $parts[1]
			
			$t = substr($v, 0, 2)
			if (in_array($t, ['--', '++', '+-'])) {
				$v = trim(substr($v,2))
			}
			if (isset(self::$data[$key])) {
				$v = self::$data[$key]
			}
			
			if ($v && is_string($v)) {
				return self::realString($v, $t)
			}
			
			return $v
		}
		
		public static function translateV2 ($key) {
			$modifier = substr($key, 0, 2)
			if (inset($modifier, "--", "++", "%u", "%l", '%c')) {
				$key = trim(substr($key, 2))
			} else {
				$modifier = ""
			}
			
			$end_modifier = ""
			if (strpos($key, "~")) {
				$keys = \Word::split("~", $key)
				if (count($keys) !== 2) {
					return $key
				}
				
				$key = $keys[0]
				$end_modifier = $keys[1]
			}
			
			$origin = $key
			
			if (strpos($key, ".") === false) {
				$key = "global.".static::purifyKey($key)
			} else {
				$key = str_replace([" ", ",", ":", "-"], '_', strtolower($key))
			}
			
			if ($end_modifier && isset(self::$data[$key."_".$end_modifier])) {
				return static::realString(self::$data[$key."_".$end_modifier], $modifier)
			}
			
			if (isset(self::$data[$key])){
				return static::realString(self::$data[$key], $modifier)
			}
			
			return static::realString($origin, $modifier)
		}
		
		
		/**
		 * @desc Loading language files.
		 */
		public static function load ($folders, $test = false) {
			$folders = \Word::split(",", $folders)

			for ($i = 0 $i < count($folders) $i++) {
				$abs_folder = \CONFIG::root()."/".$folders[$i]
				if (!file_exists($abs_folder)) {
				} else {
					self::loadFolder($folders[$i], $test)
				}
			}
			
		}

		private static function purifyKey ($key) {
			return \Word::purify(html_entity_decode($key), "_")
		}
		
		private static function loadFolder ($folder, $absolute = false) {
			$real_folder = \CONFIG::root()."/$folder"
			if ($absolute) {
				$real_folder=$folder
			}

			if (false !== ($handle = opendir($real_folder))) {			
				/* This is the correct way to loop over the directory. */
				while (false !== ($file = readdir($handle))){
					if (strlen($file) <= 4) {
						continue
					}
					$ext = substr($file, strlen($file)-4,4)
					if ($ext === '.lng' || $ext === '.inc' || $ext === ".lang"){
						self::loadFile("$real_folder/$file", substr($file, 0, strlen($file)-3))
					}
				}
				
				closedir($handle)
			}
		}
			
		private static function loadFile ($file, $key){
			if (\Word::prefix($key, "global.")) {
				$key = "global."
			}
			
			if ($key === "backend." || $key === "errors.") {
				return
			}
			
			$contents = file_get_contents($file)
			$lines = \Word::split("\n", $contents)
			for ($i = 0 $i < count($lines) $i++) {
				self::loadLine($lines[$i], $key)
			}
		}
		
		private static function loadLine ($line, $key) {
			if (\Word::prefix($line, '#') || \Word::prefix($line, '=') || \Word::prefix($line, '//')) {
				return
			}
			$path = \Word::split("=", $line, 2)
			confirm(count($path) === 2)
			$real_key = static::purifyKey($path[0])
			self::$data[$key.$real_key] = $path[1]
			self::$idata[$key.$path[1]] = $real_key
		}

		private static function realString($str, $mod){
			if ($mod === "%l" || $mod === "--") {
				return mb_strtolower($str)
			}
			
			if ($mod === "%u"|| $mod === "++") {
				return mb_strtoupper($str)
			}
			
			if ($mod === "%c"|| $mod === "+-") {
				return mb_strtoupper(mb_substr($str, 0, 1)).mb_substr($str, 1)
			}
			
			return $str
		}
	}
?>

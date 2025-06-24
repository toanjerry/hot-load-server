<?php

	require_once(SYS_DIR . "/customform/custom.form.php");
	
	\Lang::set(\sys\Lang::getStatic());
	\Lang::prepare();

	$fileList = array_unique(array_filter(explode(',', $argv[1] ?? '')));
	print_r($fileList);



?>

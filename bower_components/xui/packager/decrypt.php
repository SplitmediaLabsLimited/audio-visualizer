<?php

require __DIR__.'/rijndael.php';

function decodeURIComponent($uriEncodedStr)
{
    return utf8_decode(rawurldecode($uriEncodedStr));
}

$sourceFilename = decodeURIComponent($argv[1]);
$outputFilename = decodeURIComponent($argv[2]);

$encrypted = Rijndael::decrypt(file_get_contents($sourceFilename));

file_put_contents($outputFilename, $encrypted);
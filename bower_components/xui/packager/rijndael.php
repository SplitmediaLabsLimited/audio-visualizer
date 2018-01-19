<?php

class Rijndael 
{
	protected $cipher = MCRYPT_RIJNDAEL_128;
	protected $mode   = MCRYPT_MODE_CBC;

	private function __construct() {}

	private static $instance;

	public static function __callStatic($name, $arguments)
    {
    	if (!self::$instance)
    	{
    		self::$instance = new Rijndael();
    	}

    	return call_user_func_array(
    		array(self::$instance, $name),
    		$arguments
    	);
    }

	private function pkcs7_padding($block_size, $string_length) 
	{
		$padding_length = $block_size-($string_length%$block_size);
		$padding_char   = chr($padding_length);

		return str_repeat($padding_char, $padding_length);
	}

	private function encrypt($data, $padding_mode = 'pkcs7_padding') 
	{
		$key_size   = mcrypt_get_key_size($this->cipher, $this->mode);
		$block_size = mcrypt_get_iv_size($this->cipher, $this->mode);

		$data = utf8_encode($data);

		if ($padding_mode) 
		{
			$data .= $this->$padding_mode($block_size, strlen($data));
		}

		$password = utf8_encode('Spl71+M3d1@7@b$');
		$salt     = utf8_encode('12345678');

		$iv  = hash_pbkdf2('sha1', $password, $salt, 1000, $block_size, true);
		$key = pack(
			'H*',
			'86743bfa7182fa60dd15439f450dac65d154feb0616aafa0de150681e4c41fb0'
		);

		$encrypted = mcrypt_encrypt(
			$this->cipher,
			$key,
			$data,
			$this->mode,
			$iv
		);

		return base64_encode($encrypted);
	}

	private function pkcs7_unpad($block_size, $padded_string) 
	{
		$len = strlen($padded_string);
		$pad = ord($padded_string[$len-1]);

		return substr($padded_string, 0, $len-$pad);
	}

	private function decrypt($data, $unpad_function = 'pkcs7_unpad') 
	{
		$data = base64_decode($data);

		$key_size   = mcrypt_get_key_size($this->cipher, $this->mode);
		$block_size = mcrypt_get_iv_size($this->cipher, $this->mode);

		$password = utf8_encode('Spl71+M3d1@7@b$');
		$salt     = utf8_encode('12345678');

		$iv  = hash_pbkdf2('sha1', $password, $salt, 1000, $block_size, true);
		$key = pack(
			'H*',
			'86743bfa7182fa60dd15439f450dac65d154feb0616aafa0de150681e4c41fb0'
		);

		$decrypted = mcrypt_decrypt(
			$this->cipher,
			$key,
			$data,
			$this->mode,
			$iv
		);

		$decrypted = utf8_decode($decrypted);
		
		return $unpad_function ?
			$this->$unpad_function($block_size, $decrypted) :
			$decrypted;
	}
}
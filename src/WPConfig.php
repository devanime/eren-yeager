<?php
/**
 * Class WPConfig
 * @package DevAnime
 * @author  DevAnime <devanimecards@gmail.com>
 * @version 1.0
 */

namespace DevAnime;

class WPConfig
{
    const ENV_PROD = 'production';
    const ENV_STAGING = 'staging';
    const ENV_LOCAL = 'local';
    const DB_CONNECT_RETRIES = 10;
    const DB_CONNECT_WAIT_TO_RETRY = 3;
    protected $path;
    protected $serverName;
    protected $environment;
    protected $urlPrefix;
    protected $isTests = false;
    protected $isDeployment = false;
    protected $isCLI = false;

    public function __construct($path)
    {
        $this->path = $path;
        $this->isTests = class_exists('PHPUnit\TextUI\Command') && defined('WP_PHP_BINARY');
        $this->isDeployment = getenv('REMOTEPATH') && getenv('WEBROOT');
        $this->isCLI = php_sapi_name() == 'cli' || defined('STDIN');
        $this->defineConstant('WP_TESTS', $this->isTests);
        $this->serverName = $this->getServerName();
        $this->defineConstant('ENVIRONMENT', $this->getEnvironment());
        $this->environment = ENVIRONMENT;
        $this->defineConstant('FORCE_HTTPS', ! $this->isLocal());
        $this->urlPrefix = FORCE_HTTPS ? 'https://' : 'http://';
        if (FORCE_HTTPS) {
            $_SERVER['HTTPS'] = 'on';
        }
        $this->defineLicenseKeys();
        $this->setupWPRocket();
        $this->setupWP();
        $this->setupRedis();
        $this->defineConstant('GFORM_DISABLE_AUTO_UPDATE', true);
    }

    protected function defineLicenseKeys()
    {
        $keys_file = __DIR__ . '/config-optional.php';
        if (!file_exists($keys_file)) {
            return;
        }
        $keys = require_once $keys_file;
        foreach ($keys as $name => $value) {
            $this->defineConstant($name, $value);
        }
    }

    protected function setupWPRocket()
    {
        $this->defineConstant('WP_CACHE');
        $this->defineConstant('WP_ROCKET_KEY', 'fb33fb7d');
        $this->defineConstant('WP_ROCKET_EMAIL', 'devanimecards@gmail.com');
    }

    protected function getDbHost()
    {
        if ($this->isProduction()) {
            return 'dbmaster.devanimecards.io';
        }
        if ($host = getenv('DB_HOST')) {
            return $host;
        }
        return $this->isDeployment ? 'localhost' : '127.0.0.1';
    }

    protected function setupRedis()
    {
        if (!($this->environment && defined('WP_HOME'))) {
            return false;
        }
        $domain = rtrim(str_replace(['https://', 'http://', 'www.', '.devanimecards.io'], '', WP_HOME), '/');
        $salt = preg_replace("![^a-z0-9]+!i", "-", $domain);
        if (!$this->isLocal()) {
            $this->defineConstant('WP_REDIS_HOST', 'si-redis1.xwrser.ng.0001.use1.cache.amazonaws.com');
        }
        if ($this->isStaging()) {
            $this->defineConstant('WP_REDIS_DATABASE', 1);
        }
        $this->defineConstant('WP_CACHE_KEY_SALT', $salt . '_');
        $this->defineConstant('WP_REDIS_SELECTIVE_FLUSH');
        $this->defineConstant('WP_REDIS_MAXTTL', 43200); // 12 * 60 * 60 = 12 hours
    }

    protected function setupWP()
    {
        $this->defineConstant('AUTOMATIC_UPDATER_DISABLED');
        $this->defineConstant('BACKSTAGE_AUTOMATIC_UPDATER_HANDLER');
        $this->defineConstant('WP_DISABLE_FATAL_ERROR_HANDLER');
        if (!$this->isLocal()) {
            $this->defineConstant('DISALLOW_FILE_MODS');
        }
        $this->defineConstant('DISABLE_CUSTOMIZER', $this->isProduction());
        if ($this->serverName) {
            $this->defineConstant('WP_SITEURL', $this->urlPrefix . $this->serverName . '/wp');
            $this->defineConstant('WP_HOME', $this->urlPrefix . $this->serverName . '/');
            $this->defineConstant('WP_CONTENT_DIR', $this->path . '/wp-content');
            $this->defineConstant('WP_CONTENT_URL', $this->urlPrefix . $this->serverName . '/wp-content');
        }
        if (! defined('DB_NAME')) {
            $this->defineConstant('DB_NAME',getenv('DB_NAME') ?: file_get_contents(dirname(__DIR__) . '/docker/test/CONTAINER_NAME'));
        }
        $this->defineConstant('DB_USER', getenv('DB_USER') ?: 'root');
        $this->defineConstant('DB_PASSWORD', getenv('DB_PASSWORD') ?: '');
        $this->defineConstant('DB_HOST', $this->getDbHost());

        $this->defineConstant('DISABLE_REST_ERROR_LOGGING', $this->isTests);
    }

    protected function getServerName()
    {
        return $_SERVER['SERVER_NAME'] ?? ($_SERVER['HTTP_HOST'] ?? false);
    }

    protected function getEnvironment()
    {
        if (strpos($this->serverName, 'staging') !== false) {
            return self::ENV_STAGING;
        } elseif (strpos($this->serverName, '.test') !== false || $this->isTests) {
            return self::ENV_LOCAL;
        } elseif (empty($this->serverName)) {
            return false;
        } else {
            return self::ENV_PROD;
        }
    }

    protected function defineConstant($constant, $value = true)
    {
        if (! defined($constant)) {
            define($constant, $value);
        }
    }

    protected function isProduction()
    {
        return $this->environment === self::ENV_PROD;
    }

    protected function isStaging()
    {
        return $this->environment === self::ENV_STAGING;
    }

    protected function isLocal()
    {
        return $this->environment === self::ENV_LOCAL;
    }

    public function waitForTestDb()
    {
        if (!$this->isTests) {
            return;
        }
        $tries_remaining = static::DB_CONNECT_RETRIES;
        $stdout = fopen('php://stdout', 'w');
        do {
            $mysql = @new \mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
            if ($mysql->connect_error) {
                if ($tries_remaining == static::DB_CONNECT_RETRIES) {
                    fwrite($stdout, "\n" . 'Connecting to MySQL service');
                }
                fwrite($stdout, '.');
                --$tries_remaining;
                if ($tries_remaining <= 0) {
                    exit(1);
                }
                sleep(static::DB_CONNECT_WAIT_TO_RETRY);
            }
        } while ($mysql->connect_error);
        if ($tries_remaining < static::DB_CONNECT_RETRIES) {
            fwrite($stdout, "\n");
        }
        $mysql->close();
    }

}

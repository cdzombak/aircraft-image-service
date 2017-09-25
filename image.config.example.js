module.exports = {
  apps : [{
    name        : "acimages",
    script      : "./image.js",
    watch       : true,
    env: {
      "NODE_ENV": "development",
      "CLIENT_KEY": "dev_client_key"
    },
    env_production : {
       "NODE_ENV": "production",
       "REDIS_PWD": "prod_redis_pwd",
       "CLIENT_KEY": "prod_client_key"
    }
  }]
}

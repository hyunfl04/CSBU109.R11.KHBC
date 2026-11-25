module.exports = {
  apps: [
    {
      name: 'shop-api',
      script: './server.js',
      instances: 4,
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    }
  ]
};
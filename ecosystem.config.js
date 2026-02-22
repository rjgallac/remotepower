module.exports = {
  apps: [
    {
      name: 'remotepower',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time_format: 'YYYY-MM-DD HH:mm:ss Z',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'public'],
      max_memory_restart: '200M',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};

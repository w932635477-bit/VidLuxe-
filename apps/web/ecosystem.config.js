module.exports = {
  apps: [{
    name: 'vidluxe',
    cwd: '/opt/vidluxe/apps/web/.next/standalone/apps/web',
    script: 'server-with-polyfill.js',
    interpreter: '/usr/local/bin/node',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
    }
  }]
};

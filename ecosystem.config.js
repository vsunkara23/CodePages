module.exports = {
  apps: [{
    name: 'CodePages',
    script: './index.js'
  }],
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'ec2-3-101-54-71.us-west-1.compute.amazonaws.com',
      key: '~/.ssh/codepages.pem',
      ref: 'origin/master',
      repo: 'git@github.com:vsunkara23/CodePages.git',
      path: '/home/ubuntu/CodePages',
      'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js'
    }
  }
}
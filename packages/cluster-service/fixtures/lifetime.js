const { ClusterService } = require('../dist');

const clusterService = new ClusterService({
  workers: 3,
  lifetime: 500,
  restartOnExit: true,
});

const worker = () => {
  console.log('worker');
  process.exit();
};

clusterService.clusterize(worker).catch((err) => {
  console.error(err);
  process.exit(1);
});

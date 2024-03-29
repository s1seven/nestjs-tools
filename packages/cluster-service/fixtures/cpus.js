const { ClusterService } = require('../dist');

const clusterService = new ClusterService({
  lifetime: 0,
});

const worker = () => {
  console.log('worker');
  process.exit();
};
clusterService.clusterize(worker).catch((err) => {
  console.error(err);
  process.exit(1);
});

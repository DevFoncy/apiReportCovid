const formatEndPointSuccess = (message, info = []) => {
  let data = {};
  data.status = 'OK';
  data.message = message ? message : 'No hay mensaje';
  data.data = info ? info : [];
  return data;
};


const formatEndPointFailed = (message, info = []) => {
  let data = {};
  data.status = 'ERROR';
  data.message = message ? message : 'No hay mensaje';
  data.data = info ? info : [];
  return data;
};

module.exports = Object.freeze({
  formatEndPointSuccess,
  formatEndPointFailed
});


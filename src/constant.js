const LOW_LEVEL = [0.0,0.4];
const MEDIUM_LEVEL = [0.4, 0.7];
const HIGHT_LEVEL = [0.7,1];


const findCriticity = (value, aforo) => {
  let percentage = value/aforo;
  if(percentage >= LOW_LEVEL[0] && percentage < LOW_LEVEL[1]){
    return 'L';
  }else if(percentage >= MEDIUM_LEVEL[0] && percentage < MEDIUM_LEVEL[1]){
    return 'M';
  }else{
    return 'H';
  }
  return null;
};

module.exports = Object.freeze({
  findCriticity,
});


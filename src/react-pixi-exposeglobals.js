//
// require and then expose React and React.PIXI in the global namespace
//

require('expose?React!react');
require('expose?ReactDOM!react-dom');
require('expose?PIXI!pixi.js');

module.exports = require('./ReactPIXI.js');


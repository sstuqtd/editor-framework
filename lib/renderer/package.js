'use strict';

let Package = {
  reload ( name ) {
    Editor.sendToCore('package:reload', name);
  },

  queryInfos ( cb ) {
    Editor.sendRequestToCore('package:query-infos', cb);
  },

  queryInfo ( name, cb ) {
    Editor.sendRequestToCore('package:query-info', name, cb);
  },
};

module.exports = Package;

'use strict';

// Modules
const _ = require('lodash');
const path = require('path');

/*
 * The lowest level lando service
 */
module.exports = {
  name: '_platformsh_service',
  parent: '_lando',
  builder: parent => class LandoPlatformService extends parent {
    constructor(id, options = {}, ...sources) {
      // Get some stuff from our parsed platform config
      const runConfigPath = _.get(options, 'runConfig.file');
      const bootScript = path.join(options.userConfRoot, 'scripts', 'psh-boot.sh');

      // Figure out the info situation
      options.portforward = true;
      // @TODO: Add in info
      /*
      // Add in relevant info
      options.info = _.merge({}, options.info, {
        internal_connection: {
          host: options.name,
          port: options.port,
        },
        external_connection: {
          host: options._app._config.bindAddress,
          port: _.get(options, 'portforward', 'not forwarded'),
        },
      });
      */

      // Set the docker things we need for all appservers
      const service = {
        command: 'exec init',
        environment: {LANDO_SERVICE_TYPE: '_platformsh_appserver'},
        // @TODO: would be great to not need the below but
        // its required if we want to unmount /etc/hosts /etc/resolv.conf
        privileged: true,
        volumes: [
          `${runConfigPath}:/run/config.json`,
          `${bootScript}:/scripts/001-boot-platformsh`,
        ],
      };

      // Add in aliases if we have them
      if (!_.isEmpty(options.platformsh.aliases)) {
        service.networks = {default: {
          aliases: _(options.platformsh.aliases)
            .map(alias => `${alias}.internal`)
            .value(),
        }};
      }

      // ADD IN OTHER LANDO STUFF? info? etc?
      sources.push({services: _.set({}, options.name, service)});
      super(id, options, ...sources);
    };
  },
};

const plugin = {
  // Rollback Strategies
  rollbackStrategies: [
    {
      name: 'aws-graceful-rollback',
      description: 'Graceful AWS resource rollback with health checks',
      type: 'automatic',
      execute: async (context, options) => {
        const { logger } = context;
        logger.info('Executing AWS graceful rollback strategy');
        
        const steps = [
          { name: 'health-check', type: 'validation', success: true, duration: 100 },
          { name: 'drain-connections', type: 'drain', success: true, duration: 500 },
          { name: 'terminate-instances', type: 'destruction', success: true, duration: 2000 },
          { name: 'cleanup-resources', type: 'cleanup', success: true, duration: 300 }
        ];
        
        return {
          success: true,
          steps,
          errors: [],
          warnings: [],
          duration: 2900
        };
      },
      validate: async (context) => {
        return {
          isValid: true,
          errors: [],
          warnings: [],
          info: []
        };
      }
    },
    {
      name: 'aws-emergency-rollback',
      description: 'Emergency AWS resource destruction for critical failures',
      type: 'automatic',
      execute: async (context, options) => {
        const { logger } = context;
        logger.info('Executing AWS emergency rollback strategy');
        
        const steps = [
          { name: 'force-terminate', type: 'destruction', success: true, duration: 1000 },
          { name: 'cleanup-all', type: 'cleanup', success: true, duration: 500 }
        ];
        
        return {
          success: true,
          steps,
          errors: [],
          warnings: ['Emergency rollback executed - some resources may be left in inconsistent state'],
          duration: 1500
        };
      }
    }
  ],

  // Validators
  validators: [
    {
      name: 'aws-resource-validator',
      description: 'Validates AWS resource configurations',
      type: 'resource',
      validate: async (data, context) => {
        const { logger } = context;
        logger.info('Validating AWS resource configuration');
        
        const errors = [];
        const warnings = [];
        const info = [];
        
        // Example validation logic
        if (data.resourceType === 'aws_instance') {
          if (!data.instanceType) {
            errors.push({
              code: 'MISSING_INSTANCE_TYPE',
              message: 'AWS instance type is required',
              field: 'instanceType',
              suggestion: 'Specify a valid instance type (e.g., t3.micro)'
            });
          }
          
          if (data.instanceType && data.instanceType.startsWith('t1.')) {
            warnings.push({
              code: 'DEPRECATED_INSTANCE_TYPE',
              message: 'T1 instance types are deprecated',
              field: 'instanceType',
              suggestion: 'Consider using T2 or T3 instance types'
            });
          }
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          warnings,
          info
        };
      }
    }
  ],

  // Commands
  commands: [
    {
      name: 'aws-health-check',
      description: 'Check AWS resource health status',
      usage: 'tempeh plugin execute aws-rollback-plugin aws-health-check [resource-id]',
      options: [
        {
          name: 'resource-id',
          description: 'Specific resource ID to check',
          type: 'string',
          required: false
        },
        {
          name: 'region',
          description: 'AWS region',
          type: 'string',
          required: false,
          default: 'us-east-1'
        }
      ],
      handler: async (args, options, context) => {
        const { logger } = context;
        const resourceId = args[0] || 'all';
        const region = options.region || 'us-east-1';
        
        logger.info(`Checking AWS resource health in region ${region}`);
        logger.info(`Target resource: ${resourceId}`);
        
        // Simulate health check
        logger.info('✅ EC2 instances: Healthy');
        logger.info('✅ RDS databases: Healthy');
        logger.info('⚠️  Load balancers: 1 unhealthy');
        logger.info('✅ Auto Scaling groups: Healthy');
      }
    }
  ],

  // Hooks
  hooks: {
    preDeploy: async (context) => {
      const { logger } = context;
      logger.info('AWS plugin: Pre-deployment checks');
      logger.info('Checking AWS credentials...');
      logger.info('Validating resource limits...');
    },
    
    postDeploy: async (context) => {
      const { logger } = context;
      logger.info('AWS plugin: Post-deployment tasks');
      logger.info('Updating CloudWatch alarms...');
      logger.info('Configuring backup policies...');
    },
    
    onError: async (context, error) => {
      const { logger } = context;
      logger.error(`AWS plugin: Error occurred: ${error.message}`);
      logger.info('Suggestions:');
      logger.info('  - Check AWS credentials');
      logger.info('  - Verify resource limits');
      logger.info('  - Review IAM permissions');
    }
  },

  // Configuration
  configuration: {
    schema: {
      awsRegion: { type: 'string', default: 'us-east-1' },
      enableHealthChecks: { type: 'boolean', default: true },
      maxRetries: { type: 'number', default: 3 },
      timeoutSeconds: { type: 'number', default: 300 }
    },
    defaults: {
      awsRegion: 'us-east-1',
      enableHealthChecks: true,
      maxRetries: 3,
      timeoutSeconds: 300
    },
    validation: async (config) => {
      const errors = [];
      const warnings = [];
      
      if (config.timeoutSeconds < 60) {
        errors.push({
          code: 'INVALID_TIMEOUT',
          message: 'Timeout must be at least 60 seconds',
          field: 'timeoutSeconds',
          suggestion: 'Increase timeout to 60 seconds or more'
        });
      }
      
      if (config.maxRetries > 10) {
        warnings.push({
          code: 'HIGH_RETRY_COUNT',
          message: 'High retry count may cause long delays',
          field: 'maxRetries',
          suggestion: 'Consider reducing maxRetries to 5 or less'
        });
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        info: []
      };
    }
  }
};

module.exports = plugin;

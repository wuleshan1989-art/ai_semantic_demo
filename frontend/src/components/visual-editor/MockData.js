export const MOCK_DATA_SOURCES = [
    {
      id: 'ds1',
      name: 'Production Hive',
      type: 'hive',
      databases: [
        {
          name: 'dw_users',
          tables: [
            { 
              name: 'user_profile', 
              description: 'Core user information',
              columns: [
                { name: 'user_id', type: 'string' },
                { name: 'name', type: 'string' },
                { name: 'email', type: 'string' },
                { name: 'signup_date', type: 'date' },
                { name: 'country', type: 'string' }
              ] 
            },
            { 
              name: 'user_activity_logs', 
              description: 'Daily activity logs',
              columns: [
                { name: 'log_id', type: 'string' },
                { name: 'user_id', type: 'string' },
                { name: 'action', type: 'string' },
                { name: 'timestamp', type: 'timestamp' }
              ] 
            }
          ]
        },
        {
          name: 'dw_sales',
          tables: [
            { 
              name: 'orders', 
              description: 'Sales orders',
              columns: [
                { name: 'order_id', type: 'string' },
                { name: 'user_id', type: 'string' },
                { name: 'amount', type: 'double' },
                { name: 'status', type: 'string' }
              ] 
            }
          ]
        }
      ]
    },
    {
      id: 'ds2',
      name: 'MySQL CRM',
      type: 'mysql',
      databases: [
        {
          name: 'crm_core',
          tables: [
            { 
              name: 'leads', 
              description: 'Sales leads',
              columns: [
                { name: 'lead_id', type: 'int' },
                { name: 'company', type: 'string' },
                { name: 'status', type: 'string' }
              ] 
            }
          ]
        }
      ]
    }
  ];

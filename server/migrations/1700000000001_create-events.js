/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('events', {
    id: 'id',
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
      notNull: false,
    },
    location: {
      type: 'varchar(255)',
      notNull: false,
    },
    starts_at: {
      type: 'timestamptz',
      notNull: true,
    },
    created_by: {
      type: 'integer',
      notNull: false,
      references: 'users',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('events', 'starts_at');
};

exports.down = (pgm) => {
  pgm.dropTable('events');
};

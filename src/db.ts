import pg from 'pg';
import format from 'pg-format';

import { ParsedLinks, ParsedLinksFromDB } from 'src/index.ts';

const client = new pg.Client({
  user: 'postgres',
  password: 'postgres',
  host: '127.0.0.1',
  port: 5433,
  database: 'postgres',
});

client
  .connect()
  .then(() => {
    console.log('Connected to PostgreSQL database');
  })
  .catch((err) => {
    console.error('Error connecting to PostgreSQL database', err);
  });

const innerTableName = 'links';
const outerTableName = 'outerlinks';

// @ts-ignore
const resetTables = () =>
  client
    .query(
      `DROP TABLE ${innerTableName};` +
        `DROP TABLE ${outerTableName};` +
        `CREATE TABLE ${innerTableName} (id serial PRIMARY KEY, href VARCHAR UNIQUE, text VARCHAR, status INTEGER);` +
        `CREATE TABLE ${outerTableName} (id serial PRIMARY KEY, href VARCHAR UNIQUE, text VARCHAR);`,
    )
    .then(() => {
      console.log('TABLES RESET');
    })
    .catch((e) => {
      console.error('Error resetTables [drop]', e);
    });

// resetTables().then(() => {
//   disconnect();
// });

/** ----------- */

export const disconnect = () => {
  client.end();
};

export const cleanup = () => {
  const queryLinks = {
    text: `TRUNCATE ${innerTableName}`,
  };

  const queryOuterlinks = {
    text: `TRUNCATE ${outerTableName}`,
  };

  return Promise.all([client.query(queryLinks), client.query(queryOuterlinks)]).catch((e) => {
    console.error('Error cleanup', e);
  });
};

export const insertInnerLinks = (data: ParsedLinks) => {
  const values = data.map(({ href, text }) => [href, text, 0]);

  return client
    .query(format(`INSERT INTO ${innerTableName}(href, text, status) VALUES %L ON CONFLICT (href) DO NOTHING`, values))
    .catch((e) => {
      if (e.code !== '42601') {
        // syntax error at or near "ON"
        console.error('Error insertInnerLinks', e);
      }
    });
};

export const insertOuterLinks = (data: ParsedLinks) => {
  const values = data.map(({ href, text }) => [href, text]);

  return client
    .query(format(`INSERT INTO ${outerTableName}(href, text) VALUES %L ON CONFLICT (href) DO NOTHING`, values))
    .catch((e) => {
      if (e.code !== '42601') {
        // syntax error at or near "ON"
        console.error('Error insertOuterLinks', e);
      }
    });
};

export const setInnerLinkAsProceeded = (id: number): Promise<number | void> =>
  client
    .query({
      text: `UPDATE ${innerTableName} SET status = 2 WHERE id = $1`,
      values: [id],
    })
    .then(() => id)
    .catch((e) => {
      console.error('Error setInnerLinkAsProceeded', e);
    });

export const getUniqueInnerLinkToProceed = (): Promise<ParsedLinksFromDB[0] | void> =>
  client
    .query({
      text: `SELECT * FROM ${innerTableName} WHERE status = 0 ORDER BY id ASC LIMIT 1`,
    })
    .then((res) => res.rows[0])
    .then((row: ParsedLinksFromDB[0] | void) => {
      if (!row) {
        return Promise.resolve(undefined);
      }

      return client
        .query({
          text: `UPDATE ${innerTableName} SET status = 1 WHERE id = $1`,
          values: [row.id],
        })
        .then(() => row)
        .catch((e) => {
          console.error('Error getInnerLinkToProceed UPDATE', e);
        });
    })
    .catch((e) => {
      console.error('Error getInnerLinkToProceed', e);
    });

const baseGetLinksToFile = (tableName: typeof innerTableName | typeof outerTableName): Promise<ParsedLinksFromDB> =>
  client
    .query({
      text: `SELECT * FROM ${tableName} ORDER BY id ASC`,
    })
    .then((res) =>
      res.rows.map((row) => ({
        id: row.id,
        href: row.href,
        text: row.text,
        status: row.status,
      })),
    )
    .catch((e) => {
      console.error(`Error baseGetLinksToFile (${tableName})`, e);

      throw e;
    });

export const getOuterLinksToFile = (): Promise<ParsedLinksFromDB> => baseGetLinksToFile(outerTableName);

export const getInnerLinksToFile = (): Promise<ParsedLinksFromDB> => baseGetLinksToFile(innerTableName);

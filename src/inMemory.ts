import { ParsedLinks, ParsedLinksFromDB } from 'src/index.ts';

/**
 * in-memory store
 */

/** inner structure */
const dbInner = new Map<number, Omit<ParsedLinksFromDB[0], 'id'>>();

const dbInnerSetHref = new Set<string>();

const dbOuter = new Map<number, Omit<ParsedLinksFromDB[0], 'id'>>();

const dbOuterSetHref = new Set<string>();
/** end inner structure */

export const disconnect: () => void = () => undefined;

export const cleanup = () => Promise.resolve();

export const insertInnerLinks: (data: ParsedLinks) => Promise<void> = (data) => {
  // check unique href
  data
    .filter(({ href }) => {
      if (dbInnerSetHref.has(href)) {
        return false;
      }

      dbInnerSetHref.add(href);
      return true;
    })
    .forEach(({ href, text }) => {
      dbInner.set(dbInner.size, {
        href,
        status: 0,
        text,
      });
    });

  return Promise.resolve();
};

export const insertOuterLinks: (data: ParsedLinks) => Promise<void> = (data) => {
  // check unique href
  data
    .filter(({ href }) => {
      if (dbOuterSetHref.has(href)) {
        return false;
      }

      dbOuterSetHref.add(href);
      return true;
    })
    .forEach(({ href, text }) => {
      dbOuter.set(dbOuter.size, {
        href,
        status: 0,
        text,
      });
    });

  return Promise.resolve();
};

export const setInnerLinkAsProceeded: (id: number) => Promise<number | void> = (id) => {
  const item = dbInner.get(id);

  if (item) {
    dbInner.set(id, { href: item.href, status: 2, text: item.text });

    return Promise.resolve(id);
  }

  return Promise.reject();
};

// todo optimise
export const getUniqueInnerLinkToProceed = (): Promise<ParsedLinksFromDB[0] | void> => {
  for (const dbInnerElement of dbInner) {
    if (dbInnerElement[1].status === 0) {
      dbInner.set(dbInnerElement[0], {
        ...dbInnerElement[1],
        status: 1,
      });

      return Promise.resolve({
        id: dbInnerElement[0],
        ...dbInnerElement[1],
      });
    }
  }

  return Promise.resolve();
};

const baseGetLinksToFile: (tableName: 'links' | 'outerlinks') => Promise<ParsedLinksFromDB> = (tableName) => {
  const arr: ParsedLinksFromDB = new Array(dbInner.size);

  (tableName === 'links' ? dbInner : dbOuter).forEach((item, id) => {
    arr[id] = { href: item.href, status: item.status, text: item.text, id };
  });

  return Promise.resolve(arr);
};

export const getOuterLinksToFile = (): Promise<ParsedLinksFromDB> => baseGetLinksToFile('outerlinks');

export const getInnerLinksToFile = (): Promise<ParsedLinksFromDB> => baseGetLinksToFile('links');

// test
// insertInnerLinks([
//   { href: 'vavava', text: 'initial' },
//   { href: '1', text: '1' },
//   { href: '1', text: '2' },
// ]).then(() => {
//   // getUniqueInnerLinkToProceed().then(console.log);
//
//   setInnerLinkAsProceeded(0).then(() => {
//     getInnerLinksToFile().then((res) => {
//       console.log('getInnerLinksToFile', res);
//     });
//   });
// });

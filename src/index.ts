import { parse } from 'node-html-parser';
import axios, { AxiosError } from 'axios';
import HTMLElement from 'node-html-parser/dist/nodes/html';
import fs from 'fs';

import {
  cleanup,
  disconnect,
  getOuterLinksToFile,
  insertInnerLinks,
  insertOuterLinks,
  getInnerLinkToProceed,
  getInnerLinksToFile,
} from 'src/db.ts';

export type ParsedLinks = { href: string; text: string }[];
export type ParsedLinksFromDB = { href: string; text: string; status: number }[];

const getTextInside = (elem: HTMLElement) => elem.innerText.replace(/\s+/gm, ' ').trim();

const getHref = (elem: HTMLElement) => {
  const href = elem.getAttribute('href');

  return href ? href.replace(/\/$/gm, '') : null;
};

const filterUselessLinks = (elems: ParsedLinks): ParsedLinks => elems.filter((link) => link.href.startsWith('http'));

const getLinks = (elems: HTMLElement[], host: string): { outer: ParsedLinks; inner: ParsedLinks } => {
  const outerLinks: ParsedLinks = [];
  const innerLinks: ParsedLinks = [];

  for (let elem of elems) {
    const href = getHref(elem);

    if (href) {
      (href.includes(host) ? innerLinks : outerLinks).push({ href, text: getTextInside(elem) });
    }
  }

  return { inner: innerLinks, outer: filterUselessLinks(outerLinks) };
};

const parseResponse = (str: string) =>
  parse(str, {
    voidTag: {
      tags: ['link'],
    },
    blockTextElements: {
      script: false,
      noscript: false,
      style: false,
      pre: false,
    },
  });

// HOW TO SPA?
const doParse = (data: any, host: string) => getLinks(parseResponse(data).getElementsByTagName('a'), host);

const linksToString = (links: ParsedLinksFromDB): string =>
  links.map((link) => `${link.href} (${link.text}) [${link.status}]`).join('\n');

const getHost = (url: string): string => {
  const host = new URL(url).host;

  return host.startsWith('www.') ? host.substring(4) : host;
};

const writeToFile = (data: ParsedLinksFromDB, fileName: 'outer' | 'inner'): void => {
  fs.writeFile(`files/${fileName}.txt`, linksToString(data), 'utf8', (error) => {
    if (error) {
      console.error(`[${fileName}] an error occurred while writing to the file:`, error);
      return;
    }
    console.log(`[${fileName}] file has been written successfully.`);
  });
};

const getLinkAndParse = (link: string) =>
  axios
    .get(link)
    .then(({ data }) => {
      const res = doParse(data, getHost(link));

      return Promise.all([insertInnerLinks(res.inner), insertOuterLinks(res.outer)]);
    })
    .catch((e: AxiosError) => {
      console.log(`error getLinkAndParse: [${link}]`, e.message);
      return '';
    });

let counter = 1;
let limit = 100;
let startTime = performance.now();

const startLink = '';

const main = async () => {
  const link = await getInnerLinkToProceed();

  if (link && counter <= limit) {
    await getLinkAndParse(link.href);

    console.log(`iteration ${counter++} is complete`);

    await main();
  } else {
    const resOuter = await getOuterLinksToFile();
    const resInner = await getInnerLinksToFile();

    writeToFile(resOuter, 'outer');
    writeToFile(resInner, 'inner');

    disconnect();

    console.log(`ending. time: ${performance.now() - startTime}`);
  }
};

(async () => {
  await cleanup();

  await insertInnerLinks([{ href: startLink, text: 'initial' }]);

  await main();
})();

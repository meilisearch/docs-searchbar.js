import toFactory from 'to-factory';
import MeiliSearch4Docs from './MeiliSearch4Docs';
import version from './version';

const meilisearch4docs = toFactory(MeiliSearch4Docs);
meilisearch4docs.version = version;

export default meilisearch4docs;

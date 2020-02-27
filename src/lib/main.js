import toFactory from 'to-factory';
import DocsSearchBar from './DocsSearchBar';
import version from './version';

const docsSearchBar = toFactory(DocsSearchBar);
docsSearchBar.version = version;

export default docsSearchBar;

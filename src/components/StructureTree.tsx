import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Home, RefreshCw, Search } from 'lucide-react';
import styles from '../styles/app.module.css';
import { useSession } from '../context/SessionContext';
import {
  buildStructureTree,
  findInStructure,
  type StructureNode,
} from '../features/structure/buildTree';
import { getDirectReports } from '../features/partners/buildPartnerIndex';
import { formatNumber, formatPartnerLabel } from '../utils/formatters';

function TreeBranch({
  node,
  expanded,
  onToggle,
  onOpen,
}: {
  node: StructureNode;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const isOpen = expanded.has(node.partnerNumber);
  const hasChildren = node.children.length > 0;

  return (
    <div className={styles.treeNode}>
      <div className={styles.treeRow}>
        {hasChildren ? (
          <button
            type="button"
            className={styles.treeToggle}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Свернуть' : 'Развернуть'}
            onClick={() => onToggle(node.partnerNumber)}
          >
            {isOpen ? (
              <ChevronDown size={14} strokeWidth={2} />
            ) : (
              <ChevronRight size={14} strokeWidth={2} />
            )}
          </button>
        ) : (
          <span className={styles.treeToggle} aria-hidden>
            ·
          </span>
        )}
        <button
          type="button"
          className={styles.linkBtn}
          onClick={() => onOpen(node.partnerNumber)}
        >
          {node.partner.fullName ?? node.partnerNumber}
        </button>
        <span className={styles.nameSecondary}>{node.partnerNumber}</span>
        <span className={styles.chip}>ур. {node.level}</span>
        <span className={styles.muted}>
          ББ {formatNumber(node.partner.personalBB)} · ПГ{' '}
          {formatNumber(node.partner.groupBB)}
        </span>
      </div>
      {hasChildren && isOpen
        ? node.children.map((child) => (
            <TreeBranch
              key={child.partnerNumber}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              onOpen={onOpen}
            />
          ))
        : null}
    </div>
  );
}

export function StructureTree() {
  const {
    state,
    index,
    hasSponsorField,
    selectPartner,
    setStructureSearch,
    changeRoot,
  } = useSession();
  const rootNumber = state.rootPartnerNumber;
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(rootNumber ? [rootNumber] : []),
  );
  const [compact, setCompact] = useState(false);

  const tree = useMemo(() => {
    if (!index || !rootNumber) return null;
    return buildStructureTree(index, rootNumber, hasSponsorField);
  }, [index, rootNumber, hasSponsorField]);

  const directs = useMemo(() => {
    if (!index || !rootNumber || !hasSponsorField) return [];
    return getDirectReports(index, rootNumber);
  }, [index, rootNumber, hasSponsorField]);

  const searchHits = useMemo(() => {
    if (!tree?.root || !state.structureSearch.trim()) return [];
    return findInStructure(tree.root, state.structureSearch).slice(0, 25);
  }, [tree, state.structureSearch]);

  if (!rootNumber || !index) return null;

  if (!hasSponsorField || !tree?.canBuild || !tree.root) {
    return (
      <section className={styles.panel}>
        <div className={`${styles.alert} ${styles.alertWarn}`}>
          {tree?.message ??
            'Нельзя построить дерево: нет достоверного поля спонсора или связей.'}
        </div>
        <div className={styles.row} style={{ marginTop: 12 }}>
          <button type="button" className={styles.btn} onClick={changeRoot}>
            Выбрать другой корень
          </button>
        </div>
      </section>
    );
  }

  const rootPartner = tree.root.partner;

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandFirstLevel = () => {
    setExpanded(
      new Set([
        tree.root!.partnerNumber,
        ...tree.root!.children.map((c) => c.partnerNumber),
      ]),
    );
  };

  const collapseToRoot = () => {
    setExpanded(new Set([tree.root!.partnerNumber]));
  };

  return (
    <div className={styles.stack}>
      <section className={styles.panel}>
        <p className={styles.sectionLead} style={{ marginBottom: '0.75rem' }}>
          Корень:{' '}
          <strong>
            {formatPartnerLabel(rootPartner.partnerNumber, rootPartner.fullName)}
          </strong>
        </p>
        <div className={styles.treeStats}>
          <span className={styles.chip}>
            В структуре: {tree.nodeCount}
          </span>
          <span className={styles.chip}>
            Непосредственных: {directs.length}
          </span>
          <span className={styles.chip}>Макс. уровень: {tree.maxLevel}</span>
          {tree.truncatedCycles > 0 ? (
            <span className={styles.chip}>Обрывы циклов: {tree.truncatedCycles}</span>
          ) : null}
        </div>

        <div className={styles.field} style={{ marginBottom: 12 }}>
          <label htmlFor="structure-search">Поиск в структуре</label>
          <div className={styles.searchField}>
            <Search size={16} strokeWidth={2} aria-hidden />
            <input
              id="structure-search"
              className={styles.input}
              value={state.structureSearch}
              autoComplete="off"
              onChange={(e) => setStructureSearch(e.target.value)}
              placeholder="Номер или ФИО"
            />
          </div>
        </div>

        {searchHits.length > 0 ? (
          <ul className={styles.list} style={{ marginBottom: 12 }}>
            {searchHits.map((hit) => (
              <li key={hit.partnerNumber}>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => selectPartner(hit.partnerNumber, 'structure')}
                >
                  {formatPartnerLabel(hit.partnerNumber, hit.partner.fullName)}
                </button>
                <span className={styles.muted}> · уровень {hit.level}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className={styles.row}>
          <button type="button" className={styles.btn} onClick={expandFirstLevel}>
            Раскрыть 1-й уровень
          </button>
          <button type="button" className={styles.btn} onClick={collapseToRoot}>
            <Home size={15} strokeWidth={2} />
            К корню
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setCompact((v) => !v)}
          >
            {compact ? 'Показать дерево' : 'Компактный список'}
          </button>
          <button type="button" className={styles.btnGhost} onClick={changeRoot}>
            <RefreshCw size={15} strokeWidth={2} />
            Другой корень
          </button>
        </div>
      </section>

      <section className={styles.panel}>
        {compact ? (
          <div className={styles.directList}>
            {tree.root.children.map((child) => (
              <button
                key={child.partnerNumber}
                type="button"
                className={styles.directItem}
                onClick={() => selectPartner(child.partnerNumber, 'structure')}
              >
                <div className={styles.nameCell}>
                  <span className={styles.namePrimary}>
                    {child.partner.fullName ?? 'Без ФИО'}
                  </span>
                  <span className={styles.nameSecondary}>
                    {child.partnerNumber} · вниз {child.children.length}
                  </span>
                </div>
                <div className={styles.directStats}>
                  ББ {formatNumber(child.partner.personalBB)}
                  <br />
                  ПГ {formatNumber(child.partner.groupBB)}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <TreeBranch
            node={tree.root}
            expanded={expanded}
            onToggle={toggle}
            onOpen={(id) => selectPartner(id, 'structure')}
          />
        )}
      </section>
    </div>
  );
}

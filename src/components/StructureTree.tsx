import { useMemo, useState } from 'react';
import styles from '../styles/app.module.css';
import { useSession } from '../context/SessionContext';
import {
  buildStructureTree,
  findInStructure,
  type StructureNode,
} from '../features/structure/buildTree';
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
            onClick={() => onToggle(node.partnerNumber)}
          >
            {isOpen ? '−' : '+'}
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
          {formatPartnerLabel(node.partner.fullName ? node.partnerNumber : node.partnerNumber, node.partner.fullName)}
        </button>
        <span className={styles.chip}>ур. {node.level}</span>
        <span className={styles.muted}>
          ББ {formatNumber(node.partner.personalBB)} / ПГ{' '}
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

  const searchHits = useMemo(() => {
    if (!tree?.root || !state.structureSearch.trim()) return [];
    return findInStructure(tree.root, state.structureSearch).slice(0, 30);
  }, [tree, state.structureSearch]);

  if (!rootNumber || !index) return null;

  if (!hasSponsorField || !tree?.canBuild || !tree.root) {
    return (
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Структура</h2>
        <div className={`${styles.alert} ${styles.alertWarn}`}>
          {tree?.message ??
            'Нельзя построить дерево: нет достоверного поля спонсора или связей.'}
        </div>
        <button type="button" className={styles.btnGhost} onClick={changeRoot}>
          Выбрать другой корень
        </button>
      </section>
    );
  }

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAllFirstLevel = () => {
    setExpanded(
      new Set([
        tree.root!.partnerNumber,
        ...tree.root!.children.map((c) => c.partnerNumber),
      ]),
    );
  };

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Структура команды</h2>
      <p className={styles.panelLead}>
        Уровни считаются относительно выбранного корня по полю «Спонсор». Колонка
        «Ур» из файла не используется как иерархия анализа.
      </p>

      <div className={styles.row}>
        <span className={styles.chip}>Узлов: {tree.nodeCount}</span>
        <span className={styles.chip}>Макс. уровень: {tree.maxLevel}</span>
        {tree.truncatedCycles > 0 ? (
          <span className={styles.chip}>
            Обрывы циклов: {tree.truncatedCycles}
          </span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="structure-search">Поиск в структуре</label>
        <input
          id="structure-search"
          className={styles.input}
          value={state.structureSearch}
          autoComplete="off"
          onChange={(e) => setStructureSearch(e.target.value)}
          placeholder="Номер или ФИО"
        />
      </div>

      {searchHits.length > 0 ? (
        <ul className={styles.list}>
          {searchHits.map((hit) => (
            <li key={hit.partnerNumber}>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => selectPartner(hit.partnerNumber)}
              >
                {formatPartnerLabel(hit.partnerNumber, hit.partner.fullName)}
              </button>
              <span className={styles.muted}> · уровень {hit.level}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className={styles.row}>
        <button type="button" className={styles.btnGhost} onClick={expandAllFirstLevel}>
          Раскрыть 1-й уровень
        </button>
        <button
          type="button"
          className={styles.btnGhost}
          onClick={() => setCompact((v) => !v)}
        >
          {compact ? 'Дерево' : 'Компактный список'}
        </button>
        <button type="button" className={styles.btnGhost} onClick={changeRoot}>
          Другой корень анализа
        </button>
      </div>

      {compact ? (
        <ul className={styles.list}>
          {tree.root.children.map((child) => (
            <li key={child.partnerNumber}>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => selectPartner(child.partnerNumber)}
              >
                {formatPartnerLabel(child.partnerNumber, child.partner.fullName)}
              </button>
              <span className={styles.muted}>
                {' '}
                · вниз {child.children.length} прямых
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <TreeBranch
          node={tree.root}
          expanded={expanded}
          onToggle={toggle}
          onOpen={selectPartner}
        />
      )}
    </section>
  );
}

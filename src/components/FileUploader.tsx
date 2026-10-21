import { useCallback, useRef, useState, type DragEvent } from 'react';
import { Upload } from 'lucide-react';
import styles from '../styles/app.module.css';
import { useSession } from '../context/SessionContext';

export function FileUploader() {
  const { loadFile, state } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const onFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      await loadFile(file);
    },
    [loadFile],
  );

  const onDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOver(false);
      await onFiles(event.dataTransfer.files);
    },
    [onFiles],
  );

  return (
    <section className={styles.hero}>
      <h1 className={styles.heroBrand}>Анализ структуры Oriflame</h1>

      <div className={styles.panel}>
        <h2 className={styles.blockTitle}>Как начать</h2>
        <ol className={styles.steps}>
          <li>Загрузите информационный листок Excel.</li>
          <li>Проверьте, что колонки распознаны корректно.</li>
          <li>Изучайте обзор, поиск и структуру команды.</li>
        </ol>
      </div>

      <div
        className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <Upload
          size={28}
          strokeWidth={1.75}
          style={{ color: 'var(--ink-muted)', marginBottom: 12 }}
        />
        <p className={styles.sectionLead} style={{ margin: '0 auto 0.5rem' }}>
          Перетащите файл сюда или выберите на устройстве
        </p>
        <p className={styles.muted}>Форматы: .xlsx, .xls</p>
        <div className={styles.row} style={{ justifyContent: 'center', marginTop: 16 }}>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={state.isParsing}
            onClick={() => inputRef.current?.click()}
          >
            {state.isParsing ? (
              <span className={styles.loadingRow}>
                <span className={styles.spinner} aria-hidden />
                Обработка…
              </span>
            ) : (
              'Выбрать файл'
            )}
          </button>
        </div>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={(e) => {
            void onFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div className={styles.privacyNote}>
        <strong>Приватность.</strong> Файл читается только в браузере. Отчёт не
        сохраняется и не уходит во внешние сервисы. После очистки или
        перезагрузки данные исчезают.
      </div>

      {state.importError ? (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          {state.importError}
          <div style={{ marginTop: 8 }}>
            Выберите другой файл или проверьте, что это информационный листок
            Oriflame.
          </div>
        </div>
      ) : null}
    </section>
  );
}
